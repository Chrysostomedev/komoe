/**
 * Client HTTP KOMOE — wraps fetch avec gestion JWT automatique.
 * Stocke access/refresh tokens dans localStorage.
 * Refresh automatique si le token access est expiré (401).
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ─── Token helpers ──────────────────────────────────────────────────────────

export const tokens = {
  getAccess: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem("komoe_access") : null,
  getRefresh: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem("komoe_refresh") : null,
  set: (access: string, refresh: string) => {
    localStorage.setItem("komoe_access", access);
    localStorage.setItem("komoe_refresh", refresh);
    // Cookie for proxy.ts middleware (server-side route protection)
    if (typeof document !== "undefined") {
      document.cookie = `komoe_access=${access}; path=/; max-age=3600; SameSite=Lax`;
    }
  },
  clear: () => {
    localStorage.removeItem("komoe_access");
    localStorage.removeItem("komoe_refresh");
    if (typeof document !== "undefined") {
      document.cookie = "komoe_access=; path=/; max-age=0; SameSite=Lax";
    }
  },
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  data: Record<string, unknown>;
  message: string;
}

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const accessToken = tokens.getAccess();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-refresh si 401
  if (res.status === 401 && retry) {
    const refreshToken = tokens.getRefresh();
    if (!refreshToken) {
      tokens.clear();
      throw { status: 401, data: {}, message: "Session expirée" } as ApiError;
    }

    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!refreshRes.ok) {
      tokens.clear();
      throw { status: 401, data: {}, message: "Session expirée" } as ApiError;
    }

    const { access } = await refreshRes.json();
    tokens.set(access, refreshToken);
    return apiFetch<T>(path, options, false);
  }

  if (!res.ok) {
    let data: Record<string, unknown> = {};
    try { data = await res.json(); } catch { /* vide */ }
    const message =
      (data.detail as string) ||
      Object.values(data).flat().join(" ") ||
      `Erreur ${res.status}`;
    throw { status: res.status, data, message } as ApiError;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── API Auth ────────────────────────────────────────────────────────────────

