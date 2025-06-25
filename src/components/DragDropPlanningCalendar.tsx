'use client'

import { useState, useMemo, useCallback } from 'react'
// import { DndProvider, useDrag, useDrop } from 'react-dnd'
// import { HTML5Backend } from 'react-dnd-html5-backend'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAssignments } from '@/hooks/useAssignments'
import { useWorkers } from '@/hooks/useWorkers'
// import { useToast } from '@/components/ui/toast'
import { Assignment, Worker, WeekDay } from '@/lib/types'
import { 
  Clock, 
  User, 
  Phone, 
  AlertTriangle, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Save,
  RotateCcw,
  Eye
} from 'lucide-react'

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
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-red-100 border-red-300 text-red-800',
  'bg-orange-100 border-orange-300 text-orange-800'
]

interface DragDropPlanningCalendarProps {
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
}

// Simple Assignment Display Component
const AssignmentDisplay = ({ assignment, onClick }: { 
  assignment: CalendarAssignment
  onClick: () => void 
}) => {
  return (
    <div
      className={`absolute inset-1 rounded text-xs p-1 cursor-pointer hover:shadow-lg transition-all ${
        assignment.color
      } border`}
      style={{ 
        height: `${assignment.duration * 40 - 4}px`,
        zIndex: 10
      }}
      onClick={onClick}
    >
      <div className="font-medium truncate flex items-center">
        {assignment.worker?.name}
      </div>
      <div className="truncate opacity-75">
        {assignment.user?.name}
      </div>
      <div className="text-xs opacity-60">
        {assignment.timeSlot}
      </div>
    </div>
  )
}

function DragDropPlanningCalendarInner({ 
  selectedDate = new Date(), 
  onDateChange,
  filterWorker,
  filterStatus 
}: DragDropPlanningCalendarProps) {
  const { assignments, isLoading } = useAssignments()
  const { workers } = useWorkers()
  
  const [currentWeek, setCurrentWeek] = useState(selectedDate)
  const [selectedAssignment, setSelectedAssignment] = useState<CalendarAssignment | null>(null)

  // Calculate duration helper function
  const calculateDuration = (start: string, end: string): number => {
    const startTime = new Date(`2000-01-01T${start}:00`)
    const endTime = new Date(`2000-01-01T${end}:00`)
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  }

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
  const calendarAssignments = useMemo(() => {
    const processed: CalendarAssignment[] = []
    
    assignments.forEach((assignment) => {
      if (assignment.status !== 'active' || !assignment.specific_schedule) return
      
      // Filter by worker if specified
      if (filterWorker && assignment.worker_id !== filterWorker) return
      
      // Filter by status if specified  
      if (filterStatus && assignment.status !== filterStatus) return
      
      const workerIndex = workers.findIndex(w => w.id === assignment.worker_id)
      const color = workerColors[workerIndex % workerColors.length]
      
      Object.entries(assignment.specific_schedule).forEach(([day, times]) => {
        if (times && times.length >= 2 && times[0] && times[1]) {
          const startTime = times[0]
          const endTime = times[1]
          const duration = calculateDuration(startTime, endTime)
          
          processed.push({
            ...assignment,
            color,
            dayOfWeek: day as WeekDay,
            timeSlot: `${startTime}-${endTime}`,
            duration,
            startTime,
            endTime
          })
        }
      })
    })
    
    return processed
  }, [assignments, workers, filterWorker, filterStatus])

  const getAssignmentsForDay = (day: WeekDay) => {
    return calendarAssignments
      .filter(assignment => assignment.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const getAssignmentsForTimeSlot = (day: WeekDay, timeSlot: string) => {
    const dayAssignments = getAssignmentsForDay(day)
    return dayAssignments.filter(assignment => {
      const assignmentTime = assignment.startTime.substring(0, 5)
      return assignmentTime === timeSlot
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate)
    onDateChange?.(newDate)
  }

  const getTimeSlots = () => {
    const slots = []
    for (let hour = 7; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  const timeSlots = getTimeSlots()

  const formatWeekRange = () => {
    const endDate = new Date(weekStart)
    endDate.setDate(weekStart.getDate() + 6)
    
    return `${weekStart.getDate()} ${weekStart.toLocaleDateString('es-ES', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando planning...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Planning Semanal
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium text-slate-900 min-w-[200px] text-center">
                  {formatWeekRange()}
                </span>
                <Button variant="secondary" size="sm" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Workers Legend */}
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-700 mr-2">Trabajadoras:</span>
            {workers.filter(w => w.is_active).map((worker, index) => (
              <div
                key={worker.id}
                className={`flex items-center px-2 py-1 rounded text-xs font-medium ${workerColors[index % workerColors.length]}`}
              >
                <div className="w-2 h-2 rounded-full bg-current mr-1"></div>
                {worker.name} {worker.surname}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-8 bg-slate-50">
              <div className="p-3 text-sm font-medium text-slate-600 border-r border-slate-200">
                Hora
              </div>
              {weekDays.map((day, index) => {
                const dayAssignments = getAssignmentsForDay(day.key)
                
                return (
                  <div
                    key={day.key}
                    className="p-3 text-center border-r border-slate-200 last:border-r-0"
                  >
                    <div className="text-sm font-medium text-slate-900">
                      {day.label}
                    </div>
                    <div className="text-xs text-slate-500">
                      {weekDates[index]?.getDate()}/{weekDates[index]?.getMonth() + 1}
                    </div>
                    <div className="flex items-center justify-center space-x-1 mt-1">
                      <span className="text-xs text-blue-600">{dayAssignments.length} asig.</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time Slots */}
            <div className="max-h-[600px] overflow-y-auto">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot} className="grid grid-cols-8 border-b border-slate-100 hover:bg-slate-25">
                  <div className="p-2 text-xs text-slate-500 border-r border-slate-200 bg-slate-50">
                    {timeSlot}
                  </div>
                  {weekDays.map((day) => {
                    const timeAssignments = getAssignmentsForTimeSlot(day.key, timeSlot)
                    
                    return (
                      <div
                        key={`${day.key}-${timeSlot}`}
                        className="min-h-[40px] p-1 border-r border-slate-200 last:border-r-0 relative"
                      >
                        {timeAssignments.map((assignment) => (
                          <AssignmentDisplay
                            key={assignment.id}
                            assignment={assignment}
                            onClick={() => setSelectedAssignment(assignment)}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Details Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
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
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Trabajadora:</span>
                <span>{selectedAssignment.worker?.name} {selectedAssignment.worker?.surname}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Usuario:</span>
                <span>{selectedAssignment.user?.name} {selectedAssignment.user?.surname}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Horario:</span>
                <span>{selectedAssignment.timeSlot} ({selectedAssignment.duration}h)</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Teléfono:</span>
                <span>{selectedAssignment.user?.phone}</span>
              </div>
              
              {selectedAssignment.notes && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Notas:</p>
                  <p className="text-sm text-blue-700">{selectedAssignment.notes}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function DragDropPlanningCalendar(props: DragDropPlanningCalendarProps) {
  return <DragDropPlanningCalendarInner {...props} />
} 