"use client";

import { useState, useEffect, useCallback } from "react";
import { authApi, type UserProfile } from "@/lib/api";

export function useUsersList() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.list();
      setUsers(res.results ?? []);
    } catch {
      setError("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { users, loading, error, refetch: fetchData };
}
