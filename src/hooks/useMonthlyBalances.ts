import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MonthlyBalance {
  id: string;
  user_id: string;
  month: number;
  year: number;
  total_hours: number;
  laborable_hours: number;
  holiday_hours: number;
  assigned_hours: number;
  difference: number;
  holiday_info: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  name: string;
  surname: string;
  is_active: boolean;
}

export function useMonthlyBalances() {
  const [balances, setBalances] = useState<MonthlyBalance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Error de configuración: Supabase no está configurado');
        return;
      }

      // Obtener balances mensuales
      const { data: balancesData, error: balancesError } = await supabase
        .from('monthly_hours')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (balancesError) {
        console.error('Error fetching monthly balances:', balancesError);
        setError('Error al cargar los balances mensuales');
        return;
      }

      // Obtener usuarios para combinar información
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, surname, is_active');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        setError('Error al cargar información de usuarios');
        return;
      }

      setBalances(balancesData || []);
      setUsers(usersData || []);
    } catch (err) {
      console.error('Unexpected error fetching monthly balances:', err);
      setError('Error inesperado al cargar los balances mensuales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  return {
    balances,
    users,
    loading,
    error,
    refetch: fetchBalances
  };
} 