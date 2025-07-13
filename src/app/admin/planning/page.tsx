'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  Clock, 
  Users, 
  BarChart3, 
  Plus, 
  Filter, 
  Search,
  X,
  User,
  UserCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getHolidaysForYear } from '@/lib/holidayUtils'

interface Assignment {
  id: string
  worker: {
    id: string
    name: string
    surname: string
    worker_type: string
  }
  user: {
    id: string
    name: string
    surname: string
    client_code: string
  }
  weekly_hours: number
  status: string
  start_date: string
  end_date?: string
  assignment_type?: string
  schedule?: any
}

interface Worker {
  id: string
  name: string
  surname: string
  worker_type: string
  is_active: boolean
}

interface User {
  id: string
  name: string
  surname: string
  client_code: string
  is_active: boolean
}

export default function PlanningPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [holidays, setHolidays] = useState<string[]>([])
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWorker, setSelectedWorker] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedAssignmentType, setSelectedAssignmentType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('active')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'general' | 'worker' | 'user'>('general')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadHolidays()
  }, [currentMonth])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar asignaciones
      const assignmentsResponse = await supabase
        ?.from('assignments')
        .select(`
          id,
          weekly_hours,
          status,
          start_date,
          end_date,
          assignment_type,
          schedule,
          worker:workers(id, name, surname, worker_type, is_active),
          user:users(id, name, surname, client_code, is_active)
        `)
        .eq('status', 'active')

      // Cargar trabajadoras
      const workersResponse = await supabase
        ?.from('workers')
        .select('id, name, surname, worker_type, is_active')
        .eq('is_active', true)
        .order('name')

      // Cargar usuarios
      const usersResponse = await supabase
        ?.from('users')
        .select('id, name, surname, client_code, is_active')
        .eq('is_active', true)
        .order('name')

      if (assignmentsResponse?.error) {
        console.error('Error al cargar asignaciones:', assignmentsResponse.error)
      } else {
        const transformedData = (assignmentsResponse?.data || []).map((item: any) => ({
          id: item.id,
          weekly_hours: item.weekly_hours,
          status: item.status,
          start_date: item.start_date,
          end_date: item.end_date,
          assignment_type: item.assignment_type,
          schedule: item.schedule,
          worker: Array.isArray(item.worker) ? item.worker[0] : item.worker,
          user: Array.isArray(item.user) ? item.user[0] : item.user,
        }))
        setAssignments(transformedData)
      }

      if (workersResponse?.error) {
        console.error('Error al cargar trabajadoras:', workersResponse.error)
      } else {
        setWorkers(workersResponse?.data || [])
      }

      if (usersResponse?.error) {
        console.error('Error al cargar usuarios:', usersResponse.error)
      } else {
        setUsers(usersResponse?.data || [])
      }

    } catch (error) {
      console.error('Error inesperado:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHolidays = async () => {
    try {
      const year = currentMonth.getFullYear()
      const holidaysData = await getHolidaysForYear(year)
      const holidayDates = holidaysData.map(h => h.date)
      setHolidays(holidayDates)
    } catch (error) {
      console.error('Error al cargar festivos:', error)
    }
  }

  // Filtros aplicados
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      // Filtro por trabajadora
      if (selectedWorker && assignment.worker.id !== selectedWorker) return false
      
      // Filtro por usuario
      if (selectedUser && assignment.user.id !== selectedUser) return false
      
      // Filtro por tipo de asignación
      if (selectedAssignmentType && assignment.assignment_type !== selectedAssignmentType) return false
      
      // Filtro por estado
      if (selectedStatus && assignment.status !== selectedStatus) return false
      
      // Filtro por búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const workerName = `${assignment.worker.name} ${assignment.worker.surname}`.toLowerCase()
        const userName = `${assignment.user.name} ${assignment.user.surname}`.toLowerCase()
        const userCode = assignment.user.client_code?.toLowerCase() || ''
        
        if (!workerName.includes(searchLower) && 
            !userName.includes(searchLower) && 
            !userCode.includes(searchLower)) {
          return false
        }
      }
      
      return true
    })
  }, [assignments, selectedWorker, selectedUser, selectedAssignmentType, selectedStatus, searchTerm])

  // Estadísticas filtradas
  const stats = useMemo(() => {
    const totalHours = filteredAssignments.reduce((sum, a) => sum + a.weekly_hours, 0)
    const uniqueWorkers = new Set(filteredAssignments.map(a => a.worker.id)).size
    const uniqueUsers = new Set(filteredAssignments.map(a => a.user.id)).size
    const laborables = filteredAssignments.filter(a => a.assignment_type === 'laborables').length
    const festivos = filteredAssignments.filter(a => a.assignment_type === 'festivos').length

    return {
      totalAssignments: filteredAssignments.length,
      totalHours,
      uniqueWorkers,
      uniqueUsers,
      laborables,
      festivos
    }
  }, [filteredAssignments])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedWorker('')
    setSelectedUser('')
    setSelectedAssignmentType('')
    setSelectedStatus('active')
    setViewMode('general')
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const jsDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return jsDay === 0 ? 6 : jsDay - 1
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) })
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

  const isHolidayOrWeekend = (date: Date) => {
    const dayOfWeek = date.getDay()
    const dateString = date.toLocaleDateString('en-CA')
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = holidays.includes(dateString)
    return isWeekend || isHoliday
  }

  const getAssignmentsForDay = (date: Date) => {
    const dayOfWeek = date.getDay()
    const dateString = date.toLocaleDateString('en-CA')
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = holidays.includes(dateString)
    const isSpecialDay = isWeekend || isHoliday
    const assignmentType = isSpecialDay ? 'festivos' : 'laborables'

    return filteredAssignments.filter(assignment => {
      const start = new Date(assignment.start_date)
      const end = assignment.end_date ? new Date(assignment.end_date) : null
      const isActive = (!end && date >= start) || (end && date >= start && date <= end)
      return assignment.assignment_type === assignmentType && isActive
    })
  }

  // Función para obtener el horario específico de una asignación para un día
  const getAssignmentScheduleForDay = (assignment: Assignment, date: Date) => {
    if (!assignment.schedule) return null

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[date.getDay()]
    
    const daySchedule = assignment.schedule[dayName]
    if (daySchedule && daySchedule.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
      return daySchedule.timeSlots[0] // Tomamos el primer timeSlot
    }
    
    return null
  }

  // Función para formatear el horario
  const formatTimeSlot = (timeSlot: { start: string; end: string }) => {
    return `${timeSlot.start} - ${timeSlot.end}`
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

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

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
              <Button 
                variant="secondary" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
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

        {/* Buscador Inteligente */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por trabajadora, usuario o código de cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
                             {(searchTerm || selectedWorker || selectedUser || selectedAssignmentType !== '') && (
                 <Button variant="secondary" onClick={clearFilters}>
                   <X className="w-4 h-4 mr-2" />
                   Limpiar
                 </Button>
               )}
            </div>

            {/* Filtros Avanzados */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                {/* Filtro por Trabajadora */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Trabajadora
                  </label>
                  <select
                    value={selectedWorker}
                    onChange={(e) => setSelectedWorker(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas las trabajadoras</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} {worker.surname} ({worker.worker_type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Usuario */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Usuario
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los usuarios</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.surname} ({user.client_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Tipo de Asignación */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de Asignación
                  </label>
                  <select
                    value={selectedAssignmentType}
                    onChange={(e) => setSelectedAssignmentType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="laborables">Laborables</option>
                    <option value="festivos">Festivos</option>
                  </select>
                </div>

                {/* Filtro por Estado */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Activas</option>
                    <option value="paused">Pausadas</option>
                    <option value="">Todas</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breadcrumbs y Vista Actual */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <span>Vista:</span>
            <span className="font-medium text-slate-900">
              {selectedWorker 
                ? `Trabajadora: ${workers.find(w => w.id === selectedWorker)?.name} ${workers.find(w => w.id === selectedWorker)?.surname}`
                : selectedUser
                ? `Usuario: ${users.find(u => u.id === selectedUser)?.name} ${users.find(u => u.id === selectedUser)?.surname}`
                : 'General'
              }
            </span>
            {filteredAssignments.length !== assignments.length && (
              <span className="text-blue-600">
                ({filteredAssignments.length} de {assignments.length} asignaciones)
              </span>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Asignaciones
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.totalAssignments}
              </div>
              <p className="text-xs text-slate-600">
                activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Horas/Semana
              </CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.totalHours}
              </div>
              <p className="text-xs text-slate-600">
                programadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Trabajadoras
              </CardTitle>
              <UserCheck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.uniqueWorkers}
              </div>
              <p className="text-xs text-slate-600">
                asignadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Usuarios
              </CardTitle>
              <User className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.uniqueUsers}
              </div>
              <p className="text-xs text-slate-600">
                atendidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Laborables
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.laborables}
              </div>
              <p className="text-xs text-slate-600">
                asignaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Festivos
              </CardTitle>
              <Calendar className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.festivos}
              </div>
              <p className="text-xs text-slate-600">
                asignaciones
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
              {filteredAssignments.length > 0 && (
                <span className="text-sm text-slate-500 font-normal">
                  ({filteredAssignments.length} asignaciones mostradas)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {/* Headers */}
              {weekDays.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-slate-600 bg-slate-50 rounded">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {generateCalendarDays().map((cell, index) => {
                const { date } = cell
                let isSpecialDay = false
                let dayAssignments: Assignment[] = []
                
                if (date) {
                  isSpecialDay = isHolidayOrWeekend(date)
                  dayAssignments = getAssignmentsForDay(date)
                }
                
                return (
                  <div
                    key={index}
                    className={`p-2 min-h-[100px] border border-slate-200 ${
                      date ? 'bg-white' : 'bg-slate-50'
                    } ${isSpecialDay ? 'bg-red-50 border-red-200' : ''}`}
                  >
                    {date && (
                      <>
                        <div 
                          className={`text-sm font-medium mb-2 ${
                            isSpecialDay ? 'text-red-900' : 'text-slate-900'
                          }`}
                        >
                          {date.getDate()}
                          {isSpecialDay && (
                            <span className="ml-1 text-xs text-red-600">
                              {isHolidayOrWeekend(date) ? '🎯' : '🏖️'}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                          {dayAssignments.length === 0 ? (
                            <div className="text-xs text-slate-400 italic">Sin asignación</div>
                          ) : (
                            dayAssignments.map(assignment => {
                              const schedule = getAssignmentScheduleForDay(assignment, date)
                              return (
                                <div
                                  key={assignment.id}
                                  className={`text-xs p-1 rounded border ${
                                    assignment.assignment_type === 'festivos'
                                      ? 'bg-red-100 border-red-300 text-red-800'
                                      : 'bg-blue-100 border-blue-300 text-blue-800'
                                  }`}
                                  title={`${assignment.worker.name} ${assignment.worker.surname} → ${assignment.user.name} ${assignment.user.surname} (${assignment.weekly_hours}h)`}
                                >
                                  <div className="font-medium truncate">
                                    {assignment.worker.name} → {assignment.user.name}
                                  </div>
                                  <div className="text-xs opacity-75">
                                    {schedule ? formatTimeSlot(schedule) : `${assignment.weekly_hours}h`}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Assignments List */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <span>Asignaciones Filtradas</span>
              {filteredAssignments.length > 0 && (
                <span className="text-sm text-slate-500 font-normal">
                  ({filteredAssignments.length} resultados)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No se encontraron asignaciones con los filtros aplicados</p>
                <Button variant="secondary" onClick={clearFilters} className="mt-4">
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Trabajadora</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Usuario</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Horas/Semana</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Inicio</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Fin</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map(assignment => (
                      <tr key={assignment.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">
                            {assignment.worker.name} {assignment.worker.surname}
                          </div>
                          <div className="text-sm text-slate-500">
                            {assignment.worker.worker_type}
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
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            assignment.assignment_type === 'festivos'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {assignment.assignment_type === 'festivos' ? 'Festivos' : 'Laborables'}
                          </span>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 