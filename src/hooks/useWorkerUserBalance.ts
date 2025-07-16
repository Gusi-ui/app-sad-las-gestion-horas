import { useState, useEffect, useCallback } from 'react';
import { WorkerUserBalance } from '@/lib/calculateWorkerBalance';

export function useWorkerUserBalance(workerId: string | null) {
  const [balance, setBalance] = useState<WorkerUserBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const fetchBalance = useCallback(async (month: number = currentMonth, year: number = currentYear) => {
    if (!workerId) {
      setBalance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/worker/user-balance?workerId=${workerId}&month=${month}&year=${year}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const balanceData = await response.json();
      setBalance(balanceData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al calcular el balance');
      } else {
        setError('Error desconocido al calcular el balance');
      }
    } finally {
      setLoading(false);
    }
  }, [workerId, currentMonth, currentYear]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const refetch = (month?: number, year?: number) => {
    fetchBalance(month, year);
  };

  return {
    balance,
    loading,
    error,
    refetch
  };
} 