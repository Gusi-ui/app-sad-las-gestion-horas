"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatScheduleOrdered } from "@/lib/utils";
import { ScheduleDisplay } from "@/components/ScheduleDisplay";
import { HoursStatusCard } from "@/components/HoursStatusCard";
import { DetailedHoursStatusCard } from "@/components/DetailedHoursStatusCard";
import { useHoursCalculation } from "@/hooks/useHoursCalculation";
import { useMonthlyBalance } from "@/hooks/useMonthlyBalance";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, CheckCircle, TrendingUp, TrendingDown, AlertTriangle, MapPin, Phone, Mail, UserCheck, RotateCcw, Users, Coffee, CalendarDays, BarChart3, Star } from "lucide-react";
import { Worker, Assignment, User as UserType } from "@/lib/types";
import Link from "next/link";
import { MonthlyBalanceCard } from "@/components/MonthlyBalanceCard";
import { HolidaysInfoCard } from "@/components/HolidaysInfoCard";

interface AssignmentWithUser extends Assignment {
  users?: UserType;
}

export default function WorkerDashboard() {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [completedServices, setCompletedServices] = useState<Set<string>>(() => {
    // Cargar servicios completados desde localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('completedServices');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar el hook personalizado para el cálculo de horas
  const {
    assignments,
    userHoursStatus,
    stats,
    loading: hoursLoading,
    error: hoursError,
    getServiceStatus,
    getTodaySchedule,
    hasServiceToday
  } = useHoursCalculation(worker?.id || null);

  // Usar el hook para obtener el balance mensual
  const {
    balances: monthlyBalances,
    loading: balanceLoading,
    error: balanceError,
    refetch: refetchBalances
  } = useMonthlyBalance(worker?.id || null);

  // Estado para festivos de hoy
  const [todayHolidays, setTodayHolidays] = useState<Array<{name: string, type: string}>>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);

  // Estado para información de reasignaciones
  const [reassignmentInfo, setReassignmentInfo] = useState<Map<string, {
    hasReassignments: boolean;
    reassignmentCount: number;
    reassignmentDates: string[];
  }>>(new Map());

  // Función para obtener información de reasignaciones
  const fetchReassignmentInfo = async () => {
    if (!worker?.id || !assignments.length) return;

    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Obtener usuarios únicos de las asignaciones
      const uniqueUsers = new Set(assignments.map(a => a.user_id));
      const reassignmentMap = new Map();

      for (const userId of uniqueUsers) {
        try {
          // Obtener todas las asignaciones del usuario (no solo las de esta trabajadora)
          const response = await fetch(`/api/admin/test-balance-data?userId=${userId}&month=${currentMonth}&year=${currentYear}`);
          if (response.ok) {
            const data = await response.json();
            
            if (data.assignments && data.assignments.length > 0) {
              // Usar la lógica de reasignación para detectar reasignaciones
              const { generateMonthlyPlanningWithHolidayReassignment } = await import('@/lib/holidayReassignment');
              
              const planningResult = await generateMonthlyPlanningWithHolidayReassignment(
                data.assignments,
                userId,
                currentMonth,
                currentYear
              );

              if (planningResult.reassignments.length > 0) {
                reassignmentMap.set(userId, {
                  hasReassignments: true,
                  reassignmentCount: planningResult.reassignments.length,
                  reassignmentDates: planningResult.reassignments.map((r: any) => {
                    const date = new Date(r.date);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  })
                });
              } else {
                reassignmentMap.set(userId, {
                  hasReassignments: false,
                  reassignmentCount: 0,
                  reassignmentDates: []
                });
              }
            }
          }
        } catch (error) {
          console.error('Error fetching reassignment info for user:', userId, error);
          // Continuar con el siguiente usuario
        }
      }

      setReassignmentInfo(reassignmentMap);
    } catch (error) {
      console.error('Error fetching reassignment info:', error);
    }
  };

  // Cargar información de reasignaciones cuando cambien las asignaciones
  useEffect(() => {
    if (assignments.length > 0 && !hoursLoading) {
      fetchReassignmentInfo();
    }
  }, [assignments, hoursLoading, worker?.id]);

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        setLoading(true);
        
        // Verificar que supabase esté configurado
        if (!supabase) {
          setError('Error de configuración: Supabase no está configurado');
          setLoading(false);
          return;
        }
        
        // Obtener usuario actual
        const { data: { user }, error: userError } = await supabase!.auth.getUser();
        if (userError || !user) {
          router.push('/worker/login');
          return;
        }

        // Obtener datos de la trabajadora
        const { data: workerData, error: workerError } = await supabase!
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
        
      } catch (err) {
        console.error('Error fetching worker data:', err);
        setError('Error al cargar los datos de la trabajadora');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkerData().catch(err => {
      console.error('Unhandled error in fetchWorkerData:', err);
      setError('Error inesperado al cargar los datos de la trabajadora');
      setLoading(false);
    });
  }, [router]);

  // Cargar festivos de hoy
  useEffect(() => {
    const fetchTodayHolidays = async () => {
      try {
        setHolidaysLoading(true);
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        
        const response = await fetch(`/api/holidays?year=${year}&month=${month}`);
        const data = await response.json();
        
        if (response.ok && data.holidays) {
          const todayHolidays = data.holidays.filter((holiday: any) => 
            holiday.day === day
          );
          setTodayHolidays(todayHolidays);
        }
      } catch (error) {
        console.error('Error fetching today holidays:', error);
      } finally {
        setHolidaysLoading(false);
      }
    };

    fetchTodayHolidays();
  }, []);

  const clearCompletedServices = () => {
    setCompletedServices(new Set());
    localStorage.removeItem('completedServices');
  };

  // Función para formatear los horarios de una asignación
  const formatSchedule = (schedule: Record<string, any[]> | undefined) => {
    if (!schedule) return 'Sin horario específico'
    
    const dayNames: Record<string, string> = {
      monday: 'Lunes',
      tuesday: 'Martes', 
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    }
    
    const today = new Date();
    const todayDayName = Object.keys(dayNames)[today.getDay() === 0 ? 6 : today.getDay() - 1];

    // Usar la función de utilidad para ordenar cronológicamente
    const orderedSchedule = formatScheduleOrdered(schedule, dayNames);
    
    if (orderedSchedule === 'No configurado') return 'Sin horario específico';
    
    // Agregar indicador de "HOY" si hay servicio hoy
    const todaySchedule = schedule[todayDayName];
    if (todaySchedule && todaySchedule.length > 0) {
      const todaySlots = todaySchedule.length === 2 && typeof todaySchedule[0] === 'string' && typeof todaySchedule[1] === 'string'
        ? `${todaySchedule[0]} - ${todaySchedule[1]}`
        : todaySchedule.map((slot: any) => `${slot.start}-${slot.end}`).join(', ');
      
      return orderedSchedule.replace(
        `${dayNames[todayDayName]}: ${todaySlots}`,
        `🕐 HOY: ${dayNames[todayDayName]} ${todaySlots}`
      );
    }
    
    return orderedSchedule;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in-progress':
        return 'text-orange-600';
      case 'pending':
        return 'text-blue-600';
      case 'no-service':
        return 'text-slate-500';
      default:
        return 'text-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in-progress':
        return '🔄';
      case 'pending':
        return '⏰';
      case 'no-service':
        return '📅';
      default:
        return '📋';
    }
  };

  if (loading || hoursLoading || balanceLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || hoursError || balanceError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error al cargar datos: {error || hoursError}</p>
            <Link href="/worker/login">
              <Button>Volver al Login</Button>
            </Link>
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

  // Servicios de hoy
  const todaysAssignments = stats.todaysAssignments;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-slate-700 font-medium whitespace-nowrap text-base pr-2">Servicios y horarios asignados.</span>
            <Button
              onClick={() => router.push("/worker/planning")}
              className="bg-blue-500 hover:bg-blue-600 text-white shadow rounded px-4 py-2 transition-colors mt-2 sm:mt-0"
            >
              Ver Planning
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Bienvenida */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              {(() => {
                const now = new Date();
                const hour = now.getHours();
                let saludo = "Buenos días";
                if (hour >= 14 && hour < 21) saludo = "Buenas tardes";
                else if (hour >= 21 || hour < 6) saludo = "Buenas noches";
                return `Bienvenida, ${worker.name}. ${saludo}`;
              })()}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>

        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-blue-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-700">Usuarios Atendidos</p>
                  <p className="text-xl font-bold text-blue-900">{stats.uniqueUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-green-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-green-700">Horas Asignadas</p>
                  <p className="text-xl font-bold text-green-900">{stats.totalAssignedHours.toFixed(1)}h/sem</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-purple-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-purple-700">Servicios Hoy</p>
                  <p className="text-xl font-bold text-purple-900">{todaysAssignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Servicios de Hoy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
              <div className="flex items-center mb-1 sm:mb-0">
                <CalendarDays className="w-5 h-5 mr-2" />
                <span>Servicios para hoy</span>
                {todayHolidays.length > 0 && (
                  <div className="ml-2 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-yellow-700 font-medium">
                      {todayHolidays.length} festivo{todayHolidays.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-sm text-slate-600 mt-1 sm:mt-0">
                {todaysAssignments.filter(a => getServiceStatus(a) === 'completed').length} de {todaysAssignments.length} completado{todaysAssignments.filter(a => getServiceStatus(a) === 'completed').length !== 1 ? 's' : ''}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysAssignments.length > 0 ? (
              <div className="space-y-3">
                {todaysAssignments.map(assignment => (
                  <div key={assignment.id} className={`border rounded-lg p-4 relative ${
                    getServiceStatus(assignment) === 'completed' ? 'bg-green-50 border-green-200' :
                    getServiceStatus(assignment) === 'in-progress' ? 'bg-orange-50 border-orange-200' :
                    'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      {getServiceStatus(assignment) === 'completed' && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">
                          {assignment.users?.name} {assignment.users?.surname}
                        </h4>
                        {assignment.users?.address && (
                          <div className="flex items-center text-sm text-slate-600 mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {assignment.users.address}
                          </div>
                        )}
                        <div className="text-sm text-slate-600 mt-1">
                          {getTodaySchedule(assignment) ? (
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${getStatusColor(getServiceStatus(assignment))}`}>
                                {getStatusIcon(getServiceStatus(assignment))} {getTodaySchedule(assignment)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">Sin horario específico</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getServiceStatus(assignment) === 'completed' ? 'bg-green-100 text-green-800' :
                          getServiceStatus(assignment) === 'in-progress' ? 'bg-orange-100 text-orange-800' :
                          getServiceStatus(assignment) === 'pending' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {getServiceStatus(assignment) === 'completed' && 'Completado'}
                          {getServiceStatus(assignment) === 'in-progress' && 'En progreso'}
                          {getServiceStatus(assignment) === 'pending' && 'Pendiente'}
                          {getServiceStatus(assignment) === 'no-service' && 'Sin servicio'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">
                  <Coffee className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">¡Hoy no tienes servicios!</h3>
                <p className="text-slate-600 mb-4">
                  Disfruta de tu día libre. Puedes revisar tu planning para ver los próximos servicios.
                </p>
                <Button 
                  variant="secondary" 
                  onClick={() => router.push("/worker/planning")}
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Ver Planning
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estado de Horas por Usuario */}
        {/* Balance Mensual de Horas */}
        <Card className="sm:mx-0 -mx-4 rounded-none sm:rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between whitespace-nowrap">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Balance Mensual de Horas
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={refetchBalances}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Actualizar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="sm:px-6 px-0">
            {monthlyBalances.length > 0 ? (
              <div className="space-y-4 px-2">
                {monthlyBalances.map(balance => (
                  <MonthlyBalanceCard
                    key={balance.id}
                    balance={balance}
                    className="sm:mx-0 -mx-4"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">
                  <BarChart3 className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No hay balances mensuales</h3>
                <p className="text-slate-600">
                  Los balances mensuales se generan automáticamente por administración.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información de Festivos del Mes */}
        <Card className="sm:mx-0 -mx-4 rounded-none sm:rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center whitespace-nowrap">
              <Calendar className="w-5 h-5 mr-2" />
              Festivos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent className="sm:px-6 px-0">
            <HolidaysInfoCard 
              month={new Date().getMonth() + 1} 
              year={new Date().getFullYear()} 
            />
          </CardContent>
        </Card>

        {/* Estado de Horas por Usuario */}
        <Card className="sm:mx-0 -mx-4 rounded-none sm:rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center whitespace-nowrap">
              <Clock className="w-5 h-5 mr-2" />
              Estado de Horas por Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="sm:px-6 px-0">
            {userHoursStatus.length > 0 ? (
              <div className="space-y-4 px-2">
                {userHoursStatus.map(userStatus => {
                  const userReassignmentInfo = reassignmentInfo.get(userStatus.userId);
                  return (
                    <DetailedHoursStatusCard
                      key={userStatus.userId}
                      monthlyHours={userStatus.monthlyHours}
                      usedHours={userStatus.usedHours}
                      userName={userStatus.userName}
                      userSurname={userStatus.userSurname}
                      userAddress={userStatus.userAddress}
                      userPhone={userStatus.userPhone}
                      totalWorkers={userStatus.totalWorkers}
                      assignments={userStatus.assignments}
                      className="sm:mx-0 -mx-4"
                      reassignmentInfo={userReassignmentInfo}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">
                  <Users className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No hay usuarios asignados</h3>
                <p className="text-slate-600">
                  Contacta con administración para recibir asignaciones.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}