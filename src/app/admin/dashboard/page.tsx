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
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carga
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  const quickActions = [
    {
      title: 'Nueva Trabajadora',
      description: 'Registrar nueva trabajadora',
      icon: <UserCheck className="w-6 h-6" />,
      href: '/admin/workers/new',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Nuevo Usuario',
      description: 'Registrar nuevo cliente',
      icon: <Users className="w-6 h-6" />,
      href: '/admin/users/new',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Nueva Asignación',
      description: 'Asignar trabajadora a usuario',
      icon: <Calendar className="w-6 h-6" />,
      href: '/admin/assignments/new',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Planificación',
      description: 'Gestionar planning mensual',
      icon: <BarChart3 className="w-6 h-6" />,
      href: '/admin/planning',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  const navigationCards = [
    {
      title: 'Trabajadoras',
      description: 'Gestionar trabajadoras y sus perfiles',
      icon: <UserCheck className="w-8 h-8" />,
      href: '/admin/workers',
      stats: '5/8 activas'
    },
    {
      title: 'Usuarios',
      description: 'Gestionar clientes y sus servicios',
      icon: <Users className="w-8 h-8" />,
      href: '/admin/users',
      stats: '12/15 activos'
    },
    {
      title: 'Asignaciones',
      description: 'Gestionar asignaciones trabajadora-usuario',
      icon: <Calendar className="w-8 h-8" />,
      href: '/admin/assignments',
      stats: '8/10 activas'
    },
    {
      title: 'Planificación',
      description: 'Gestionar planning y horarios',
      icon: <BarChart3 className="w-8 h-8" />,
      href: '/admin/planning',
      stats: '120h mensuales'
    }
  ]

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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Panel de Administración
        </h1>
        <p className="text-slate-600">
          Gestión completa del sistema de ayuda a domicilio
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg text-white ${action.color}`}>
                      {action.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {action.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Resumen General
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Trabajadoras Activas
              </CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                5
              </div>
              <p className="text-xs text-slate-600">
                de 8 total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Usuarios Activos
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                12
              </div>
              <p className="text-xs text-slate-600">
                de 15 total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Asignaciones Activas
              </CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                8
              </div>
              <p className="text-xs text-slate-600">
                de 10 total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Horas Mensuales
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                120
              </div>
              <p className="text-xs text-slate-600">
                horas programadas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Gestión del Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {navigationCards.map((card, index) => (
            <Link key={index} href={card.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-slate-100 text-slate-600">
                      {card.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {card.title}
                      </h3>
                      <p className="text-slate-600 mb-3">
                        {card.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">
                          {card.stats}
                        </span>
                        <Button variant="default" size="sm">
                          Gestionar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 