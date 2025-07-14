'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Clock,
  Plus,
  BarChart3,
  ArrowRight,
  Activity,
  Target,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useMonthlyBalances } from '@/hooks/useMonthlyBalances'
import { Badge } from '@/components/ui/badge'

interface TimeSlot {
  start: string
  end: string
}

interface DaySchedule {
  enabled: boolean
  timeSlots: TimeSlot[]
}

interface DashboardStats {
  workers: {
    total: number
    active: number
  }
  users: {
    total: number
    active: number
  }
  assignments: {
    total: number
    active: number
  }
  monthlyHours: number
}

interface RecentActivity {
  id: string
  type: 'worker' | 'user' | 'assignment' | 'monthly_plan'
  message: string
  time: string
  icon: React.ReactNode
  created_at: string
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    workers: { total: 0, active: 0 },
    users: { total: 0, active: 0 },
    assignments: { total: 0, active: 0 },
    monthlyHours: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  // Hook para balances mensuales del mes actual
  const { balances, loading: loadingBalances, error: errorBalances } = useMonthlyBalances({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })

  // Estado para mapear user_id a nombre completo
  const [userMap, setUserMap] = useState<Record<string, string>>({})
  useEffect(() => {
    async function fetchUsers() {
      if (!supabase) return;
      const { data, error } = await supabase.from('users').select('id, name, surname')
      if (!error && Array.isArray(data)) {
        const map: Record<string, string> = {};
        data.forEach((u) => { map[u.id] = `${u.name} ${u.surname}` });
        setUserMap(map);
      } else {
        if (error) {
          console.error('Error al consultar usuarios:', error);
        } else {
          console.error('La respuesta de usuarios no es un array:', data);
        }
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error('Error obteniendo usuario:', error);
      }
    });
  }, []);

  const fetchRecentActivity = async () => {
    if (!supabase) return;

    try {
      const activities: RecentActivity[] = []

      // 1. Obtener trabajadoras recientes (creadas y actualizadas)
      const { data: recentWorkers, error: workersError } = await supabase
        .from('workers')
        .select('id, name, surname, created_at, updated_at, is_active')
        .order('updated_at', { ascending: false })
        .limit(10)

      if (!workersError && recentWorkers) {
        recentWorkers.forEach(worker => {
          const isRecentlyCreated = new Date(worker.created_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
          const isRecentlyUpdated = new Date(worker.updated_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()

          if (isRecentlyCreated) {
            activities.push({
              id: `worker-created-${worker.id}`,
              type: 'worker',
              message: `Trabajadora ${worker.name} ${worker.surname} registrada`,
              time: formatTimeAgo(worker.created_at),
              icon: <UserCheck className="w-4 h-4" />,
              created_at: worker.created_at
            })
          } else if (isRecentlyUpdated && worker.updated_at !== worker.created_at) {
            activities.push({
              id: `worker-updated-${worker.id}`,
              type: 'worker',
              message: `Datos de ${worker.name} ${worker.surname} actualizados`,
              time: formatTimeAgo(worker.updated_at),
              icon: <UserCheck className="w-4 h-4" />,
              created_at: worker.updated_at
            })
          }
        })
      }

      // 2. Obtener usuarios recientes (creados y actualizados)
      const { data: recentUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name, surname, created_at, updated_at, is_active')
        .order('updated_at', { ascending: false })
        .limit(10)

      if (!usersError && recentUsers) {
        recentUsers.forEach(user => {
          const isRecentlyCreated = new Date(user.created_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
          const isRecentlyUpdated = new Date(user.updated_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()

          if (isRecentlyCreated) {
            activities.push({
              id: `user-created-${user.id}`,
              type: 'user',
              message: `Usuario ${user.name} ${user.surname} agregado`,
              time: formatTimeAgo(user.created_at),
              icon: <Users className="w-4 h-4" />,
              created_at: user.created_at
            })
          } else if (isRecentlyUpdated && user.updated_at !== user.created_at) {
            activities.push({
              id: `user-updated-${user.id}`,
              type: 'user',
              message: `Datos de ${user.name} ${user.surname} actualizados`,
              time: formatTimeAgo(user.updated_at),
              icon: <Users className="w-4 h-4" />,
              created_at: user.updated_at
            })
          }
        })
      }

      // 3. Obtener asignaciones recientes (creadas y actualizadas)
      const { data: recentAssignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          created_at,
          updated_at,
          status,
          assignment_type,
          workers(name, surname),
          users(name, surname)
        `)
        .order('updated_at', { ascending: false })
        .limit(10)

      if (!assignmentsError && recentAssignments) {
        recentAssignments.forEach(assignment => {
          const isRecentlyCreated = new Date(assignment.created_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
          const isRecentlyUpdated = new Date(assignment.updated_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()

          const workerName = assignment.workers ? `${assignment.workers.name} ${assignment.workers.surname}` : 'Trabajadora'
          const userName = assignment.users ? `${assignment.users.name} ${assignment.users.surname}` : 'Usuario'

          if (isRecentlyCreated) {
            activities.push({
              id: `assignment-created-${assignment.id}`,
              type: 'assignment',
              message: `Asignación creada: ${workerName} → ${userName}`,
              time: formatTimeAgo(assignment.created_at),
              icon: <Calendar className="w-4 h-4" />,
              created_at: assignment.created_at
            })
          } else if (isRecentlyUpdated && assignment.updated_at !== assignment.created_at) {
            activities.push({
              id: `assignment-updated-${assignment.id}`,
              type: 'assignment',
              message: `Asignación actualizada: ${workerName} → ${userName}`,
              time: formatTimeAgo(assignment.updated_at),
              icon: <Calendar className="w-4 h-4" />,
              created_at: assignment.updated_at
            })
          }
        })
      }

      // 4. Obtener balances mensuales recientes
      const { data: recentBalances, error: balancesError } = await supabase
        .from('monthly_balances')
        .select('id, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5)

      if (!balancesError && recentBalances) {
        recentBalances.forEach(balance => {
          const isRecentlyCreated = new Date(balance.created_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()

          if (isRecentlyCreated) {
            activities.push({
              id: `balance-created-${balance.id}`,
              type: 'monthly_plan',
              message: `Balance mensual generado para usuario ${balance.user_id}`,
              time: formatTimeAgo(balance.created_at),
              icon: <BarChart3 className="w-4 h-4" />,
              created_at: balance.created_at
            })
          }
        })
      }

      // Ordenar todas las actividades por fecha de creación (más recientes primero)
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Tomar solo las 15 más recientes
      setRecentActivity(activities.slice(0, 15))

    } catch (error) {
      // Puedes dejar el error, pero sin console.log
    }
  }

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
    const activityInterval = setInterval(() => {
      fetchRecentActivity();
    }, 30000);
    return () => clearInterval(activityInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se ejecuta una vez al montar

  const fetchDashboardStats = async () => {
    if (!supabase) return;

    try {
      // Obtener estadísticas de trabajadoras
      const { count: workersTotal } = await supabase
        .from('workers')
        .select('*', { count: 'exact', head: true })

      const { count: workersActive } = await supabase
        .from('workers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Obtener estadísticas de usuarios
      const { count: usersTotal } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { count: usersActive } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Obtener estadísticas de asignaciones
      const { count: assignmentsTotal } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })

      const { count: assignmentsActive } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Obtener horas totales mensuales
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()

      const { data: monthlyHoursData, error: hoursError } = await supabase
        .from('assignments')
        .select('weekly_hours, schedule')
        .eq('status', 'active')

      let totalMonthlyHours = 0
      if (monthlyHoursData && !hoursError) {
        // Calcular horas totales mensuales considerando el horario semanal
        totalMonthlyHours = monthlyHoursData.reduce((total, assignment) => {
          let weeklyHours = assignment.weekly_hours || 0

          // Si hay un horario detallado, calcular las horas basadas en el schedule
          if (assignment.schedule) {
            const schedule = assignment.schedule
            let calculatedWeeklyHours = 0

            // Calcular horas por semana basadas en el horario
            Object.keys(schedule).forEach(day => {
              const daySchedule = schedule[day]
              if (daySchedule && daySchedule.enabled && daySchedule.timeSlots) {
                daySchedule.timeSlots.forEach((slot: TimeSlot) => {
                  const startTime = new Date(`2000-01-01T${slot.start}`)
                  const endTime = new Date(`2000-01-01T${slot.end}`)
                  const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
                  calculatedWeeklyHours += hours
                })
              }
            })

            // Usar el valor más alto entre el cálculo del horario y el campo weekly_hours
            weeklyHours = Math.max(weeklyHours, calculatedWeeklyHours)
          }

          return total + weeklyHours * 4.33
        }, 0)
      }

      setStats({
        workers: {
          total: workersTotal || 0,
          active: workersActive || 0
        },
        users: {
          total: usersTotal || 0,
          active: usersActive || 0
        },
        assignments: {
          total: assignmentsTotal || 0,
          active: assignmentsActive || 0
        },
        monthlyHours: Math.round(totalMonthlyHours)
      })

    } catch (error) {
      // Puedes dejar el error, pero sin console.log
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Hace un momento'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400)
      return `Hace ${days} ${days === 1 ? 'día' : 'días'}`
    } else {
      const months = Math.floor(diffInSeconds / 2592000)
      return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`
    }
  }

  // Función para navegar a las páginas con filtros
  const navigateToFilteredPage = (page: string, filter: string) => {
    router.push(`${page}?status=${filter}`)
  }

  const quickActions = [
    {
      title: 'Trabajadora',
      description: 'Registrar una nueva trabajadora',
      icon: <Plus className="w-6 h-6" />, // Solo el icono +
      href: '/admin/workers/new',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      title: 'Usuario',
      description: 'Registrar un nuevo usuario',
      icon: <Plus className="w-6 h-6" />, // Solo el icono +
      href: '/admin/users/new',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      title: 'Asignación',
      description: 'Crear una nueva asignación',
      icon: <Plus className="w-6 h-6" />, // Solo el icono +
      href: '/admin/assignments/new',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    {
      title: 'Planificación',
      description: 'Gestionar la planificación mensual',
      icon: <BarChart3 className="w-6 h-6" />,
      href: '/admin/planning',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-gradient-to-r from-orange-500 to-orange-600'
    }
  ]

  // Saludo personalizado
  const adminName = user?.full_name || user?.email || 'Administrador';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  // Antes del renderizado de la tabla, filtra balances para dejar solo uno por usuario (el más reciente)
  const uniqueBalances = Array.from(
    balances
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }) // más reciente primero
      .reduce((map, b) => map.set(b.user_id, b), new Map())
      .values()
  );

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 truncate">
              ¡Bienvenido, {adminName}!
            </h1>
            <p className="text-blue-100 text-base sm:text-lg">
              Gestiona tu sistema de ayuda a domicilio de manera eficiente
            </p>
          </div>
          <div className="hidden lg:block flex-shrink-0 ml-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full flex items-center justify-center">
              <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <Target className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-blue-600 flex-shrink-0" />
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white shadow-lg hover:-translate-y-1 h-28 sm:h-32">
                <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`p-2 sm:p-3 rounded-xl text-white ${action.bgColor} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base leading-tight truncate">
                        {action.title}
                      </h3>
                    </div>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="max-w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-blue-600 flex-shrink-0" />
            Actividad Reciente
          </h2>
          <Button
            variant="default"
            size="sm"
            onClick={() => fetchRecentActivity()}
            className="text-xs"
          >
            Actualizar
          </Button>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No hay actividad reciente</p>
                <p className="text-sm text-slate-400 mt-1">Las actividades aparecerán aquí automáticamente</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentActivity.slice(0, 12).map((activity, index) => {
                  // Determinar el color según el tipo de actividad
                  const getActivityColor = (type: string) => {
                    switch (type) {
                      case 'worker':
                        return 'bg-blue-100 text-blue-600 border-blue-200'
                      case 'user':
                        return 'bg-green-100 text-green-600 border-green-200'
                      case 'assignment':
                        return 'bg-purple-100 text-purple-600 border-purple-200'
                      case 'monthly_plan':
                        return 'bg-orange-100 text-orange-600 border-orange-200'
                      default:
                        return 'bg-slate-100 text-slate-600 border-slate-200'
                    }
                  }

                  const getActivityBadge = (type: string) => {
                    switch (type) {
                      case 'worker':
                        return 'Trabajadora'
                      case 'user':
                        return 'Usuario'
                      case 'assignment':
                        return 'Asignación'
                      case 'monthly_plan':
                        return 'Balance'
                      default:
                        return 'Actividad'
                    }
                  }

                  return (
                    <div key={activity.id} className="flex items-start space-x-3 sm:space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                      <div className={`p-2 rounded-lg flex-shrink-0 border ${getActivityColor(activity.type)}`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {getActivityBadge(activity.type)}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400">{activity.time}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 leading-relaxed">{activity.message}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {recentActivity.length > 12 && (
              <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-500">
                  Mostrando las 12 actividades más recientes de {recentActivity.length} total
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview (moved to bottom) */}
      <div className="max-w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-blue-600 flex-shrink-0" />
          Resumen General
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Tarjeta Trabajadoras Activas - Interactiva */}
          <Card
            className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
            onClick={() => navigateToFilteredPage('/admin/workers', 'active')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 truncate group-hover:text-blue-800 transition-colors">
                Trabajadoras Activas
              </CardTitle>
              <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                <UserCheck className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-blue-900 group-hover:text-blue-950 transition-colors">
                {stats.workers.active}
              </div>
              <p className="text-xs text-blue-600 mt-1 group-hover:text-blue-700 transition-colors">
                de {stats.workers.total} total
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.workers.total > 0 ? (stats.workers.active / stats.workers.total) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-blue-600 font-medium">Ver todas</span>
                <ExternalLink className="w-3 h-3 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta Usuarios Activos - Interactiva */}
          <Card
            className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
            onClick={() => navigateToFilteredPage('/admin/users', 'active')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 truncate group-hover:text-green-800 transition-colors">
                Usuarios Activos
              </CardTitle>
              <div className="p-2 bg-green-500 rounded-lg flex-shrink-0 group-hover:bg-green-600 transition-colors">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-green-900 group-hover:text-green-950 transition-colors">
                {stats.users.active}
              </div>
              <p className="text-xs text-green-600 mt-1 group-hover:text-green-700 transition-colors">
                de {stats.users.total} total
              </p>
              <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.users.total > 0 ? (stats.users.active / stats.users.total) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-green-600 font-medium">Ver todos</span>
                <ExternalLink className="w-3 h-3 text-green-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta Asignaciones Activas - Interactiva */}
          <Card
            className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
            onClick={() => navigateToFilteredPage('/admin/assignments', 'active')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 truncate group-hover:text-purple-800 transition-colors">
                Asignaciones Activas
              </CardTitle>
              <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0 group-hover:bg-purple-600 transition-colors">
                <Calendar className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-purple-900 group-hover:text-purple-950 transition-colors">
                {stats.assignments.active}
              </div>
              <p className="text-xs text-purple-600 mt-1 group-hover:text-purple-700 transition-colors">
                de {stats.assignments.total} total
              </p>
              <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.assignments.total > 0 ? (stats.assignments.active / stats.assignments.total) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-purple-600 font-medium">Ver todas</span>
                <ExternalLink className="w-3 h-3 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta Horas Mensuales - No interactiva */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 truncate">
                Horas Mensuales
              </CardTitle>
              <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-orange-900">
                {stats.monthlyHours}
              </div>
              <p className="text-xs text-orange-600 mt-1">
                horas programadas
              </p>
              <div className="mt-2 w-full bg-orange-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="mt-3 flex items-center justify-center">
                <span className="text-xs text-orange-600 font-medium">Información general</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* NUEVA SECCIÓN: Balances mensuales */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Balances mensuales de usuarios ({new Date().getMonth() + 1}/{new Date().getFullYear()})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBalances ? (
            <div className="py-8 text-center text-muted-foreground">Cargando balances mensuales...</div>
          ) : errorBalances ? (
            <div className="py-8 text-center text-destructive">{errorBalances}</div>
          ) : uniqueBalances.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No hay balances generados para este mes.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-3 py-2 text-left">Usuario</th>
                    <th className="px-3 py-2 text-left">Horas asignadas</th>
                    <th className="px-3 py-2 text-left">Horas reales</th>
                    <th className="px-3 py-2 text-left">Diferencia</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueBalances.map((b) => {
                    let estado: 'perfect' | 'excess' | 'deficit' = 'perfect'
                    if (Math.abs(b.balance) < 0.1) estado = 'perfect'
                    else if (b.balance > 0) estado = 'excess'
                    else estado = 'deficit'
                    return (
                      <tr key={b.id} className="border-b">
                        <td className="px-3 py-2">{userMap[b.user_id] || b.user_id}</td>
                        <td className="px-3 py-2">{typeof b.assigned_hours === 'number' ? b.assigned_hours.toFixed(2) : '-'}</td>
                        <td className="px-3 py-2">{typeof b.scheduled_hours === 'number' ? b.scheduled_hours.toFixed(2) : '-'}</td>
                        <td className="px-3 py-2">{typeof b.balance === 'number' ? b.balance.toFixed(2) : '-'}</td>
                        <td className="px-3 py-2">
                          {estado === 'perfect' && <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs">Perfecto</span>}
                          {estado === 'excess' && <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs">Exceso</span>}
                          {estado === 'deficit' && <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs">Defecto</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}