'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAssignments } from '@/hooks/useAssignments'
import { useWorkers } from '@/hooks/useWorkers'
import { useUsers } from '@/hooks/useUsers'
import PlanningCalendar from '@/components/PlanningCalendar'
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Clock, 
  Calendar,
  AlertTriangle,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Menu
} from 'lucide-react'

export default function PlanningDashboardPage() {
  const { assignments, getAssignmentStats, isLoading: assignmentsLoading } = useAssignments()
  const { workers } = useWorkers()
  const { data: users } = useUsers()
  
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filterWorker, setFilterWorker] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const stats = getAssignmentStats()
  const activeWorkers = workers.filter(w => w.is_active)
  const activeUsers = users?.filter(u => u.is_active) || []

  // Calculate additional stats
  const weeklyStats = {
    totalWorkers: activeWorkers.length,
    activeAssignments: stats.active,
    totalWeeklyHours: stats.totalWeeklyHours,
    averageHoursPerWorker: activeWorkers.length > 0 ? (stats.totalWeeklyHours / activeWorkers.length).toFixed(1) : '0',
    utilizationRate: activeWorkers.length > 0 ? 
      ((stats.totalWeeklyHours / (activeWorkers.reduce((sum, w) => sum + w.max_weekly_hours, 0))) * 100).toFixed(1) : '0'
  }

  const detectConflicts = (): string[] => {
    const conflicts: string[] = []
    const activeAssignments = assignments.filter(a => a.status === 'active')
    
    // Group by worker
    const workerAssignments = activeAssignments.reduce((acc, assignment) => {
      if (!acc[assignment.worker_id]) acc[assignment.worker_id] = []
      acc[assignment.worker_id].push(assignment)
      return acc
    }, {} as Record<string, typeof assignments>)
    
    // Check for actual schedule conflicts within each worker
    Object.entries(workerAssignments).forEach(([workerId, workerAssignments]) => {
      if (workerAssignments.length > 1) {
        // Check for schedule overlaps between assignments
        for (let i = 0; i < workerAssignments.length; i++) {
          for (let j = i + 1; j < workerAssignments.length; j++) {
            const assignment1 = workerAssignments[i]
            const assignment2 = workerAssignments[j]
            
            // Only check for conflicts if both assignments have specific schedules
            if (assignment1.specific_schedule && assignment2.specific_schedule) {
              const hasConflict = checkScheduleOverlap(
                assignment1.specific_schedule,
                assignment2.specific_schedule
              )
              
              if (hasConflict) {
                const worker = activeWorkers.find(w => w.id === workerId)
                const user1 = activeUsers.find(u => u.id === assignment1.user_id)
                const user2 = activeUsers.find(u => u.id === assignment2.user_id)
                
                conflicts.push(
                  `${worker?.name} ${worker?.surname}: Conflicto entre ${user1?.name} y ${user2?.name}`
                )
              }
            }
          }
        }
      }
    })
    
    return conflicts
  }

  // Helper function to check schedule overlap
  const checkScheduleOverlap = (schedule1: any, schedule2: any): boolean => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    for (const day of days) {
      if (schedule1[day] && schedule2[day]) {
        const times1 = schedule1[day] as string[]
        const times2 = schedule2[day] as string[]
        
        // Only check for overlap if both schedules have valid times for this day
        if (times1.length >= 2 && times2.length >= 2 && 
            times1[0] && times1[1] && times2[0] && times2[1] &&
            times1[0] !== '' && times1[1] !== '' && times2[0] !== '' && times2[1] !== '') {
          
          const start1 = times1[0]
          const end1 = times1[1]
          const start2 = times2[0]
          const end2 = times2[1]
          
          // Check for time overlap
          if (start1 < end2 && start2 < end1) {
            return true
          }
        }
      }
    }
    
    return false
  }

  const conflicts = detectConflicts()

  const clearFilters = () => {
    setFilterWorker('')
    setFilterStatus('active')
  }

  const generateReport = () => {
    // In a real app, this would generate a PDF or Excel report
    const reportData = {
      date: new Date().toISOString(),
      stats: weeklyStats,
      assignments: assignments.filter(a => a.status === 'active'),
      conflicts: conflicts
    }
    
    console.log('Planning Report:', reportData)
    alert('Función de reporte en desarrollo. Ver consola para datos.')
  }

  if (assignmentsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando dashboard de planning...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                🖱️ Dashboard de Planning
              </h1>
              <p className="text-sm text-slate-600 truncate">
                Planning semanal con gestión de asignaciones
              </p>
              <div className="flex items-center space-x-2 mt-2 overflow-x-auto">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                  🎯 Control Central
                </span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                  📅 Vista Semanal
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                  💾 Guardado Automático
                </span>
                {conflicts.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                    ⚠️ {conflicts.length} Conflictos
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="secondary" size="sm" onClick={generateReport}>
              <Download className="w-4 h-4 mr-2" />
              Reporte
            </Button>
            <Link href="/dashboard/assignments/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Asignación
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Actions Menu */}
        {showMobileMenu && (
          <div className="sm:hidden mb-6">
            <div className="flex flex-col space-y-2">
              <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)} className="w-full justify-start">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button variant="secondary" size="sm" onClick={generateReport} className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Reporte
              </Button>
              <Link href="/dashboard/assignments/new">
                <Button className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Asignación
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filtros de Vista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Trabajadora
                  </label>
                  <select
                    value={filterWorker}
                    onChange={(e) => setFilterWorker(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas las trabajadoras</option>
                    {activeWorkers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} {worker.surname}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos los estados</option>
                    <option value="active">Activas</option>
                    <option value="paused">Pausadas</option>
                    <option value="completed">Completadas</option>
                    <option value="cancelled">Canceladas</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button variant="secondary" onClick={clearFilters} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Trabajadoras</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{weeklyStats.totalWorkers}</p>
                  <p className="text-xs text-slate-500">Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Asignaciones</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{weeklyStats.activeAssignments}</p>
                  <p className="text-xs text-slate-500">Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Horas/Semana</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{weeklyStats.totalWeeklyHours}</p>
                  <p className="text-xs text-slate-500">Total asignadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Promedio</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{weeklyStats.averageHoursPerWorker}h</p>
                  <p className="text-xs text-slate-500">Por trabajadora</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Utilización</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{weeklyStats.utilizationRate}%</p>
                  <p className="text-xs text-slate-500">Capacidad usada</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conflicts Alert */}
        {conflicts.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-red-900">Conflictos Detectados</h3>
                  <p className="text-red-700 mb-3 text-sm">
                    Se han detectado {conflicts.length} posibles conflictos en el planning:
                  </p>
                  <ul className="space-y-1">
                    {conflicts.map((conflict, index) => (
                      <li key={index} className="text-sm text-red-600">
                        • {conflict}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <Link href="/dashboard/assignments">
                      <Button size="sm" variant="secondary">
                        Revisar Asignaciones
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planning Calendar */}
        <PlanningCalendar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          filterWorker={filterWorker}
          filterStatus={filterStatus}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/assignments/new">
                <Button variant="secondary" className="w-full">
                  Nueva Asignación
                </Button>
              </Link>
              <Link href="/dashboard/workers/new">
                <Button variant="secondary" className="w-full">
                  Registrar Trabajadora
                </Button>
              </Link>
              <Link href="/dashboard/users/new">
                <Button variant="secondary" className="w-full">
                  Registrar Usuario
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Navegación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/assignments">
                <Button variant="secondary" className="w-full">
                  Ver Todas las Asignaciones
                </Button>
              </Link>
              <Link href="/dashboard/workers">
                <Button variant="secondary" className="w-full">
                  Gestionar Trabajadoras
                </Button>
              </Link>
              <Link href="/dashboard/users">
                <Button variant="secondary" className="w-full">
                  Gestionar Usuarios
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Resumen del Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Fecha seleccionada:</span>
                  <span className="font-medium text-right">
                    {selectedDate.toLocaleDateString('es-ES', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Asignaciones activas:</span>
                  <span className="font-medium text-green-600">{stats.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Horas totales:</span>
                  <span className="font-medium text-blue-600">{stats.totalWeeklyHours}h</span>
                </div>
                {conflicts.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Conflictos:</span>
                    <span className="font-medium text-red-600">{conflicts.length}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 