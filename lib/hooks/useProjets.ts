"use client";

import { useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api";

export interface Projet {
  id: string;
  commune: number;
  commune_nom: string;
  nom: string;
  description: string;
  budget_alloue_fcfa: number;
  taux_execution: number;
  statut: string;
  bailleur: string;
  bailleur_nom: string;
  created_at: string;
}

export function useProjets() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // On assume que authApi aura une méthode pour les projets ou on utilise fetch directement
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communes/projets/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Erreur lors de la récupération des projets");
      const data = await res.json();
      setProjets(data.results ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { projets, loading, error, refetch: fetchData };
}
