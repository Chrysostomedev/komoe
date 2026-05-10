"use client";

import { useState, useEffect, useCallback } from "react";
import { communesApi, type Commune, type CommuneListFilters } from "@/lib/api";

export type { Commune, CommuneListFilters };

// ─── Hook : liste des communes ────────────────────────────────────────────────

export function useCommunesList(filters?: CommuneListFilters) {
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = filters?.search ?? "";
  const region = filters?.region ?? "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await communesApi.list({ 
        search: search || undefined, 
        region: region || undefined,
        limit: 1000 
      } as any);
      
      // Si la pagination est désactivée, res est directement un tableau.
      // Sinon, c'est un objet avec .results
      const data = Array.isArray(res) ? res : (res as any).results || [];
      setCommunes(data);
      setCount(Array.isArray(res) ? data.length : (res as any).count || data.length);
    } catch {

      setError("Impossible de charger les communes.");
    } finally {
      setLoading(false);
    }
  }, [search, region]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { communes, count, loading, error, refetch: fetchData };
}

// ─── Hook : détail d'une commune ──────────────────────────────────────────────

export function useCommuneDetail(id: number | null) {
  const [commune, setCommune] = useState<Commune | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    communesApi.detail(id)
      .then(setCommune)
      .catch(() => setError("Commune introuvable."))
      .finally(() => setLoading(false));
  }, [id]);

  return { commune, loading, error };
}
