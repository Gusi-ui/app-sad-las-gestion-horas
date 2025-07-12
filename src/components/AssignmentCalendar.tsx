'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CheckCircle, Clock } from 'lucide-react'
import { getHolidaysForYear } from '@/lib/holidayUtils'

interface TimeSlot {
  start: string
  end: string
}

interface DaySchedule {
  enabled: boolean
  timeSlots: TimeSlot[]
}

interface WeeklySchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
  holiday?: DaySchedule // Festivos entre semana (opcional para compatibilidad)
}

interface AssignmentCalendarProps {
  schedule: WeeklySchedule
  assignmentType: 'laborables' | 'festivos' | 'flexible'
  startDate: string
  year: number
  month: number
  className?: string
}

export default function AssignmentCalendar({
  schedule,
  assignmentType,
  startDate,
  year: initialYear,
  month: initialMonth,
  className = ''
}: AssignmentCalendarProps) {
  // Parse startDate
  const start = startDate ? new Date(startDate) : new Date()
  const minYear = start.getFullYear()
  const minMonth = start.getMonth() + 1

  // Estado local para mes/año seleccionados
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)
  const [holidays, setHolidays] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSelectedYear(initialYear)
    setSelectedMonth(initialMonth)
  }, [initialYear, initialMonth])

  useEffect(() => {
    loadHolidays()
  }, [selectedYear])

  const loadHolidays = async () => {
    try {
      const holidaysData = await getHolidaysForYear(selectedYear)
      const holidayDates = holidaysData.map(h => h.date)
      setHolidays(holidayDates)
    } catch (error) {
      console.error('Error al cargar festivos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth, 0).getDate()
  }

  const getFirstDayOfMonth = () => {
    // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const jsDay = new Date(selectedYear, selectedMonth - 1, 1).getDay()
    // Ajustar para que lunes sea 0, domingo sea 6
    return jsDay === 0 ? 6 : jsDay - 1
  }

  const getDayName = (dayOfWeek: number): keyof WeeklySchedule => {
    const dayMap: { [key: number]: keyof WeeklySchedule } = {
      0: 'sunday',    // Domingo
      1: 'monday',    // Lunes
      2: 'tuesday',   // Martes
      3: 'wednesday', // Miércoles
      4: 'thursday',  // Jueves
      5: 'friday',    // Viernes
      6: 'saturday'   // Sábado
    }
    return dayMap[dayOfWeek] || 'monday'
  }

  const isServiceDay = (day: number): boolean => {
    const date = new Date(selectedYear, selectedMonth - 1, day)
    const dayOfWeek = date.getDay()
    const dayName = getDayName(dayOfWeek)
    const enabled = schedule[dayName]?.enabled || false
    const holiday = isHoliday(day)
    const weekend = isWeekend(day)
    
    if (assignmentType === 'laborables') {
      return enabled && !holiday
    } else if (assignmentType === 'festivos') {
      // Para festivos, verificar si es fin de semana O si es festivo entre semana con horario específico
      if (weekend) {
        return enabled // Usar horario del fin de semana
      } else if (holiday) {
        // Si es festivo entre semana, verificar si hay horario específico para festivos
        return schedule.holiday?.enabled || false
      }
      return false
    } else {
      return enabled
    }
  }

  const isHoliday = (day: number): boolean => {
    const date = new Date(selectedYear, selectedMonth - 1, day)
    const dateString = date.toLocaleDateString('en-CA')
    return holidays.includes(dateString)
  }

  const isWeekend = (day: number): boolean => {
    const date = new Date(selectedYear, selectedMonth - 1, day)
    const dayOfWeek = date.getDay()
    return dayOfWeek === 0 || dayOfWeek === 6
  }

  const isDayDisabled = (day: number): boolean => {
    const date = new Date(selectedYear, selectedMonth - 1, day)
    const dayOfWeek = date.getDay()
    const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6
    const isHolidayDay = isHoliday(day)
    
    if (assignmentType === 'laborables') {
      return isWeekendDay || isHolidayDay
    } else if (assignmentType === 'festivos') {
      return !(isWeekendDay || isHolidayDay)
    }
    return false // flexible: todos los días habilitados
  }

  const getDayClassName = (day: number): string => {
    const baseClasses = 'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors'
    if (isServiceDay(day)) {
      return `${baseClasses} bg-green-500 text-white hover:bg-green-600 shadow-md`
    }
    if (isDayDisabled(day)) {
      return `${baseClasses} bg-red-100 text-red-600 cursor-not-allowed`
    }
    if (isHoliday(day)) {
      return `${baseClasses} bg-orange-100 text-orange-600 hover:bg-orange-200`
    }
    if (isWeekend(day)) {
      return `${baseClasses} bg-yellow-100 text-yellow-600 hover:bg-yellow-200`
    }
    return `${baseClasses} bg-gray-50 text-gray-700 hover:bg-gray-100`
  }

  const getDayTooltip = (day: number): string => {
    const date = new Date(selectedYear, selectedMonth - 1, day)
    const dateString = date.toLocaleDateString('es-ES')
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const dayName = dayNames[date.getDay()]
    
    let tooltip = `${dayName}, ${dateString}`
    
    if (isServiceDay(day)) {
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const isHolidayDay = isHoliday(day)
      
      let timeSlots: TimeSlot[] = []
      
      if (assignmentType === 'festivos' && isHolidayDay && !isWeekend) {
        // Festivo entre semana - usar horario de holiday
        timeSlots = schedule.holiday?.timeSlots || []
      } else {
        // Usar horario del día de la semana correspondiente
        const scheduleDay = getDayName(dayOfWeek)
        timeSlots = schedule[scheduleDay]?.timeSlots || []
      }
      
      const timeInfo = timeSlots.map(slot => `${slot.start}-${slot.end}`).join(', ')
      tooltip += ` - SERVICIO (${timeInfo})`
    }
    
    if (isHoliday(day)) {
      tooltip += ' - Festivo'
    }
    
    if (isWeekend(day)) {
      tooltip += ' - Fin de semana'
    }
    
    if (isDayDisabled(day)) {
      tooltip += ' - No disponible para este tipo'
    }
    
    return tooltip
  }

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth()
    const firstDay = getFirstDayOfMonth()
    const days = []
    
    // Días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />)
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <div
          key={day}
          className={getDayClassName(day)}
          title={getDayTooltip(day)}
        >
          {day}
        </div>
      )
    }
    
    return days
  }

  const getServiceDaysCount = (): number => {
    let count = 0
    Object.entries(schedule).forEach(([day, daySchedule]) => {
      if (day === 'holiday') {
        // Para holiday, solo contar si está habilitado y es tipo festivos
        if (assignmentType === 'festivos' && daySchedule.enabled) {
          count++
        }
      } else {
        if (daySchedule.enabled) count++
      }
    })
    return count
  }

  const getTotalServiceHours = (): number => {
    let totalHours = 0
    Object.entries(schedule).forEach(([day, daySchedule]) => {
      if (daySchedule.enabled) {
        // Para holiday, solo contar si es tipo festivos
        if (day === 'holiday' && assignmentType !== 'festivos') {
          return
        }
        
        daySchedule.timeSlots.forEach((slot: TimeSlot) => {
          try {
            const start = new Date(`2000-01-01T${slot.start}`)
            const end = new Date(`2000-01-01T${slot.end}`)
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            if (!isNaN(hours) && hours > 0) {
              totalHours += hours
            }
          } catch (error) {
            console.error('Error al calcular horas:', error)
          }
        })
      }
    })
    return Math.round(totalHours * 100) / 100
  }

  // Navigation logic
  const canGoPrev = () => {
    return (
      selectedYear > minYear || (selectedYear === minYear && selectedMonth > minMonth)
    )
  }
  const goPrev = () => {
    if (!canGoPrev()) return
    if (selectedMonth === 1) {
      setSelectedYear(y => y - 1)
      setSelectedMonth(12)
    } else {
      setSelectedMonth(m => m - 1)
    }
  }
  const goNext = () => {
    if (selectedMonth === 12) {
      setSelectedYear(y => y + 1)
      setSelectedMonth(1)
    } else {
      setSelectedMonth(m => m + 1)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Calendario de Servicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Month name
  const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' })

  const serviceDaysCount = getServiceDaysCount()
  const totalHours = getTotalServiceHours()

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Calendario de Servicios
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <button type="button" onClick={goPrev} disabled={!canGoPrev()} className={`px-2 py-1 rounded border ${canGoPrev() ? 'hover:bg-slate-100' : 'opacity-50 cursor-not-allowed'}`}>←</button>
          <span className="text-base font-semibold text-gray-700 min-w-[120px] text-center capitalize">{monthName}</span>
          <button type="button" onClick={goNext} className="px-2 py-1 rounded border hover:bg-slate-100">→</button>
        </div>
        <p className="text-sm text-gray-600">
          Visualización de días con servicio para {assignmentType === 'laborables' ? 'días laborables' : assignmentType === 'festivos' ? 'días festivos' : 'asignación flexible'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
              <span className="font-semibold text-green-700">{serviceDaysCount}</span>
            </div>
            <div className="text-green-600">Días con servicio</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-blue-600 mr-1" />
              <span className="font-semibold text-blue-700">{totalHours}h</span>
            </div>
            <div className="text-blue-600">Horas semanales</div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Días con servicio</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
            <span>Días disponibles</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 rounded"></div>
            <span>Fines de semana</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-100 rounded"></div>
            <span>Festivos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 rounded"></div>
            <span>No disponible</span>
          </div>
        </div>

        {/* Calendario */}
        <div className="border rounded-lg p-4">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarGrid()}
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm">
            <p className="font-medium text-blue-800 mb-1">
              Información del servicio
            </p>
            <p className="text-blue-700">
              Los días marcados en <span className="font-semibold text-green-600">verde</span> indican que hay servicio programado.
              Los días en <span className="font-semibold text-red-600">rojo</span> no están disponibles para este tipo de asignación.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 