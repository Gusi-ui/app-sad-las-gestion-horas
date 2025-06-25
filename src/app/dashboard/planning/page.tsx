'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAssignments } from '@/hooks/useAssignments'
import { useWorkers } from '@/hooks/useWorkers'
import { useUsers } from '@/hooks/useUsers'
import DragDropPlanningCalendar from '@/components/DragDropPlanningCalendar'
import DragDropInstructions from '@/components/DragDropInstructions'
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
  CheckCircle
} from 'lucide-react'

export default function PlanningDashboardPage() {
  const { assignments, getAssignmentStats, isLoading: assignmentsLoading } = useAssignments()
  const { workers } = useWorkers()
  const { data: users } = useUsers()
  
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filterWorker, setFilterWorker] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [showFilters, setShowFilters] = useState(false)

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
    }, {} as Record<string, any[]>)
    
    // Check for time conflicts within each worker
    Object.entries(workerAssignments).forEach(([workerId, assignments]) => {
      if (assignments.length > 1) {
        conflicts.push(`Trabajadora con ${assignments.length} asignaciones activas`)
      }
    })
    
    return conflicts
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                🖱️ Dashboard de Planning Interactivo
              </h1>
              <p className="text-slate-600">
                Planning semanal con drag & drop - Arrastra asignaciones para reorganizar horarios
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  🎯 Control Central
                </span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                  🖱️ Drag & Drop
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  💾 Guardado Automático
                </span>
                {conflicts.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                    ⚠️ {conflicts.length} Conflictos
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <DragDropInstructions />
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
        </div>

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Trabajadoras</p>
                  <p className="text-2xl font-bold text-slate-900">{weeklyStats.totalWorkers}</p>
                  <p className="text-xs text-slate-500">Activas</p>
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
                  <p className="text-sm font-medium text-slate-600">Asignaciones</p>
                  <p className="text-2xl font-bold text-slate-900">{weeklyStats.activeAssignments}</p>
                  <p className="text-xs text-slate-500">Activas</p>
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
                  <p className="text-2xl font-bold text-slate-900">{weeklyStats.totalWeeklyHours}</p>
                  <p className="text-xs text-slate-500">Total asignadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Promedio</p>
                  <p className="text-2xl font-bold text-slate-900">{weeklyStats.averageHoursPerWorker}h</p>
                  <p className="text-xs text-slate-500">Por trabajadora</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Utilización</p>
                  <p className="text-2xl font-bold text-slate-900">{weeklyStats.utilizationRate}%</p>
                  <p className="text-xs text-slate-500">Capacidad usada</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drag & Drop Instructions */}
        <div className="mb-6">
          <DragDropInstructions />
        </div>

        {/* Conflicts Alert */}
        {conflicts.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Conflictos Detectados</h3>
                  <p className="text-red-700 mb-3">
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
        <DragDropPlanningCalendar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          filterWorker={filterWorker}
          filterStatus={filterStatus}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
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
                  <span className="font-medium">
                    {selectedDate.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
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