'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { 
  getAvailableDaysForWorker, 
  getBlockedDaysForWorker, 
  getDayInfo, 
  getHolidaysForYear,
  getShortDayName,
  type DayInfo,
  type Holiday
} from '@/lib/holidayUtils'

interface HolidayAwareCalendarProps {
  workerType: 'laborables' | 'festivos' | 'flexible'
  year: number
  month: number
  onDayClick?: (dayInfo: DayInfo) => void
  selectedDays?: string[]
  className?: string
}

export default function HolidayAwareCalendar({
  workerType,
  year,
  month,
  onDayClick,
  selectedDays = [],
  className = ''
}: HolidayAwareCalendarProps) {
  const [availableDays, setAvailableDays] = useState<DayInfo[]>([])
  const [blockedDays, setBlockedDays] = useState<DayInfo[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalendarData()
  }, [workerType, year, month])

  const loadCalendarData = async () => {
    setLoading(true)
    try {
      const [available, blocked, holidaysData] = await Promise.all([
        getAvailableDaysForWorker(workerType, year, month),
        getBlockedDaysForWorker(workerType, year, month),
        getHolidaysForYear(year)
      ])
      
      setAvailableDays(available)
      setBlockedDays(blocked)
      setHolidays(holidaysData)
    } catch (error) {
      console.error('Error al cargar datos del calendario:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = () => {
    // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const jsDay = new Date(year, month - 1, 1).getDay()
    // Ajustar para que lunes sea 0, domingo sea 6
    return jsDay === 0 ? 6 : jsDay - 1
  }

  const getDayInfo = (day: number): DayInfo | null => {
    const date = new Date(year, month - 1, day)
    const dateString = date.toISOString().split('T')[0]
    
    const availableDay = availableDays.find(d => d.date === dateString)
    const blockedDay = blockedDays.find(d => d.date === dateString)
    
    return availableDay || blockedDay || null
  }

  const isDaySelected = (day: number): boolean => {
    const date = new Date(year, month - 1, day)
    const dateString = date.toISOString().split('T')[0]
    return selectedDays.includes(dateString)
  }

  const isDayBlocked = (day: number): boolean => {
    const dayInfo = getDayInfo(day)
    if (!dayInfo) return false
    
    // Para trabajadoras laborables: bloquear fines de semana y festivos
    if (workerType === 'laborables') {
      return dayInfo.isWeekend || dayInfo.isHoliday
    }
    
    // Para trabajadoras festivas: bloquear días laborables (no fines de semana, no festivos)
    if (workerType === 'festivos') {
      return dayInfo.isWorkingDay
    }
    
    // Para trabajadoras flexibles: no bloquear ningún día
    return false
  }

  const isDayHoliday = (day: number): boolean => {
    const dayInfo = getDayInfo(day)
    return dayInfo ? dayInfo.isHoliday : false
  }

  const isDayWeekend = (day: number): boolean => {
    const dayInfo = getDayInfo(day)
    return dayInfo ? dayInfo.isWeekend : false
  }

  const getDayClassName = (day: number): string => {
    const baseClasses = 'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer transition-colors'
    
    if (isDaySelected(day)) {
      return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`
    }
    
    if (isDayBlocked(day)) {
      return `${baseClasses} bg-red-100 text-red-600 cursor-not-allowed hover:bg-red-200`
    }
    
    if (isDayHoliday(day)) {
      return `${baseClasses} bg-orange-100 text-orange-600 hover:bg-orange-200`
    }
    
    if (isDayWeekend(day)) {
      return `${baseClasses} bg-yellow-100 text-yellow-600 hover:bg-yellow-200`
    }
    
    return `${baseClasses} bg-gray-50 text-gray-700 hover:bg-gray-100`
  }

  const getDayTooltip = (day: number): string => {
    const dayInfo = getDayInfo(day)
    if (!dayInfo) return ''
    
    const dayName = getShortDayName(dayInfo.dayOfWeek)
    const date = new Date(year, month - 1, day)
    const dateString = date.toLocaleDateString('es-ES')
    
    let tooltip = `${dayName}, ${dateString}`
    
    if (dayInfo.isHoliday && dayInfo.holidayInfo) {
      tooltip += ` - ${dayInfo.holidayInfo.name}`
    }
    
    if (dayInfo.isWeekend) {
      tooltip += ' - Fin de semana'
    }
    
    if (isDayBlocked(day)) {
      tooltip += ' - No disponible para este tipo de trabajadora'
    }
    
    return tooltip
  }

  const handleDayClick = (day: number) => {
    const dayInfo = getDayInfo(day)
    if (dayInfo && !isDayBlocked(day) && onDayClick) {
      onDayClick(dayInfo)
    }
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
          onClick={() => handleDayClick(day)}
        >
          {day}
        </div>
      )
    }
    
    return days
  }

  const getWorkerTypeLabel = () => {
    switch (workerType) {
      case 'laborables':
        return 'Días Laborables (L-V, excluyendo festivos)'
      case 'festivos':
        return 'Días Festivos (S-D + festivos)'
      case 'flexible':
        return 'Asignación Flexible (todos los días)'
      default:
        return ''
    }
  }

  const getStats = () => {
    const totalDays = getDaysInMonth()
    const availableCount = availableDays.length
    const blockedCount = blockedDays.length
    const holidayCount = holidays.filter(h => 
      new Date(h.date).getMonth() === month - 1 && 
      new Date(h.date).getFullYear() === year
    ).length

    return { totalDays, availableCount, blockedCount, holidayCount }
  }

  const stats = getStats()

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Calendario de Disponibilidad
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Calendario de Disponibilidad
        </CardTitle>
        <p className="text-sm text-gray-600">{getWorkerTypeLabel()}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="font-semibold text-green-700">{stats.availableCount}</div>
            <div className="text-green-600">Disponibles</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="font-semibold text-red-700">{stats.blockedCount}</div>
            <div className="text-red-600">Bloqueados</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded">
            <div className="font-semibold text-orange-700">{stats.holidayCount}</div>
            <div className="text-orange-600">Festivos</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold text-gray-700">{stats.totalDays}</div>
            <div className="text-gray-600">Total</div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
            <span>Días normales</span>
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
            <span>No disponible para {workerType === 'laborables' ? 'laborables' : workerType === 'festivos' ? 'festivos' : 'este tipo'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Seleccionados</span>
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
        {blockedDays.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">
                  Días no disponibles para trabajadoras de tipo "{workerType}"
                </p>
                <p className="text-yellow-700 mt-1">
                  Estos días serán atendidos por trabajadoras de tipo "{workerType === 'laborables' ? 'festivos' : 'laborables'}"
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 