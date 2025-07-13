'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAssignments } from '@/hooks/useAssignments'
import { useWorkers } from '@/hooks/useWorkers'
import { useUsers } from '@/hooks/useUsers'
import { useToast } from '@/components/ui/toast'
import { Assignment, WeekDay } from '@/lib/types-new'
import { 
  Clock, 
  User, 
  Phone, 
  ChevronLeft,
  ChevronRight,
  Calendar,
  Edit,
  Trash2,
  X,
  Filter,
  AlertTriangle,
  Copy
} from 'lucide-react'
import { getHolidaysForYear } from '@/lib/holidayUtils'

const weekDays: { key: WeekDay; label: string; short: string }[] = [
  { key: 'monday', label: 'Lunes', short: 'L' },
  { key: 'tuesday', label: 'Martes', short: 'M' },
  { key: 'wednesday', label: 'Miércoles', short: 'X' },
  { key: 'thursday', label: 'Jueves', short: 'J' },
  { key: 'friday', label: 'Viernes', short: 'V' },
  { key: 'saturday', label: 'Sábado', short: 'S' },
  { key: 'sunday', label: 'Domingo', short: 'D' }
]

const workerColors = [
          'bg-primary-100 border-primary-300 text-primary-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-red-100 border-red-300 text-red-800',
  'bg-orange-100 border-orange-300 text-orange-800'
]

interface PlanningCalendarProps {
  selectedDate?: Date
  onDateChange?: (date: Date) => void
  filterWorker?: string
  filterStatus?: string
}

interface CalendarAssignment extends Assignment {
  color: string
  timeSlot: string
  duration: number
  startTime: string
  endTime: string
  dayOfWeek: WeekDay
  topPosition: number
  height: number
}

