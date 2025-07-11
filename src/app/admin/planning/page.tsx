'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users, BarChart3, Plus, Filter } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Assignment {
  id: string
  worker: {
    name: string
    surname: string
  }
  user: {
    name: string
    surname: string
    client_code: string
  }
  weekly_hours: number
  status: string
  start_date: string
  end_date?: string
}

export default function PlanningPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        ?.from('assignments')
        .select(`
          id,
          weekly_hours,
          status,
          start_date,
          end_date,
          worker:workers(name, surname),
          user:users(name, surname, client_code)
        `)
        .eq('status', 'active')

      if (error) {
        console.error('Error al cargar asignaciones:', error)
      } else {
        setAssignments(data || [])
      }
    } catch (error) {
      console.error('Error inesperado:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []

    // Días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando planning...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Planning Mensual
              </h1>
              <p className="text-slate-600">
                Gestión y visualización del planning de servicios
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="secondary">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Link href="/admin/assignments/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Asignación
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Asignaciones Activas
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {assignments.length}
              </div>
              <p className="text-xs text-slate-600">
                asignaciones en curso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Horas Totales
              </CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {assignments.reduce((sum, assignment) => sum + assignment.weekly_hours, 0)}
              </div>
              <p className="text-xs text-slate-600">
                horas por semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Trabajadoras
              </CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {new Set(assignments.map(a => a.worker.name + ' ' + a.worker.surname)).size}
              </div>
              <p className="text-xs text-slate-600">
                trabajadoras asignadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Usuarios
              </CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {new Set(assignments.map(a => a.user.name + ' ' + a.user.surname)).size}
              </div>
              <p className="text-xs text-slate-600">
                usuarios atendidos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="secondary" onClick={() => changeMonth('prev')}>
            ← Mes Anterior
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 capitalize">
            {getMonthName(currentMonth)}
          </h2>
          <Button variant="secondary" onClick={() => changeMonth('next')}>
            Mes Siguiente →
          </Button>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Calendario Mensual</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {/* Headers */}
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-slate-600 bg-slate-50 rounded">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {generateCalendarDays().map((day, index) => (
                <div
                  key={index}
                  className={`p-2 min-h-[80px] border border-slate-200 ${
                    day ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium text-slate-900 mb-1">
                        {day}
                      </div>
                      <div className="space-y-1">
                        {assignments.slice(0, 2).map(assignment => (
                          <div
                            key={assignment.id}
                            className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                            title={`${assignment.worker.name} ${assignment.worker.surname} → ${assignment.user.name} ${assignment.user.surname}`}
                          >
                            {assignment.worker.name} → {assignment.user.name}
                          </div>
                        ))}
                        {assignments.length > 2 && (
                          <div className="text-xs text-slate-500">
                            +{assignments.length - 2} más
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assignments List */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <span>Asignaciones Activas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Trabajadora</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Horas/Semana</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Inicio</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Fin</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(assignment => (
                    <tr key={assignment.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {assignment.worker.name} {assignment.worker.surname}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {assignment.user.name} {assignment.user.surname}
                        </div>
                        <div className="text-sm text-slate-500">
                          {assignment.user.client_code}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {assignment.weekly_hours}h
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(assignment.start_date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {assignment.end_date 
                          ? new Date(assignment.end_date).toLocaleDateString('es-ES')
                          : 'Indefinido'
                        }
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          assignment.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {assignment.status === 'active' ? 'Activa' : 'Pausada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 