export interface LoginPayload { email: string; password: string }
export interface LoginResponse { access: string; refresh: string }
export interface RegisterPayload {
  email: string; nom: string; prenom: string;
  role?: string; profession?: string;
  password: string; password_confirm: string;
  telephone?: string; media_organisation?: string;
  commune?: number; date_naissance?: string;
  secondary_roles?: string[]; // ex: ['JOURNALISTE', 'BAILLEUR']
}
export interface UserProfile {
  id: string; email: string; nom: string; prenom: string; full_name: string;
  role: string; profession: string; commune: number | null; commune_nom: string | null;
  wallet_address: string; journaliste_verifie: boolean;
  email_verifie: boolean; is_blockchain_authorized: boolean; avatar: string; reputation_score: number;
  is_active: boolean; is_verified: boolean; is_expert: boolean; date_joined: string; telephone?: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiFetch<LoginResponse>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  register: (payload: RegisterPayload) =>
    apiFetch<{ message: string; user: UserProfile }>("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => apiFetch<UserProfile>("/api/auth/me/"),

  refresh: (refreshToken: string) =>
    apiFetch<{ access: string }>("/api/auth/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    }),

  list: () => apiFetch<{ results: UserProfile[]; count: number }>("/api/auth/users/"),
  
  create: (payload: Record<string, unknown>) => apiFetch<UserProfile>("/api/auth/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  authorizeBlockchain: (id: string, walletAddress: string) =>
    apiFetch<{ message: string; user: UserProfile; tx_hash: string }>(
      `/api/auth/users/${id}/authorize-blockchain/`,
      {
        method: "POST",
        body: JSON.stringify({ wallet_address: walletAddress }),
      }
    ),

  togglePause: (action: "pause" | "unpause") =>
    apiFetch<{ message: string; tx_hash: string }>("/api/auth/blockchain/toggle-pause/", {
      method: "POST",
      body: JSON.stringify({ action }),
    }),

  updateMe: (payload: Partial<UserProfile>) =>
    apiFetch<UserProfile>("/api/auth/me/", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  detail: (id: string) => apiFetch<UserProfile>(`/api/auth/users/${id}/`),
  
  delete: (id: string) => apiFetch<void>(`/api/auth/users/${id}/`, {
    method: "DELETE",
  }),
};

// ─── API Communes ─────────────────────────────────────────────────────────────

export interface Commune {
  id: number; code: string; nom: string; region: string;
  population: number; superficie_km2: number; budget_annuel_fcfa: number;
  maire_nom: string; is_active: boolean;
  budget_depense_fcfa: number;
  score_transparence: number;
  blockchain_tx_hash_dotation?: string;
  created_at: string; updated_at: string;
}

export interface CommuneListFilters {
  search?: string;
  region?: string;
  limit?: number;
  offset?: number;
}

export const communesApi = {
  list: (filters?: CommuneListFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.region) params.set("region", filters.region);
    if (filters?.limit) params.set("limit", String(filters.limit));
    if (filters?.offset) params.set("offset", String(filters.offset));
    const qs = params.toString();
    return apiFetch<{ results: Commune[]; count: number }>(
      `/api/communes/${qs ? `?${qs}` : ""}`
    );
  },
  detail: (id: number) => apiFetch<Commune>(`/api/communes/${id}/`),
  update: (id: number, payload: Partial<Commune>) =>
    apiFetch<Commune>(`/api/communes/admin/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  confirmerDotation: (id: number, txHash: string) =>
    apiFetch<{ message: string }>(`/api/communes/admin/${id}/confirmer-dotation/`, {
      method: "PATCH",
      body: JSON.stringify({ blockchain_tx_hash_dotation: txHash }),
    }),
};


// ─── API Transactions ─────────────────────────────────────────────────────────

export interface Transaction {
  id: string; commune: number; commune_detail: Commune;
  type: "DEPENSE" | "RECETTE"; statut: string;
  montant_fcfa: number; categorie: string; description: string;
  periode: string; ipfs_hash: string; ipfs_url: string;
  blockchain_tx_hash_soumission: string;
  blockchain_tx_hash_validation: string;
  soumis_par_detail: UserProfile | null;
  valide_par_detail: UserProfile | null;
  created_at: string; validated_at: string | null;
  updated_at: string;
}

export interface TransactionListFilters {
  commune?: number;
  type?: "DEPENSE" | "RECETTE";
  statut?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionCreatePayload {
  commune: number;
  type: "DEPENSE" | "RECETTE";
  montant_fcfa: number;
  categorie: string;
  description: string;
  periode: string;
  ipfs_hash?: string;
  blockchain_tx_hash_soumission?: string;
}

export const transactionsApi = {
  list: (filters?: TransactionListFilters) => {
    const params = new URLSearchParams();
    if (filters?.commune) params.set("commune", String(filters.commune));
    if (filters?.type) params.set("type", filters.type);
    if (filters?.statut) params.set("statut", filters.statut);
    if (filters?.limit) params.set("limit", String(filters.limit));
    if (filters?.offset) params.set("offset", String(filters.offset));
    const qs = params.toString();
    return apiFetch<{ results: Transaction[]; count: number }>(
      `/api/transactions/${qs ? `?${qs}` : ""}`
    );
  },

  byCommune: (communeId: number, filters?: Omit<TransactionListFilters, "commune">) => {
    const params = new URLSearchParams();
    if (filters?.statut) params.set("statut", filters.statut);
    if (filters?.type) params.set("type", filters.type);
    if (filters?.limit) params.set("limit", String(filters.limit));
    if (filters?.offset) params.set("offset", String(filters.offset));
    const qs = params.toString();
    return apiFetch<{ results: Transaction[]; count: number }>(
      `/api/transactions/commune/${communeId}/${qs ? `?${qs}` : ""}`
    );
  },

  detail: (id: string) =>
    apiFetch<Transaction>(`/api/transactions/${id}/`),

  soumettre: (payload: TransactionCreatePayload) =>
    apiFetch<Transaction>("/api/transactions/soumettre/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/transactions/${id}/`, {
      method: "DELETE",
    }),

  update: (id: string, payload: Partial<TransactionCreatePayload>) =>
    apiFetch<Transaction>(`/api/transactions/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  valider: (id: string, txHash?: string) =>
    apiFetch<{ message: string; transaction: Transaction }>(
      `/api/transactions/${id}/valider/`,
      {
        method: "PATCH",
        body: JSON.stringify({ blockchain_tx_hash: txHash ?? null })
      }
    ),

  rejeter: (id: string, motif: string) =>
    apiFetch<{ message: string; transaction: Transaction }>(
      `/api/transactions/${id}/rejeter/`,
      {
        method: "PATCH",
        body: JSON.stringify({ motif }),
      }
    ),

  confirmerHash: (id: string, txHash: string) =>
    apiFetch<{ message: string; transaction: Transaction }>(
      `/api/transactions/${id}/confirmer-hash/`,
      {
        method: "PATCH",
        body: JSON.stringify({ blockchain_tx_hash_soumission: txHash }),
      }
    ),

  creerRecette: (payload: Omit<TransactionCreatePayload, "type">) =>
    apiFetch<Transaction>("/api/transactions/recettes/", {
      method: "POST",
      body: JSON.stringify({ ...payload, type: "RECETTE" }),
    }),

  confirmerRecette: (id: string, txHash: string) =>
    apiFetch<{ message: string; transaction: Transaction }>(
      `/api/transactions/recettes/${id}/confirmer/`,
      {
        method: "PATCH",
        body: JSON.stringify({ blockchain_tx_hash_validation: txHash }),
      }
    ),
};

export interface Signalement {
  id: string;
  commune: number;
  commune_detail: Commune;
  sujet: string;
  description: string;
  transaction: string | null;
  auteur: string | null;
  auteur_detail: UserProfile | null;
  is_reviewed: boolean;
  nb_preuves: number;
  created_at: string;
}

export interface SignalementCreatePayload {
  commune: number;
  sujet: string;
  description: string;
  transaction?: string | null;
}

export interface PreuveSignalement {
  id: string;
  signalement: string;
  ipfs_hash: string;
  ipfs_url: string;
  nom_fichier: string;
  type_fichier: "image" | "pdf" | "autre";
  uploaded_at: string;
}


// ─── H3 : Propositions de dépenses ──────────────────────────────────────────

export interface Proposition {
  id: string;
  commune: number;
  commune_detail?: { id: number; nom: string; region: string };
  titre: string;
  description: string;
  categorie: string;
  budget_demande_fcfa: number;
  soumis_par?: string;
  soumis_par_detail?: { id: string; full_name: string };
  statut: "ACTIVE" | "VALIDEE" | "REJETEE" | "EXPIREE" | "CONVERTIE";
  deadline_vote: string | null;
  nb_soutiens: number;
  nb_oppositions: number;
  score_vote: number;
  pct_soutien: number;
  mon_vote: "SOUTIEN" | "OPPOSITION" | null;
  created_at: string;
  updated_at: string;
}

export interface PropositionCreatePayload {
  commune: number;
  titre: string;
  description: string;
  categorie: string;
  budget_demande_fcfa: number;
}

export const propositionsApi = {
  list: (filters?: { commune?: number; statut?: string }) => {
    const params = new URLSearchParams();
    if (filters?.commune) params.set("commune", String(filters.commune));
    if (filters?.statut) params.set("statut", filters.statut);
    const qs = params.toString();
    return apiFetch<{ results: Proposition[]; count: number }>(
      `/api/transactions/propositions/${qs ? `?${qs}` : ""}`
    );
  },
  detail: (id: string) =>
    apiFetch<Proposition>(`/api/transactions/propositions/${id}/`),
  create: (payload: PropositionCreatePayload) =>
    apiFetch<Proposition>("/api/transactions/propositions/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  voter: (id: string, type_vote: "SOUTIEN" | "OPPOSITION") =>
    apiFetch<{ message: string; nb_soutiens: number; nb_oppositions: number; pct_soutien: number; statut: string }>(
      `/api/transactions/propositions/${id}/voter/`,
      { method: "POST", body: JSON.stringify({ type_vote }) }
    ),
  retirerVote: (id: string) =>
    apiFetch<{ message: string }>(`/api/transactions/propositions/${id}/voter/`, { method: "DELETE" }),
};


// ─── Phase 2 : Rapports & Notifications ──────────────────────────────────────

export interface AppNotification {
  id: string;
  titre: string;
  message: string;
  type_notif: "TRANSACTION" | "VOTE" | "PROPOSITION" | "SIGNALEMENT" | "SYSTEME";
  is_read: boolean;
  created_at: string;
}

export const rapportsApi = {
  getDownloadUrl: (communeId: number) => 
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/transactions/commune/${communeId}/rapport/`,
};

export const notificationsApi = {
  list: () => apiFetch<AppNotification[]>("/api/transactions/notifications/"),
  marquerLues: () => apiFetch<{ message: string }>("/api/transactions/notifications/read/", { method: "PATCH" }),
  getStreamUrl: () => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/transactions/notifications/stream/`,
};

export const signalementsApi = {
  list: (params?: { commune?: number; mes_signalements?: boolean }) => {
    const search = new URLSearchParams();
    if (params?.commune) search.set("commune", params.commune.toString());
    if (params?.mes_signalements) search.set("mes_signalements", "true");
    return apiFetch<{ results: Signalement[]; count: number }>(`/api/transactions/signalements/?${search.toString()}`);
  },
  detail: (id: string) => apiFetch<Signalement>(`/api/transactions/signalements/${id}/`),
  create: (data: SignalementCreatePayload) => apiFetch<Signalement>("/api/transactions/signalements/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Signalement>) => apiFetch<Signalement>(`/api/transactions/signalements/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  voter: (id: string, verdict: "CREDIBLE" | "INFONDE") => 
    apiFetch<{ message: string }>(`/api/transactions/signalements/${id}/voter/`, { method: "POST", body: JSON.stringify({ verdict }) }),
  ajouterPreuve: (id: string, data: { ipfs_hash: string; ipfs_url: string; nom_fichier: string; type_fichier: string }) => 
    apiFetch<PreuveSignalement>(`/api/transactions/signalements/${id}/preuves/`, { method: "POST", body: JSON.stringify(data) }),
};

export const anomaliesApi = {
  list: () => apiFetch<{ anomalies: unknown[] }>("/api/transactions/anomalies/"),
};

export const openDataApi = {
  getStats: () => apiFetch<Record<string, unknown>>("/api/transactions/open/stats/"),
};

export const projetsApi = {
  list: (communeId?: number) => {
    const url = communeId ? `/api/communes/projets/?commune=${communeId}` : "/api/communes/projets/";
    return apiFetch<unknown[]>(url);
  },
  getDetail: (id: number) => apiFetch<Record<string, unknown>>(`/api/communes/projets/${id}/`),
};
