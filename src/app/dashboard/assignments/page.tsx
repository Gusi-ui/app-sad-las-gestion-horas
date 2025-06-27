'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAssignments } from '@/hooks/useAssignments'
import { useToast } from '@/components/ui/toast'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Phone,
  Eye
} from 'lucide-react'
import { Assignment, AssignmentStatus } from '@/lib/types'

const statusLabels: Record<AssignmentStatus, string> = {
  active: 'Activa',
  paused: 'Pausada',
  completed: 'Completada',
  cancelled: 'Cancelada'
}

const statusColors: Record<AssignmentStatus, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
}

const priorityColors: Record<number, string> = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-yellow-100 text-yellow-800',
  3: 'bg-green-100 text-green-800'
}

export default function AssignmentsPage() {
  const { assignments, isLoading, error, deleteAssignment, getAssignmentStats } = useAssignments()
  const { showToast, ToastComponent } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all')

  const stats = getAssignmentStats()

  const handleDelete = async (assignment: Assignment) => {
    if (!confirm(`¿Estás segura de que quieres eliminar la asignación de ${assignment.worker?.name} ${assignment.worker?.surname} para ${assignment.user?.name} ${assignment.user?.surname}?`)) {
      return
    }

    setDeletingId(assignment.id)
    try {
      const { error } = await deleteAssignment(assignment.id)
      if (error) {
        showToast(`Error al eliminar: ${error}`, 'error')
      } else {
        showToast('Asignación eliminada correctamente', 'success')
      }
    } catch {
      showToast('Error inesperado al eliminar', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true
    return assignment.status === filter
  })

  const getStatusIcon = (status: AssignmentStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'paused':
        return <Pause className="w-4 h-4 text-amber-600" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusText = (status: AssignmentStatus) => {
    switch (status) {
      case 'active':
        return 'Activa'
      case 'paused':
        return 'Pausada'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Desconocido'
    }
  }

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1:
        return 'Alta'
      case 2:
        return 'Media'
      case 3:
        return 'Baja'
      default:
        return 'No especificada'
    }
  }

  const formatSchedule = (schedule: Record<string, string[]> | undefined) => {
    if (!schedule) return 'No configurado'
    
    const days = Object.entries(schedule)
      .filter(([, times]) => times && times.length >= 2)
      .map(([day, times]) => {
        const dayNames: Record<string, string> = {
          monday: 'Lun',
          tuesday: 'Mar',
          wednesday: 'Mié',
          thursday: 'Jue',
          friday: 'Vie',
          saturday: 'Sáb',
          sunday: 'Dom'
        }
        return `${dayNames[day]}: ${times[0]}-${times[1]}`
      })
    
    return days.length > 0 ? days.join(', ') : 'No configurado'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando asignaciones...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error al cargar asignaciones: {error}</p>
            <Link href="/dashboard">
              <Button>Volver al Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/planning">
              <Button variant="secondary" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Planning
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                🔄 Gestión de Asignaciones
              </h1>
              <p className="text-slate-600">
                Administra las asignaciones trabajadora-usuario y sus horarios
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  🏢 Planning Administrativo
                </span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                  📅 Sistema de Horarios
                </span>
              </div>
            </div>
          </div>
          <Link href="/dashboard/assignments/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Asignación
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  <p className="text-xs text-slate-500">Asignaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Activas</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
                  <p className="text-xs text-slate-500">En curso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Pause className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Pausadas</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.paused}</p>
                  <p className="text-xs text-slate-500">Temporales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Horas/Semana</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalWeeklyHours}</p>
                  <p className="text-xs text-slate-500">Asignadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Completadas</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
                  <p className="text-xs text-slate-500">Finalizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex space-x-3 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas ({stats.total})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Activas ({stats.active})
          </Button>
          <Button
            variant={filter === 'paused' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setFilter('paused')}
          >
            Pausadas ({stats.paused})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completadas ({stats.completed})
          </Button>
        </div>

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No hay asignaciones
                {filter !== 'all' && ` ${statusLabels[filter as AssignmentStatus].toLowerCase()}`}
              </h3>
              <p className="text-slate-600 mb-6">
                {filter === 'all' 
                  ? 'Comienza creando la primera asignación trabajadora-usuario'
                  : `No hay asignaciones ${statusLabels[filter as AssignmentStatus].toLowerCase()} en este momento`
                }
              </p>
              <Link href="/dashboard/assignments/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Asignación
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredAssignments.map((assignment) => {
              const statusIcon = getStatusIcon(assignment.status)
              
              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Main Info */}
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 bg-slate-100 rounded-lg">
                          <Users className="w-6 h-6 text-slate-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {assignment.worker?.name} {assignment.worker?.surname} → {assignment.user?.name} {assignment.user?.surname}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[assignment.status]}`}>
                              {statusIcon}
                              {getStatusText(assignment.status)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[assignment.priority]}`}>
                              Prioridad {getPriorityText(assignment.priority)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="flex items-center text-sm text-slate-600">
                              <Clock className="w-4 h-4 mr-2" />
                              {assignment.assigned_hours_per_week}h/semana
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              Desde {new Date(assignment.start_date).toLocaleDateString('es-ES')}
                            </div>
                            {assignment.worker?.phone && (
                              <div className="flex items-center text-sm text-slate-600">
                                <Phone className="w-4 h-4 mr-2" />
                                {assignment.worker.phone}
                              </div>
                            )}
                          </div>

                          {/* Schedule */}
                          <div className="bg-slate-50 rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium text-slate-700 mb-1">Horario:</p>
                            <p className="text-sm text-slate-600">{formatSchedule(assignment.specific_schedule)}</p>
                          </div>

                          {/* Notes */}
                          {assignment.notes && (
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-sm font-medium text-blue-900 mb-1">Notas:</p>
                              <p className="text-sm text-blue-700">{assignment.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <Link href={`/dashboard/assignments/${assignment.id}`}>
                          <Button variant="secondary" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                        <Link href={`/dashboard/assignments/${assignment.id}/edit`}>
                          <Button variant="secondary" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleDelete(assignment)}
                          disabled={deletingId === assignment.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {deletingId === assignment.id ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      {ToastComponent}
    </div>
  )
} 