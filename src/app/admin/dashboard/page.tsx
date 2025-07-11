'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  UserCheck, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  Plus,
  Settings,
  BarChart3,
  ArrowRight,
  Activity,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

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
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    workers: { total: 0, active: 0 },
    users: { total: 0, active: 0 },
    assignments: { total: 0, active: 0 }
  })

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    if (!supabase) {
      console.error('Supabase client no disponible')
      setLoading(false)
      return
    }

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
        }
      })

    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoading(false)
    }
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

  const recentActivity = [
    {
      type: 'assignment',
      message: 'Nueva asignación creada: Carmen → José Pérez',
      time: 'Hace 2 horas',
      icon: <Calendar className="w-4 h-4" />
    },
    {
      type: 'worker',
      message: 'Trabajadora Josefa Ruiz registrada',
      time: 'Hace 4 horas',
      icon: <UserCheck className="w-4 h-4" />
    },
    {
      type: 'user',
      message: 'Usuario Antonia Martínez agregado',
      time: 'Hace 6 horas',
      icon: <Users className="w-4 h-4" />
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Bienvenido, {adminName}!
            </h1>
            <p className="text-blue-100 text-lg">
              Gestiona tu sistema de ayuda a domicilio de manera eficiente
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
              <Activity className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <Target className="w-6 h-6 mr-3 text-blue-600" />
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white shadow-lg hover:-translate-y-1 h-32">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl text-white ${action.bgColor} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-base leading-tight">
                        {action.title}
                      </h3>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <Activity className="w-6 h-6 mr-3 text-blue-600" />
          Actividad Reciente
        </h2>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentActivity.slice(0, 7).map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview (moved to bottom) */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
          Resumen General
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Trabajadoras Activas
              </CardTitle>
              <div className="p-2 bg-blue-500 rounded-lg">
                <UserCheck className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {stats.workers.active}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                de {stats.workers.total} total
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.workers.total > 0 ? (stats.workers.active / stats.workers.total) * 100 : 0}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Usuarios Activos
              </CardTitle>
              <div className="p-2 bg-green-500 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {stats.users.active}
              </div>
              <p className="text-xs text-green-600 mt-1">
                de {stats.users.total} total
              </p>
              <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.users.total > 0 ? (stats.users.active / stats.users.total) * 100 : 0}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">
                Asignaciones Activas
              </CardTitle>
              <div className="p-2 bg-purple-500 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {stats.assignments.active}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                de {stats.assignments.total} total
              </p>
              <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.assignments.total > 0 ? (stats.assignments.active / stats.assignments.total) * 100 : 0}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">
                Horas Mensuales
              </CardTitle>
              <div className="p-2 bg-orange-500 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                120
              </div>
              <p className="text-xs text-orange-600 mt-1">
                horas programadas
              </p>
              <div className="mt-2 w-full bg-orange-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 