export default function PlanningCalendar({ 
  selectedDate = new Date(), 
  onDateChange,
  filterWorker,
  filterStatus 
}: PlanningCalendarProps) {
  console.log('🎯 [PLANNING] Componente PlanningCalendar renderizado')
  
  const { assignments, isLoading, deleteAssignment, updateAssignment } = useAssignments()
  const { workers } = useWorkers()
  const { data: users } = useUsers()
  const { showToast, ToastComponent } = useToast()
  const router = useRouter()
  
  const [currentWeek, setCurrentWeek] = useState(selectedDate)
  const [selectedAssignment, setSelectedAssignment] = useState<CalendarAssignment | null>(null)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState<string>(filterWorker || '')
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [selectedDay, setSelectedDay] = useState<WeekDay>('monday')
  const [deleteModalAssignment, setDeleteModalAssignment] = useState<CalendarAssignment | null>(null)
  const [holidays, setHolidays] = useState<string[]>([])

  useEffect(() => {
    async function loadHolidays() {
      const year = currentWeek.getFullYear()
      const holidaysData = await getHolidaysForYear(year)
      setHolidays(holidaysData.map(h => h.date))
    }
    loadHolidays()
  }, [currentWeek])

  const isHolidayOrWeekend = (date: Date) => {
    const day = date.getDay()
    const dateString = date.toISOString().split('T')[0]
    const result = day === 0 || day === 6 || holidays.includes(dateString)
    
    // Log de depuración
    if (result) {
      console.log(`🔴 Día marcado como festivo/fin de semana: ${dateString} (${date.toLocaleDateString('es-ES')})`)
    }
    
    return result
  }

  // Get start of week (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // Calculate duration helper function
  const calculateDuration = (start: string, end: string): number => {
    const startTime = new Date(`2000-01-01T${start}:00`)
    const endTime = new Date(`2000-01-01T${end}:00`)
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  }

  const weekStart = getWeekStart(currentWeek)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  // Get time slots for positioning
  const getTimeSlots = () => {
    const slots = []
    for (let hour = 7; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
      }
    }
    return slots
  }

  const timeSlots = getTimeSlots()
  const slotHeight = 30 // 30px per 15-minute slot

  // Calculate position for a time
  const getTimePosition = (time: string): number => {
    const index = timeSlots.findIndex(slot => slot === time)
    return index * slotHeight
  }

  // Process assignments for calendar view
  const calendarAssignments = useMemo(() => {
    const processed: CalendarAssignment[] = []
    
    console.log('🔍 [CALENDAR] Procesando asignaciones:', assignments.length)
    console.log('🔍 [CALENDAR] Filtros:', { selectedWorkerFilter, selectedUserFilter, filterStatus })
    
    assignments.forEach((assignment) => {
      if (assignment.status !== 'active') return
      
      if (selectedWorkerFilter && assignment.worker_id !== selectedWorkerFilter) return
      if (selectedUserFilter && assignment.user_id !== selectedUserFilter) return
      if (filterStatus && assignment.status !== filterStatus) return
      
      console.log(`🔍 [CALENDAR] Procesando asignación:`, {
        id: assignment.id,
        worker_id: assignment.worker_id,
        assignment_type: assignment.assignment_type,
        has_schedule: !!assignment.schedule
      })
      
      const workerIndex = workers.findIndex(w => w.id === assignment.worker_id)
      const color = workerColors[workerIndex % workerColors.length]
      
      // Procesar asignaciones con horario específico (laborables)
      if (assignment.schedule) {
        console.log(`🔍 [CALENDAR] Procesando horario específico para asignación ${assignment.id}`)
        Object.entries(assignment.schedule).forEach(([day, daySchedule]) => {
          if (daySchedule && daySchedule.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
            const timeSlot = daySchedule.timeSlots[0]
            if (timeSlot.start && timeSlot.end) {
              const startTime = timeSlot.start
              const endTime = timeSlot.end
              const duration = calculateDuration(startTime, endTime)
              
              processed.push({
                ...assignment,
                color,
                dayOfWeek: day as WeekDay,
                timeSlot: `${startTime}-${endTime}`,
                duration,
                startTime,
                endTime,
                topPosition: getTimePosition(startTime),
                height: Math.max(duration * 4 * slotHeight, slotHeight) // 4 slots per hour
              })
            }
          }
        })
      }
      
      // Procesar asignaciones de festivos
      if (assignment.assignment_type === 'festivos') {
        console.log(`🔍 [CALENDAR] Procesando asignación de festivos: ${assignment.id}`)
        // Para asignaciones de festivos, crear entradas para todos los días festivos de la semana
        weekDates.forEach((date, index) => {
          if (isHolidayOrWeekend(date)) {
            const dayOfWeek = weekDays[index].key
            const startTime = '09:00' // Hora por defecto para festivos
            const endTime = '12:30'   // Hora por defecto para festivos
            const duration = calculateDuration(startTime, endTime)
            
            console.log(`🔍 [CALENDAR] Agregando festivo para ${dayOfWeek} (${date.toISOString().split('T')[0]})`)
            
            processed.push({
              ...assignment,
              color,
              dayOfWeek,
              timeSlot: `${startTime}-${endTime}`,
              duration,
              startTime,
              endTime,
              topPosition: getTimePosition(startTime),
              height: Math.max(duration * 4 * slotHeight, slotHeight)
            })
          }
        })
      }
    })
    
    console.log(`🔍 [CALENDAR] Total de asignaciones procesadas: ${processed.length}`)
    return processed
  }, [assignments, workers, selectedWorkerFilter, selectedUserFilter, filterStatus, timeSlots, weekDates, weekDays])

  const getAssignmentsForDay = (day: WeekDay) => {
    return calendarAssignments
      .filter(assignment => assignment.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const detectConflicts = (day: WeekDay) => {
    const dayAssignments = getAssignmentsForDay(day)
    const conflicts: CalendarAssignment[] = []
    
    for (let i = 0; i < dayAssignments.length; i++) {
      for (let j = i + 1; j < dayAssignments.length; j++) {
        const a1 = dayAssignments[i]
        const a2 = dayAssignments[j]
        
        if (a1.worker_id === a2.worker_id) {
          if (a1.startTime < a2.endTime && a2.startTime < a1.endTime) {
            conflicts.push(a1, a2)
          }
        }
      }
    }
    
    return conflicts
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate)
    onDateChange?.(newDate)
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      const currentDayIndex = weekDays.findIndex(d => d.key === selectedDay)
      const newDayIndex = direction === 'next' 
        ? (currentDayIndex + 1) % 7 
        : (currentDayIndex - 1 + 7) % 7
      setSelectedDay(weekDays[newDayIndex].key)
    } else {
      navigateWeek(direction)
    }
  }

  const formatWeekRange = () => {
    const endDate = new Date(weekStart)
    endDate.setDate(weekStart.getDate() + 6)
    
    return `${weekStart.getDate()} ${weekStart.toLocaleDateString('es-ES', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`
  }

  const formatDayRange = () => {
    const dayIndex = weekDays.findIndex(d => d.key === selectedDay)
    const dayDate = weekDates[dayIndex]
    return `${dayDate?.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`
  }

  const clearFilters = () => {
    setSelectedWorkerFilter('')
    setSelectedUserFilter('')
  }

  const handleEditAssignment = (assignment: CalendarAssignment) => {
    // console.log('Editar: selectedAssignment', assignment)
    const original = assignments.find(a => a.id === assignment.id)
    // console.log('Editar: original assignment', original)
    if (!original || !original.id) {
      showToast('Error: No se encontró la asignación original para editar', 'error')
      return
    }
    router.push(`/dashboard/assignments/${original.id}/edit`)
  }

  const handleDuplicateAssignment = async (assignment: CalendarAssignment) => {
    // console.log('Duplicar: selectedAssignment', assignment)
    const original = assignments.find(a => a.id === assignment.id)
    // console.log('Duplicar: original assignment', original)
    // console.log('Duplicar: original.start_date', original?.start_date)
    // console.log('Duplicar: assignment.start_date', assignment.start_date)
    
    if (!original) {
      showToast('Error: No se encontró la asignación original para duplicar', 'error')
      return
    }
    
    // Use the assignment's start_date if available, otherwise use original's
    const baseStartDate = assignment.start_date || original.start_date
    // console.log('Duplicar: baseStartDate', baseStartDate)
    
    if (!baseStartDate) {
      // If no start_date is available, use tomorrow as base
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const fallbackBaseDate = tomorrow.toISOString().split('T')[0]
      // console.log('Duplicar: usando fecha de mañana como base:', fallbackBaseDate)
      
      const params = new URLSearchParams({
        worker_id: original.worker_id,
        user_id: original.user_id,
        weekly_hours: original.weekly_hours?.toString() || '',
        hourly_rate: (original as Assignment & { hourly_rate?: number }).hourly_rate?.toString() || '0',
        priority: original.priority?.toString() || '',
        notes: original.notes || '',
        start_date: fallbackBaseDate
      })
      
      showToast(`Duplicando asignación con fecha de inicio: ${fallbackBaseDate} (mañana)`, 'success')
      router.push(`/dashboard/assignments/new?${params.toString()}`)
      return
    }
    
    // Find an available start date by checking existing assignments
    const originalStartDate = new Date(baseStartDate)
    // console.log('Duplicar: originalStartDate', originalStartDate)
    const suggestedStartDate = new Date(originalStartDate)
    let attempts = 0
    const maxAttempts = 30 // Try up to 30 days ahead
    
    while (attempts < maxAttempts) {
      suggestedStartDate.setDate(originalStartDate.getDate() + attempts + 1)
      const newStartDate = suggestedStartDate.toISOString().split('T')[0]
      // console.log(`Duplicar: intento ${attempts + 1}, fecha sugerida: ${newStartDate}`)
      
      // Check if this date is available for this worker and user combination
      const existingAssignment = assignments.find(a => 
        a.worker_id === original.worker_id && 
        a.user_id === original.user_id && 
        a.start_date === newStartDate
      )
      
      if (!existingAssignment) {
        // This date is available, use it
        // console.log(`Duplicar: fecha disponible encontrada: ${newStartDate}`)
        const params = new URLSearchParams({
          worker_id: original.worker_id,
          user_id: original.user_id,
          weekly_hours: original.weekly_hours?.toString() || '',
          hourly_rate: (original as Assignment & { hourly_rate?: number }).hourly_rate?.toString() || '0',
          priority: original.priority?.toString() || '',
          notes: original.notes || '',
          start_date: newStartDate
        })
        
        showToast(`Duplicando asignación con fecha de inicio: ${newStartDate}`, 'success')
        router.push(`/dashboard/assignments/new?${params.toString()}`)
        return
      }
      
      attempts++
    }
    
    // If we couldn't find an available date, use a date far in the future
    const farFutureDate = new Date(originalStartDate)
    farFutureDate.setDate(originalStartDate.getDate() + 365) // One year later
    const fallbackDate = farFutureDate.toISOString().split('T')[0]
    // console.log(`Duplicar: usando fecha de fallback: ${fallbackDate}`)
    
    const params = new URLSearchParams({
      worker_id: original.worker_id,
      user_id: original.user_id,
      weekly_hours: original.weekly_hours?.toString() || '',
      hourly_rate: (original as Assignment & { hourly_rate?: number }).hourly_rate?.toString() || '0',
      priority: original.priority?.toString() || '',
      notes: original.notes || '',
      start_date: fallbackDate
    })
    
    showToast(`Duplicando asignación con fecha de inicio: ${fallbackDate} (fecha futura)`, 'warning')
    router.push(`/dashboard/assignments/new?${params.toString()}`)
  }

  const handleDeleteAssignment = (assignment: CalendarAssignment) => {
    setDeleteModalAssignment(assignment)
  }

  const confirmDeleteDay = async () => {
    if (!deleteModalAssignment) return
    // Eliminar solo el día/hora del schedule
    const { dayOfWeek, startTime, endTime, id, schedule } = deleteModalAssignment
    if (!schedule || !schedule[dayOfWeek]) return
    // Si el bloque a eliminar coincide exactamente con el bloque del schedule
    const daySchedule = schedule[dayOfWeek]
    if (daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
      const timeSlot = daySchedule.timeSlots[0]
      if (timeSlot.start === startTime && timeSlot.end === endTime) {
        // Deshabilitar ese día del schedule
        const newSchedule = { ...schedule }
        newSchedule[dayOfWeek] = {
          ...newSchedule[dayOfWeek],
          enabled: false,
          timeSlots: []
        }
        // Si no quedan días habilitados, eliminar la asignación completa
        const enabledDays = Object.values(newSchedule).filter(day => day.enabled)
        if (enabledDays.length === 0) {
          await confirmDeleteAssignment()
          return
        }
        // Si quedan días, actualizar la asignación
        try {
          await updateAssignment(id, { schedule: newSchedule })
          showToast('Bloque eliminado correctamente', 'success')
        } catch (err) {
          showToast('Error inesperado al eliminar bloque', 'error')
        } finally {
          setDeleteModalAssignment(null)
        }
      }
    }
  }

  const confirmDeleteAssignment = async () => {
    if (!deleteModalAssignment) return
    try {
      await deleteAssignment(deleteModalAssignment.id)
      showToast('Asignación eliminada correctamente', 'success')
    } catch (err) {
      showToast('Error inesperado al eliminar', 'error')
    } finally {
      setDeleteModalAssignment(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 sm:p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando planning...</p>
        </CardContent>
      </Card>
    )
  }

  const activeWorkers = workers.filter(w => w.is_active)
  const activeUsers = users?.filter(u => u.is_active) || []
  const totalHeight = timeSlots.length * slotHeight

  // Get days to display based on view mode
  const displayDays = viewMode === 'day' ? [weekDays.find(d => d.key === selectedDay)!] : weekDays

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Planning {viewMode === 'day' ? 'Diario' : 'Semanal'}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" onClick={() => navigateDay('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium text-slate-900 min-w-[180px] sm:min-w-[200px] text-center text-sm sm:text-base">
                  {viewMode === 'day' ? formatDayRange() : formatWeekRange()}
                </span>
                <Button variant="secondary" size="sm" onClick={() => navigateDay('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="sm:hidden"
              >
                <Filter className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'week' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Semana
              </Button>
              <Button
                variant={viewMode === 'day' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Día
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Sidebar */}
            <div className={`lg:w-80 ${showSidebar ? 'block' : 'hidden lg:block'}`}>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-sm">
                      <User className="w-4 h-4 mr-2" />
                      Trabajadoras ({activeWorkers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant={selectedWorkerFilter === '' ? 'primary' : 'secondary'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setSelectedWorkerFilter('')}
                    >
                      Todas las trabajadoras
                    </Button>
                    {activeWorkers.map((worker) => (
                      <Button
                        key={worker.id}
                        variant={selectedWorkerFilter === worker.id ? 'primary' : 'secondary'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedWorkerFilter(worker.id)}
                      >
                        <div className={`w-3 h-3 rounded-full mr-2 ${workerColors[workers.indexOf(worker) % workerColors.length].replace('bg-', 'bg-').replace(' border-', '')}`}></div>
                        {worker.name} {worker.surname}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-sm">
                      <User className="w-4 h-4 mr-2" />
                      Usuarios ({activeUsers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant={selectedUserFilter === '' ? 'primary' : 'secondary'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setSelectedUserFilter('')}
                    >
                      Todos los usuarios
                    </Button>
                    {activeUsers.map((user) => (
                      <Button
                        key={user.id}
                        variant={selectedUserFilter === user.id ? 'primary' : 'secondary'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedUserFilter(user.id)}
                      >
                        {user.name} {user.surname}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                {(selectedWorkerFilter || selectedUserFilter) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                )}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {/* Days Header */}
                <div className={`grid ${viewMode === 'day' ? 'grid-cols-2' : 'grid-cols-8'} bg-slate-50`}>
                  <div className="p-2 sm:p-3 text-xs sm:text-sm font-medium text-slate-600 border-r border-slate-200">
                    Hora
                  </div>
                  {displayDays.map((day, index) => {
                    const conflicts = detectConflicts(day.key)
                    const dayAssignments = getAssignmentsForDay(day.key)
                    const dayDate = weekDates[weekDays.findIndex(d => d.key === day.key)]
                    
                    return (
                      <div
                        key={day.key}
                        className={`p-2 sm:p-3 text-center border-r border-slate-200 last:border-r-0 ${
                          isHolidayOrWeekend(dayDate) 
                            ? 'bg-red-200 text-red-900 font-bold' 
                            : ''
                        }`}
                        title={isHolidayOrWeekend(dayDate) ? 'Festivo o fin de semana' : ''}
                      >
                        <div className="text-xs sm:text-sm font-medium text-slate-900">
                          {viewMode === 'day' ? day.label : day.short}
                        </div>
                        <div className="text-xs text-slate-500">
                          {dayDate?.getDate()}/{dayDate?.getMonth() + 1}
                        </div>
                        <div className="flex items-center justify-center space-x-1 mt-1">
                          <span className="text-xs text-primary-600">{dayAssignments.length}</span>
                          {conflicts.length > 0 && (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Time Grid Container */}
                <div className="relative" style={{ height: `${totalHeight}px` }}>
                  {/* Time labels */}
                  <div className="absolute left-0 top-0 w-full">
                    {timeSlots.map((timeSlot, index) => (
                      <div
                        key={timeSlot}
                        className="absolute p-1 text-xs text-slate-500 border-r border-slate-200 bg-slate-50 w-full"
                        style={{ 
                          top: `${index * slotHeight}px`,
                          height: `${slotHeight}px`
                        }}
                      >
                        {timeSlot}
                      </div>
                    ))}
                  </div>

                  {/* Day columns with assignments */}
                  {displayDays.map((day, dayIndex) => (
                    <div
                      key={day.key}
                      className="absolute border-r border-slate-200 last:border-r-0"
                      style={{ 
                        left: `${(dayIndex + 1) * (100 / (viewMode === 'day' ? 2 : 8))}%`,
                        width: `${100 / (viewMode === 'day' ? 2 : 8)}%`,
                        height: '100%'
                      }}
                    >
                      {getAssignmentsForDay(day.key).map((assignment) => (
                        <div
                          key={assignment.id}
                          className={`absolute rounded border cursor-pointer hover:shadow-md transition-shadow group ${assignment.color}`}
                          style={{
                            top: `${assignment.topPosition}px`,
                            height: `${assignment.height}px`,
                            left: '2px',
                            right: '2px',
                            zIndex: 10
                          }}
                          onClick={() => setSelectedAssignment(assignment)}
                        >
                          <div className="p-1 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-xs truncate">
                                {assignment.worker?.name}
                              </div>
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="w-4 h-4 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditAssignment(assignment)
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="w-4 h-4 p-0"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    await handleDuplicateAssignment(assignment)
                                  }}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="w-4 h-4 p-0 text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteAssignment(assignment)
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs opacity-75 truncate">
                              {assignment.user?.name}
                            </div>
                            <div className="text-xs opacity-60 mt-auto">
                              {assignment.timeSlot}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAssignment && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalles de Asignación</h3>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setSelectedAssignment(null)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="font-medium">Trabajadora:</span>
                <span className="truncate">{selectedAssignment.worker?.name} {selectedAssignment.worker?.surname}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="font-medium">Usuario:</span>
                <span className="truncate">{selectedAssignment.user?.name} {selectedAssignment.user?.surname}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="font-medium">Horario:</span>
                <span>{selectedAssignment.timeSlot} ({selectedAssignment.duration}h)</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="font-medium">Teléfono:</span>
                <span className="truncate">{selectedAssignment.user?.phone}</span>
              </div>
              
              {selectedAssignment.notes && (
                        <div className="p-3 bg-primary-50 rounded-lg">
          <p className="text-sm font-medium text-primary-900 mb-1">Notas:</p>
          <p className="text-sm text-primary-700">{selectedAssignment.notes}</p>
        </div>
              )}
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-3">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedAssignment(null)
                    setTimeout(() => {
                      if (selectedAssignment && selectedAssignment.id) {
                        // console.log('Navegando a editar asignación:', selectedAssignment.id)
                        handleEditAssignment(selectedAssignment)
                      } else {
                        console.error('No se encontró el ID de la asignación para editar', selectedAssignment)
                        showToast('Error: No se encontró el ID de la asignación para editar', 'error')
                      }
                    }, 100)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1"
                  onClick={async () => {
                    await handleDuplicateAssignment(selectedAssignment)
                    setSelectedAssignment(null)
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    handleDeleteAssignment(selectedAssignment)
                    setSelectedAssignment(null)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
      {deleteModalAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4 text-red-700 flex items-center">
              <Trash2 className="w-5 h-5 mr-2 text-red-500" />
              Confirmar eliminación
            </h2>
            <p className="mb-4 text-slate-700">
              ¿Qué deseas eliminar?
              <br />
              <b>{deleteModalAssignment.worker?.name} {deleteModalAssignment.worker?.surname}</b> para <b>{deleteModalAssignment.user?.name} {deleteModalAssignment.user?.surname}</b>
              <br />
              <span className="text-xs text-slate-500">{deleteModalAssignment.dayOfWeek} {deleteModalAssignment.startTime}-{deleteModalAssignment.endTime}</span>
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button variant="secondary" onClick={() => setDeleteModalAssignment(null)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmDeleteDay}>
                Eliminar solo este día/hora
              </Button>
              <Button variant="danger" onClick={confirmDeleteAssignment}>
                Eliminar toda la asignación
              </Button>
            </div>
          </div>
        </div>
      )}
      {ToastComponent}
    </div>
  )
} 