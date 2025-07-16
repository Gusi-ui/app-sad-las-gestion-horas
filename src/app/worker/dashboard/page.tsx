"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, RotateCcw, AlertTriangle } from "lucide-react";
import { useWorkerUserBalance } from "@/hooks/useWorkerUserBalance";
import { UserBalanceCard } from "@/components/UserBalanceCard";
import type { Worker } from "@/lib/types";
import { useRouter } from 'next/navigation';

export default function WorkerDashboard() {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Usar el hook para obtener el balance por usuario
  const {
    balance: userBalance,
    loading: userBalanceLoading,
    error: userBalanceError,
    refetch: refetchUserBalance
  } = useWorkerUserBalance(worker?.id || null);

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        setLoading(true);
        if (!supabase) {
          setError('Error de configuración: Supabase no está configurado');
          setLoading(false);
          return;
        }
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('No autenticado');
          setLoading(false);
          return;
        }
        const { data: workerData, error: workerError } = await supabase
          .from('workers')
          .select('*')
          .eq('email', user.email)
          .single();
        if (workerError || !workerData) {
          setError('No se encontró la trabajadora');
          setLoading(false);
          return;
        }
        setWorker(workerData);
      } catch {
        setError('Error al cargar los datos de la trabajadora');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkerData();
  }, []);

  // Función para cerrar sesión
  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/worker/login');
  };

  if (loading || userBalanceLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || userBalanceError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error al cargar datos: {error || userBalanceError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
            <p className="text-danger mb-4">No se encontró la trabajadora.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Buscar José Martínez específicamente
  const joseMartinez = userBalance?.userBalances.find(
    user => user.userName === 'Jose' && user.userSurname === 'Martínez Blanquez'
  );

  // Si no está José Martínez, mostrar el primer usuario
  const userToShow = joseMartinez || userBalance?.userBalances[0];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Botón de logout arriba a la derecha */}
      <div className="flex justify-end max-w-2xl mx-auto px-4 pt-4">
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition"
        >
          Cerrar sesión
        </button>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Balance General de la Trabajadora */}
        <Card className="sm:mx-0 -mx-4 rounded-none sm:rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between whitespace-nowrap">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Balance General - {worker.name}
              </div>
              <button
                onClick={() => refetchUserBalance()}
                className="text-xs px-2 py-1 border rounded bg-slate-100 hover:bg-slate-200"
              >
                <RotateCcw className="w-3 h-3 mr-1 inline" />
                Actualizar
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="sm:px-6 px-0">
            {userBalance && userBalance.userBalances.length > 0 ? (
              <div className="px-2">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-blue-900">
                      Resumen General
                    </h4>
                    <Badge className={`${
                      userBalance.overallStatus === 'excess' ? 'bg-red-100 text-red-800 border-red-200' :
                      userBalance.overallStatus === 'deficit' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-green-100 text-green-800 border-green-200'
                    }`}>
                      {userBalance.overallStatus === 'excess' ? '⚠️ Exceso' :
                       userBalance.overallStatus === 'deficit' ? '📋 Pendiente' :
                       '✅ Perfecto'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">{userBalance.totalAssignedHours}h</div>
                      <div className="text-blue-700">Horas Asignadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-900">{userBalance.totalUsedHours}h</div>
                      <div className="text-green-700">Horas Realizadas</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        userBalance.totalRemainingHours > 0 ? 'text-yellow-900' : 'text-red-900'
                      }`}>
                        {userBalance.totalRemainingHours > 0 ? '+' : ''}{userBalance.totalRemainingHours}h
                      </div>
                      <div className={userBalance.totalRemainingHours > 0 ? 'text-yellow-700' : 'text-red-700'}>
                        {userBalance.totalRemainingHours > 0 ? 'Horas Pendientes' : 'Horas de Exceso'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">
                  <Users className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No hay balance general</h3>
                <p className="text-slate-600">
                  No se encontraron asignaciones activas para calcular el balance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balance de Usuario Específico */}
        <Card className="sm:mx-0 -mx-4 rounded-none sm:rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between whitespace-nowrap">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                {joseMartinez ? 'Balance de José Martínez' : 'Balance de Usuario'}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="sm:px-6 px-0">
            {userToShow ? (
              <div className="px-2">
                <UserBalanceCard
                  userBalance={userToShow}
                  className="sm:mx-0 -mx-4"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">
                  <Users className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {joseMartinez ? 'José Martínez no encontrado' : 'No hay usuarios asignados'}
                </h3>
                <p className="text-slate-600">
                  {joseMartinez 
                    ? 'José Martínez no está asignado a esta trabajadora.' 
                    : 'No se encontraron asignaciones activas.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}