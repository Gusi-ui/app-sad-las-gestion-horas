import { useState, useEffect, useCallback } from 'react';

export interface MonthlyBalance {
  id?: string;
  user_id: string;
  year: number;
  month: number;
  assigned_hours: number;
  real_hours: number;
  difference: number;
  created_at?: string;
}

interface UseMonthlyBalancesOptions {
  user_id?: string;
  worker_id?: string;
  year?: number;
  month?: number;
}

export function useMonthlyBalances(options: UseMonthlyBalancesOptions = {}) {
  const [balances, setBalances] = useState<MonthlyBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = '/api/monthly-balances?';
      if (options.user_id) url += `user_id=${options.user_id}&`;
      if (options.worker_id) url += `worker_id=${options.worker_id}&`;
      if (options.year) url += `year=${options.year}&`;
      if (options.month) url += `month=${options.month}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar balances');
      setBalances(data.balances || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error inesperado al cargar balances');
      } else {
        setError('Error inesperado al cargar balances');
      }
      setBalances([]);
    } finally {
      setLoading(false);
    }
  }, [options.user_id, options.worker_id, options.year, options.month]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances
  };
} 