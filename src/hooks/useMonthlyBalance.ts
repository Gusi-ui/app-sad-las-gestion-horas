import { useState, useEffect, useCallback } from 'react';

interface MonthlyBalance {
  id: string;
  worker_id: string;
  user_id: string;
  month: number;
  year: number;
  assigned_hours: number;
  scheduled_hours: number;
  balance: number;
  status: 'on_track' | 'over_scheduled' | 'under_scheduled' | 'completed';
  message: string;
  planning: unknown; // Changed from 'any' to 'unknown'
  created_at: string;
  updated_at: string;
  users?: {
    name: string;
    surname: string;
    address?: string;
  };
  // Información de festivos (opcional, para balances nuevos)
  holidayInfo?: {
    totalHolidays: number;
    holidayHours: number;
    workingDays: number;
    workingHours: number;
  };
  // Información de reasignaciones (nueva)
  reassignmentInfo?: {
    hasReassignments: boolean;
    reassignmentCount: number;
    reassignmentDates?: string[];
  };
}

interface UseMonthlyBalanceReturn {
  balances: MonthlyBalance[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMonthlyBalance(workerId: string | null): UseMonthlyBalanceReturn {
  const [balances, setBalances] = useState<MonthlyBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!workerId) {
      setBalances([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() devuelve 0-11
      const currentYear = currentDate.getFullYear();

      const response = await fetch(`/api/worker/monthly-balance?workerId=${workerId}&month=${currentMonth}&year=${currentYear}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const balancesWithReassignments = data.balances || [];

      // Enriquecer balances con información de reasignaciones
      try {
        for (let i = 0; i < balancesWithReassignments.length; i++) {
          const balance = balancesWithReassignments[i];
          
          // Obtener información de reasignaciones para este usuario
          const reassignmentResponse = await fetch(`/api/admin/test-balance-data?userId=${balance.user_id}&month=${currentMonth}&year=${currentYear}`);
          if (reassignmentResponse.ok) {
            const reassignmentData = await reassignmentResponse.json();
            
            if (reassignmentData.assignments && reassignmentData.assignments.length > 0) {
              // Usar la lógica de reasignación para detectar reasignaciones
              const { generateMonthlyPlanningWithHolidayReassignment } = await import('@/lib/holidayReassignment');
              
              const planningResult = await generateMonthlyPlanningWithHolidayReassignment(
                reassignmentData.assignments,
                balance.user_id,
                currentMonth,
                currentYear
              );

              if (planningResult.reassignments.length > 0) {
                balancesWithReassignments[i] = {
                  ...balance,
                  reassignmentInfo: {
                    hasReassignments: true,
                    reassignmentCount: planningResult.reassignments.length,
                    reassignmentDates: planningResult.reassignments.map((r: { date: string }) => {
                      const date = new Date(r.date);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    })
                  }
                };
              } else {
                balancesWithReassignments[i] = {
                  ...balance,
                  reassignmentInfo: {
                    hasReassignments: false,
                    reassignmentCount: 0,
                    reassignmentDates: []
                  }
                };
              }
            }
          }
        }
      } catch {
        // setError('Error enriching balances with reassignment info:'); // Original line commented out
      }

      setBalances(balancesWithReassignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los balances mensuales');
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchBalances();
  }, [workerId, fetchBalances]);

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances
  };
} 