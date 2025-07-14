import { useState, useEffect } from 'react';
import { WorkerUserBalance } from '@/lib/calculateWorkerBalance';

export function useWorkerUserBalance(workerId: string | null) {
  const [balance, setBalance] = useState<WorkerUserBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const fetchBalance = async (month: number = currentMonth, year: number = currentYear) => {
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
    } catch (err: any) {
      console.error('Error al calcular balance por usuario:', err);
      setError(err.message || 'Error al calcular el balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [workerId]);

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