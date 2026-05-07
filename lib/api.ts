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
}
export interface UserProfile {
  id: string; email: string; nom: string; prenom: string; full_name: string;
  role: string; profession: string; commune: number | null; commune_nom: string | null;
  wallet_address: string; journaliste_verifie: boolean;
  email_verifie: boolean; avatar: string; reputation_score: number;
  is_active: boolean; date_joined: string; telephone?: string;
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
};

// ─── API Communes ─────────────────────────────────────────────────────────────

export interface Commune {
  id: number; code: string; nom: string; region: string;
  population: number; superficie_km2: number; budget_annuel_fcfa: number;
  maire_nom: string; is_active: boolean;
  budget_depense_fcfa: number;
  score_transparence: number;
  created_at: string; updated_at: string;
}

export interface CommuneListFilters {
  search?: string;
  region?: string;
}

export const communesApi = {
  list: (filters?: CommuneListFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.region) params.set("region", filters.region);
    const qs = params.toString();
    return apiFetch<{ results: Commune[]; count: number }>(
      `/api/communes/${qs ? `?${qs}` : ""}`
    );
  },
  detail: (id: number) => apiFetch<Commune>(`/api/communes/${id}/`),
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
}

export interface TransactionCreatePayload {
  commune: number;
  type: "DEPENSE" | "RECETTE";
  montant_fcfa: number;
  categorie: string;
  description: string;
  periode: string;
  ipfs_hash?: string;
}

export const transactionsApi = {
  list: (filters?: TransactionListFilters) => {
    const params = new URLSearchParams();
    if (filters?.commune) params.set("commune", String(filters.commune));
    if (filters?.type) params.set("type", filters.type);
    if (filters?.statut) params.set("statut", filters.statut);
    const qs = params.toString();
    return apiFetch<{ results: Transaction[]; count: number }>(
      `/api/transactions/${qs ? `?${qs}` : ""}`
    );
  },

  byCommune: (communeId: number, filters?: Omit<TransactionListFilters, "commune">) => {
    const params = new URLSearchParams();
    if (filters?.statut) params.set("statut", filters.statut);
    if (filters?.type) params.set("type", filters.type);
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

  valider: (id: string) =>
    apiFetch<{ message: string; transaction: Transaction }>(
      `/api/transactions/${id}/valider/`,
      { method: "PATCH" }
    ),
};

export interface Signalement {
  id: string;
  commune: number;
  commune_detail: Commune;
  sujet: string;
  description: string;
  auteur: string | null;
  auteur_detail: UserProfile | null;
  is_reviewed: boolean;
  created_at: string;
}

export interface SignalementCreatePayload {
  commune: number;
  sujet: string;
  description: string;
}

export const signalementsApi = {
  list: (filters?: { commune?: number }) => {
    const params = new URLSearchParams();
    if (filters?.commune) params.set("commune", String(filters.commune));
    const qs = params.toString();
    return apiFetch<{ results: Signalement[]; count: number }>(
      `/api/transactions/signalements/${qs ? `?${qs}` : ""}`
    );
  },
  create: (payload: SignalementCreatePayload) =>
    apiFetch<Signalement>("/api/transactions/signalements/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

