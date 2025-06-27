'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronLeft, ChevronRight, Clock, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'
import { ServiceCard, ServiceDay } from '@/lib/types'
import { calculateMonthlyHours, getHolidaysForMonth, formatDateToISO, isWeekend, getMonthName } from '@/lib/calendar'

interface MonthlyCalendarProps {
  serviceCard: ServiceCard & { service_days: ServiceDay[] }
  className?: string
}

export function MonthlyCalendar({ serviceCard, className = '' }: MonthlyCalendarProps) {
  const [viewingMonth, setViewingMonth] = useState({
    month: serviceCard.month,
    year: serviceCard.year
  })

  const monthData = useMemo(() => {
    // Convertir service_days a formato que entiende la función
    const weeklySchedule: { [key: number]: number } = {}
    serviceCard.service_days.forEach(day => {
      weeklySchedule[day.day_of_week] = day.hours
    })

    const calculation = calculateMonthlyHours(
      viewingMonth.year,
      viewingMonth.month,
      weeklySchedule,
      serviceCard.worker_type === 'holidays',
      serviceCard.worker_type === 'weekends'
    )

    const holidays = getHolidaysForMonth(viewingMonth.year, viewingMonth.month)
    const daysInMonth = new Date(viewingMonth.year, viewingMonth.month, 0).getDate()
    const firstDay = new Date(viewingMonth.year, viewingMonth.month - 1, 1).getDay()
    
    const days = []
    
    // Días vacíos al principio - Ajustar para que la semana empiece en lunes
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1 // Convertir domingo (0) a 6, y el resto restar 1
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null)
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      // Crear fecha en UTC para evitar problemas de zona horaria
      const date = new Date(viewingMonth.year, viewingMonth.month - 1, day, 12, 0, 0)
      const dayOfWeek = date.getDay()
      const dateStr = formatDateToISO(date)
      const holiday = holidays.find(h => h.date === dateStr)
      const isHolidayDay = Boolean(holiday)
      const isWeekendDay = isWeekend(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const isPastDay = date < today && viewingMonth.month === today.getMonth() + 1 && viewingMonth.year === today.getFullYear()
      
      // Verificar si hay servicio ese día
      let serviceHours = 0
      let shouldWork = false
      const serviceDayConfig = serviceCard.service_days.find(sd => sd.day_of_week === dayOfWeek)
      
      if (serviceDayConfig) {
        serviceHours = serviceDayConfig.hours
        shouldWork = true
        
        // Verificar si se trabaja según configuración
        if (isWeekendDay && serviceCard.worker_type !== 'weekends') {
          shouldWork = false
          serviceHours = 0
        }
        if (isHolidayDay && serviceCard.worker_type !== 'holidays') {
          shouldWork = false
          serviceHours = 0
        }
      }
      
      days.push({
        day,
        date,
        dayOfWeek,
        holiday,
        isHoliday: isHolidayDay,
        isWeekend: isWeekendDay,
        serviceHours,
        shouldWork,
        isPastDay
      })
    }
    
    return {
      calculation,
      holidays,
      days,
      daysInMonth
    }
  }, [serviceCard, viewingMonth])

  const progressPercentage = (serviceCard.used_hours / serviceCard.total_hours) * 100
  const remainingHours = serviceCard.total_hours - serviceCard.used_hours
  
  const canGoToPreviousMonth = viewingMonth.month > 1 || viewingMonth.year > 2024
  const canGoToNextMonth = viewingMonth.month < 12 || viewingMonth.year < 2026

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && canGoToPreviousMonth) {
      if (viewingMonth.month === 1) {
        setViewingMonth({ month: 12, year: viewingMonth.year - 1 })
      } else {
        setViewingMonth({ month: viewingMonth.month - 1, year: viewingMonth.year })
      }
    } else if (direction === 'next' && canGoToNextMonth) {
      if (viewingMonth.month === 12) {
        setViewingMonth({ month: 1, year: viewingMonth.year + 1 })
      } else {
        setViewingMonth({ month: viewingMonth.month + 1, year: viewingMonth.year })
      }
    }
  }

  const getProgressColor = () => {
    if (progressPercentage >= 90) return 'bg-emerald-500'
    if (progressPercentage >= 70) return 'bg-sky-500'
    if (progressPercentage >= 50) return 'bg-amber-500'
    return 'bg-slate-400'
  }

  const getStatusIcon = () => {
    const difference = serviceCard.total_hours - monthData.calculation.scheduledHours
    if (difference > 5) return <TrendingDown className="w-4 h-4 text-amber-600" />
    if (difference < -5) return <TrendingUp className="w-4 h-4 text-red-600" />
    return <CheckCircle className="w-4 h-4 text-emerald-600" />
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Calendario - {getMonthName(viewingMonth.month)} {viewingMonth.year}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigateMonth('prev')}
                disabled={!canGoToPreviousMonth}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigateMonth('next')}
                disabled={!canGoToNextMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Predicción de Horas - DESTACADO */}
          {(() => {
            const scheduledHours = monthData.calculation.scheduledHours
            const assignedHours = serviceCard.total_hours
            const difference = scheduledHours - assignedHours
            const isExcess = difference > 0
            const isDifferenceSignificant = Math.abs(difference) >= 1
            
            if (!isDifferenceSignificant) {
              return (
                <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mr-3" />
                    <div>
                      <h4 className="text-emerald-800 font-semibold text-lg">
                        ✅ Horas Perfectas para {getMonthName(viewingMonth.month)}
                      </h4>
                      <p className="text-emerald-700 text-sm">
                        Programadas: {scheduledHours}h • Asignadas: {assignedHours}h • Diferencia: {Math.abs(difference).toFixed(1)}h
                      </p>
                    </div>
                  </div>
                </div>
              )
            }
            
            return (
              <div className={`${isExcess ? 'bg-amber-50 border-amber-400' : 'bg-red-50 border-red-400'} border-l-4 p-4 rounded-r-lg`}>
                <div className="flex items-center">
                  {isExcess ? (
                    <TrendingUp className="w-6 h-6 text-amber-600 mr-3" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600 mr-3" />
                  )}
                  <div>
                    <h4 className={`${isExcess ? 'text-amber-800' : 'text-red-800'} font-semibold text-lg`}>
                      {isExcess ? '⚠️' : '❌'} {isExcess ? 'Te SOBRAN' : 'Te FALTAN'} {Math.abs(difference).toFixed(1)} horas en {getMonthName(viewingMonth.month)}
                    </h4>
                    <p className={`${isExcess ? 'text-amber-700' : 'text-red-700'} text-sm`}>
                      Programadas: {scheduledHours}h • Asignadas: {assignedHours}h
                      {isExcess 
                        ? ` • Tienes ${Math.abs(difference).toFixed(1)}h de más programadas`
                        : ` • Necesitas programar ${Math.abs(difference).toFixed(1)}h más`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Barra de Progreso */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Progreso del mes</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="font-semibold">
                  {serviceCard.used_hours}h / {serviceCard.total_hours}h
                </span>
              </div>
            </div>
            
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-slate-600">
              <span>Usadas: {serviceCard.used_hours}h</span>
              <span className={remainingHours >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {remainingHours >= 0 ? `Quedan: ${remainingHours}h` : `Exceso: ${Math.abs(remainingHours)}h`}
              </span>
            </div>
          </div>

          {/* Resumen del mes actual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-sky-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-sky-900">{monthData.calculation.scheduledHours}h</div>
              <div className="text-xs text-sky-600">Programadas</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-slate-900">{monthData.calculation.workDays}</div>
              <div className="text-xs text-slate-600">Días laborables</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-purple-900">{monthData.calculation.weekends}</div>
              <div className="text-xs text-purple-600">Fines de semana</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-orange-900">{monthData.calculation.holidays}</div>
              <div className="text-xs text-orange-600">Festivos</div>
            </div>
          </div>

          {/* Calendario del mes */}
          <div className="bg-white border rounded-lg overflow-hidden">
            {/* Encabezados de días */}
            <div className="grid grid-cols-7 bg-slate-50 border-b">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-slate-700">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Días del mes */}
            <div className="grid grid-cols-7">
              {monthData.days.map((dayData, index) => (
                <div 
                  key={index} 
                  className={`min-h-[50px] p-1 border-r border-b text-xs ${
                    !dayData ? 'bg-slate-25' : ''
                  }`}
                >
                  {dayData && (
                    <div className="h-full">
                      <div className={`font-medium mb-1 ${
                        dayData.isWeekend ? 'text-slate-400' : 
                        dayData.isPastDay ? 'text-slate-600' : 'text-slate-900'
                      }`}>
                        {dayData.day}
                      </div>
                      
                      {/* Indicador de festivo */}
                      {dayData.isHoliday && (
                        <div className="text-[10px] bg-orange-100 text-orange-800 px-1 py-0.5 rounded mb-1">
                          Festivo
                        </div>
                      )}
                      
                      {/* Horas de servicio */}
                      {dayData.shouldWork && dayData.serviceHours > 0 && (
                        <div className={`text-[10px] px-1 py-0.5 rounded font-medium ${
                          dayData.isPastDay 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-sky-100 text-sky-800'
                        }`}>
                          {dayData.serviceHours}h
                        </div>
                      )}
                      
                      {/* Día sin servicio pero programado */}
                      {!dayData.shouldWork && dayData.serviceHours > 0 && (
                        <div className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded">
                          No servicio
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Horario semanal actual */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Horario de esta semana
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {serviceCard.service_days
                .sort((a, b) => a.day_of_week - b.day_of_week)
                .map((day) => (
                  <div key={day.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="font-medium">{getDayName(day.day_of_week)}</span>
                    <span className="text-sky-600 font-semibold">{day.hours}h</span>
                  </div>
                ))}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Total semanal: {serviceCard.service_days.reduce((sum, day) => sum + day.hours, 0)}h/semana
            </div>
          </div>

          {/* Festivos del mes (si los hay) */}
          {monthData.holidays.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">
                Festivos en {getMonthName(viewingMonth.month)}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {monthData.holidays.map((holiday, index) => {
                  const date = new Date(holiday.date)
                  return (
                    <div key={index} className="flex justify-between items-center p-2 bg-orange-50 rounded text-xs">
                      <span className="font-medium">{holiday.name}</span>
                      <span className="text-orange-600">
                        {date.getDate()}/{date.getMonth() + 1}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Leyenda compacta */}
          <div className="flex flex-wrap gap-3 text-xs pt-2 border-t">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-sky-100 border border-sky-200 rounded"></div>
              <span>Programado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded"></div>
              <span>Realizado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
              <span>Festivo</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 