'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWorkers } from '@/hooks/useWorkers'
import { useUsers } from '@/hooks/useUsers'
import { useToast } from '@/components/ui/toast'
import { Assignment, WeekDay } from '@/lib/types-new'
import { User, ChevronLeft, ChevronRight, Calendar, X, Filter, AlertTriangle } from 'lucide-react'
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
  filterWorker
}: PlanningCalendarProps) {
  // const { assignments, isLoading, deleteAssignment, updateAssignment } = useAssignments()
  const { workers } = useWorkers()
  const { data: users } = useUsers()
  const { ToastComponent } = useToast()

  const [currentWeek, setCurrentWeek] = useState(selectedDate)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState<string>(filterWorker || '')
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [selectedDay, setSelectedDay] = useState<WeekDay>('monday')

  useEffect(() => {
    async function loadHolidays() {
      const year = currentWeek.getFullYear()
      await getHolidaysForYear(year)
      // holidaysData eliminado porque no se usa
    }
    loadHolidays()
  }, [currentWeek])

  // Get start of week (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const weekStart = getWeekStart(currentWeek)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  // Process assignments for calendar view
  const calendarAssignments = useRef<CalendarAssignment[]>([])

  const getAssignmentsForDay = (day: WeekDay) => {
    return calendarAssignments.current
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

  const activeWorkers = workers.filter(w => w.is_active)
  const activeUsers = users?.filter(u => u.is_active) || []

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
                  {displayDays.map((day) => {
                    const conflicts = detectConflicts(day.key)
                    const dayAssignments = getAssignmentsForDay(day.key)
                    const dayDate = weekDates[weekDays.findIndex(d => d.key === day.key)]
                    return (
                      <div
                        key={day.key}
                        className={`p-2 sm:p-3 text-center border-r border-slate-200 last:border-r-0`}
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
                    );
                  })}
                </div>
                {ToastComponent}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}