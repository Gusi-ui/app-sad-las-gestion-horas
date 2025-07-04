'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
// import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useAssignments } from '@/hooks/useAssignments'
import { supabase } from '@/lib/supabase'
import { formatScheduleOrdered } from '@/lib/utils'
import { ScheduleDisplay, ScheduleCards } from '@/components/ScheduleDisplay'

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
  Eye,
  Settings,
  LogOut,
  Menu,
  User,
  Search
} from 'lucide-react'
import { Assignment, AssignmentStatus } from '@/lib/types'

// Configuración para evitar el prerender estático
export const dynamic = 'force-dynamic'


const statusLabels: Record<AssignmentStatus, string> = {
  active: 'Activa',
  paused: 'Pausada',
  completed: 'Completada',
  cancelled: 'Cancelada'
}

const statusColors: Record<AssignmentStatus, string> = {
  active: 'bg-success-100 text-success-800',
  paused: 'bg-warning-100 text-warning-800',
  completed: 'bg-primary-100 text-primary-800',
  cancelled: 'bg-error-100 text-error-800'
}

const priorityColors: Record<number, string> = {
  1: 'bg-error-100 text-error-800',
  2: 'bg-warning-100 text-warning-800',
  3: 'bg-success-100 text-success-800'
}

export default function AssignmentsPage() {
  const router = useRouter()
  const { assignments, isLoading, error, deleteAssignment, getAssignmentStats } = useAssignments()
  const { showToast, ToastComponent } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const stats = getAssignmentStats()

  // Cerrar menú móvil cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showMobileMenu && !target.closest('.mobile-menu-container')) {
        setShowMobileMenu(false)
      }
    }

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMobileMenu])

  const handleDeleteClick = (assignment: Assignment) => {
    setAssignmentToDelete(assignment)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!assignmentToDelete) return

    setDeletingId(assignmentToDelete.id)
    try {
      const { error } = await deleteAssignment(assignmentToDelete.id)
      if (error) {
        showToast(`Error al eliminar: ${error}`, 'error')
      } else {
        showToast('Asignación eliminada correctamente', 'success')
      }
    } catch {
      showToast('Error inesperado al eliminar', 'error')
    } finally {
      setDeletingId(null)
      setShowDeleteModal(false)
      setAssignmentToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setAssignmentToDelete(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true
    return assignment.status === filter
  }).filter(assignment => {
    const q = searchValue.toLowerCase()
    return (
      assignment.user?.name?.toLowerCase().includes(q) ||
      assignment.user?.surname?.toLowerCase().includes(q) ||
      assignment.user?.phone?.toLowerCase().includes(q) ||
      assignment.worker?.name?.toLowerCase().includes(q) ||
      assignment.worker?.surname?.toLowerCase().includes(q) ||
      assignment.worker?.phone?.toLowerCase().includes(q)
    )
  })

  const getStatusIcon = (status: AssignmentStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-success-600" />
      case 'paused':
        return <Pause className="w-4 h-4 text-warning-600" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-primary-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-error-600" />
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

  const formatSchedule = (schedule: Record<string, any[]> | undefined) => {
    const dayNames: Record<string, string> = {
      monday: 'Lun',
      tuesday: 'Mar',
      wednesday: 'Mié',
      thursday: 'Jue',
      friday: 'Vie',
      saturday: 'Sáb',
      sunday: 'Dom'
    }
    return formatScheduleOrdered(schedule, dayNames)
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 mobile-menu-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                Gestión de Asignaciones
              </h1>
              <p className="text-sm text-slate-600 truncate">
                Administra las asignaciones trabajadora-usuario y sus horarios
              </p>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
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
              <Link href="/dashboard/users">
                <Button variant="secondary" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Usuarios
                </Button>
              </Link>
              <Link href="/dashboard/workers">
                <Button variant="secondary" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Trabajadoras
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden relative">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Abrir menú de navegación"
                aria-expanded={showMobileMenu}
                className="relative z-10"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out ${
            showMobileMenu 
              ? 'max-h-96 opacity-100 visible' 
              : 'max-h-0 opacity-0 invisible'
          }`}>
            <div className="py-4 border-t border-slate-200 bg-white shadow-lg">
              <div className="flex flex-col space-y-2 px-4">
                <Link href="/dashboard" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/planning" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Planning
                  </Button>
                </Link>
                <Link href="/dashboard/users" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Usuarios
                  </Button>
                </Link>
                <Link href="/dashboard/workers" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Trabajadoras
                  </Button>
                </Link>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    handleLogout()
                    setShowMobileMenu(false)
                  }} 
                  className="w-full justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8">
        
        {/* ACCIONES RÁPIDAS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Link href="/dashboard/assignments/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto border border-blue-200 shadow-sm">
              <div className="p-2 bg-blue-50 rounded-lg mb-2">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-blue-900 text-center whitespace-normal break-words leading-snug">
                Nueva Asignación
              </h3>
              <p className="text-xs sm:text-sm text-blue-700 text-center whitespace-normal break-words leading-snug">
                Crear asignación
              </p>
            </Card>
          </Link>

          <Link href="/dashboard/planning">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto border border-orange-200 shadow-sm">
              <div className="p-2 bg-orange-50 rounded-lg mb-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-orange-900 text-center whitespace-normal break-words leading-snug">
                Planning
              </h3>
              <p className="text-xs sm:text-sm text-orange-700 text-center whitespace-normal break-words leading-snug">
                Ver calendario
              </p>
            </Card>
          </Link>

          <Link href="/dashboard/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto border border-green-200 shadow-sm">
              <div className="p-2 bg-green-50 rounded-lg mb-2">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-green-900 text-center whitespace-normal break-words leading-snug">
                Usuarios
              </h3>
              <p className="text-xs sm:text-sm text-green-700 text-center whitespace-normal break-words leading-snug">
                Gestionar usuarios
              </p>
            </Card>
          </Link>

          {/* Tarjeta de búsqueda inteligente */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto p-0 border border-yellow-200 shadow-sm">
            <div className="p-2 bg-yellow-50 rounded-lg mb-1 mt-1">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base text-yellow-900 text-center whitespace-normal break-words leading-snug">
              Buscar asignación
            </h3>
            <div className="w-full flex-1 flex items-center px-3">
              <input
                type="text"
                placeholder="Usuario o trabajadora"
                className="mt-0 py-1 text-xs sm:text-sm rounded border border-slate-300 w-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-center placeholder:text-center"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
              />
            </div>
          </Card>
        </div>



        {/* LISTADO DE ASIGNACIONES */}
        <Card className="mx-0 sm:mx-0 border border-primary-200 shadow-sm">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <div>
                <h2 className="text-lg font-semibold text-primary-900">Lista de Asignaciones</h2>
                <p className="text-sm text-primary-600 mt-1">
                  {filteredAssignments.length} asignación{filteredAssignments.length !== 1 ? 'es' : ''} mostrada{filteredAssignments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-primary-100 text-primary-800 border border-primary-300' : ''}
                >
                  Todas ({stats.total})
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setFilter('active')}
                  className={filter === 'active' ? 'bg-success-100 text-success-800 border border-success-300' : ''}
                >
                  Activas ({stats.active})
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setFilter('paused')}
                  className={filter === 'paused' ? 'bg-warning-100 text-warning-800 border border-warning-300' : ''}
                >
                  Pausadas ({stats.paused})
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setFilter('completed')}
                  className={filter === 'completed' ? 'bg-primary-100 text-primary-800 border border-primary-300' : ''}
                >
                  Completadas ({stats.completed})
                </Button>
              </div>
            </div>

            {/* Assignments List */}
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-primary-200 mb-4">
                  <Users className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-primary-900 mb-2">
                  No hay asignaciones
                  {filter !== 'all' && ` ${statusLabels[filter as AssignmentStatus].toLowerCase()}`}
                </h3>
                <p className="text-primary-600 mb-4">
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
              </div>
            ) : (
              <div className="space-y-6">
                {filteredAssignments.map((assignment) => {
                  const statusIcon = getStatusIcon(assignment.status)
                  return (
                    <div key={assignment.id} className="bg-white border border-primary-100 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 mb-2 gap-2">
                          <h3 className="text-base sm:text-lg font-semibold text-primary-900 break-words">
                            {assignment.worker?.name} {assignment.worker?.surname} → {assignment.user?.name} {assignment.user?.surname}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[assignment.status]}`}> 
                              {statusIcon}
                              {getStatusText(assignment.status)}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[assignment.priority]}`}> 
                              Prioridad {getPriorityText(assignment.priority)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3">
                          <div className="flex items-center text-sm text-primary-700">
                            <Clock className="w-4 h-4 mr-2 flex-shrink-0 text-primary-600" />
                            <span className="truncate">{assignment.assigned_hours_per_week}h/semana</span>
                          </div>
                          <div className="flex items-center text-sm text-primary-700">
                            <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-primary-600" />
                            <span className="truncate">Desde {new Date(assignment.start_date).toLocaleDateString('es-ES')}</span>
                          </div>
                          {assignment.worker?.phone && (
                            <div className="flex items-center text-sm text-primary-700">
                              <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-primary-600" />
                              <span className="truncate">{assignment.worker.phone}</span>
                            </div>
                          )}
                        </div>
                        {/* Schedule */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 shadow-sm">
                          <p className="text-sm font-medium text-blue-700 mb-2">Horario:</p>
                          <ScheduleDisplay schedule={assignment.specific_schedule} showIcon={false} layout="rows" />
                        </div>
                        {/* Notes */}
                        {assignment.notes && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                            <p className="text-xs text-orange-700 mb-1 font-semibold">Notas:</p>
                            <p className="text-sm text-orange-700">{assignment.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards - Desktop and Mobile (at the bottom) */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumen de Asignaciones</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border border-blue-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-blue-600">Total</p>
                    <p className="text-xl font-bold text-blue-900">{stats.total}</p>
                    <p className="text-xs text-blue-500">Asignaciones</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-green-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-green-600">Activas</p>
                    <p className="text-xl font-bold text-green-900">{stats.active}</p>
                    <p className="text-xs text-green-500">En curso</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-yellow-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-50 rounded-lg flex-shrink-0">
                    <Pause className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-yellow-600">Pausadas</p>
                    <p className="text-xl font-bold text-yellow-900">{stats.paused}</p>
                    <p className="text-xs text-yellow-500">Temporales</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-orange-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-50 rounded-lg flex-shrink-0">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-orange-600">Horas/Semana</p>
                    <p className="text-xl font-bold text-orange-900">{stats.totalWeeklyHours}</p>
                    <p className="text-xs text-orange-500">Asignadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-purple-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-purple-600">Completadas</p>
                    <p className="text-xl font-bold text-purple-900">{stats.completed}</p>
                    <p className="text-xs text-purple-500">Finalizadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-red-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-red-50 rounded-lg flex-shrink-0">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-red-600">Canceladas</p>
                    <p className="text-xl font-bold text-red-900">{stats.cancelled || 0}</p>
                    <p className="text-xs text-red-500">Anuladas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer de navegación fijo */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
        <nav className="flex justify-around py-3">
          <Link href="/dashboard/users" className="flex flex-col items-center text-xs text-slate-600 hover:text-blue-600 transition-colors">
            <User className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Usuarios</span>
          </Link>
          <Link href="/dashboard/workers" className="flex flex-col items-center text-xs text-slate-600 hover:text-green-600 transition-colors">
            <Users className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Trabajadoras</span>
          </Link>
          <Link href="/dashboard/assignments" className="flex flex-col items-center text-xs text-slate-600 hover:text-purple-600 transition-colors">
            <Clock className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Asignaciones</span>
          </Link>
          <Link href="/dashboard/planning" className="flex flex-col items-center text-xs text-slate-600 hover:text-orange-600 transition-colors">
            <Calendar className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Planning</span>
          </Link>
          <Link href="/dashboard/settings" className="flex flex-col items-center text-xs text-slate-600 hover:text-slate-800 transition-colors">
            <Settings className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Configuración</span>
          </Link>
        </nav>
      </footer>

      {/* Espacio para el footer fijo */}
      <div className="h-20"></div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && assignmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Confirmar Eliminación
              </h3>
            </div>
            
            <p className="text-slate-600 mb-6">
              ¿Estás segura de que quieres eliminar la asignación de{' '}
              <strong>{assignmentToDelete.worker?.name} {assignmentToDelete.worker?.surname}</strong>{' '}
              para <strong>{assignmentToDelete.user?.name} {assignmentToDelete.user?.surname}</strong>?
            </p>
            
            <p className="text-sm text-slate-500 mb-6 bg-yellow-50 p-3 rounded-lg">
              ⚠️ Esta acción no se puede deshacer. Se eliminará toda la información de la asignación.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                variant="secondary"
                onClick={handleDeleteCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={deletingId === assignmentToDelete.id}
                className="flex-1"
              >
                {deletingId === assignmentToDelete.id ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {ToastComponent}
    </div>
  )
} 