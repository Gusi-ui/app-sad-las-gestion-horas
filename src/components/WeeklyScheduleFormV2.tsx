'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { TimeRangeSelector } from './TimeRangeSelector'

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lunes', short: 'L' },
  { value: 'tuesday', label: 'Martes', short: 'M' },
  { value: 'wednesday', label: 'Miércoles', short: 'X' },
  { value: 'thursday', label: 'Jueves', short: 'J' },
  { value: 'friday', label: 'Viernes', short: 'V' },
  { value: 'saturday', label: 'Sábado', short: 'S' },
  { value: 'sunday', label: 'Domingo', short: 'D' }
]

interface TimeSlot {
  id: string
  start: string
  end: string
}

interface WeeklySchedule {
  [dayOfWeek: string]: {
    enabled: boolean
    timeSlots: TimeSlot[]
  }
}

interface WeeklyScheduleFormV2Props {
  value: Record<string, TimeSlot[]>
  onChange: (schedule: Record<string, TimeSlot[]>) => void
  totalHours: number
  onTotalHoursChange: (totalHours: number) => void
}

// Función para construir el estado inicial del schedule
function buildInitialSchedule(value: Record<string, TimeSlot[]>): WeeklySchedule {
  const initial: WeeklySchedule = {};
  DAYS_OF_WEEK.forEach(day => {
    initial[day.value] = {
      enabled: value[day.value] && value[day.value].length > 0,
      timeSlots: value[day.value] || []
    };
  });
  return initial;
}

export function WeeklyScheduleFormV2({ 
  value, 
  onChange, 
  totalHours, 
  onTotalHoursChange 
}: WeeklyScheduleFormV2Props) {
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => buildInitialSchedule(value))

  // Calcular total de horas automáticamente
  const calculateTotalHours = useCallback(() => {
    const weeklyTotal = Object.entries(schedule)
      .filter(([, config]) => config.enabled)
      .reduce((sum, [, config]) => {
        const dayHours = config.timeSlots.reduce((daySum, slot) => {
          const [startHour, startMinute] = slot.start.split(':').map(Number)
          const [endHour, endMinute] = slot.end.split(':').map(Number)
          const startTime = startHour + startMinute / 60
          const endTime = endHour + endMinute / 60
          const duration = endTime - startTime
          return daySum + Math.max(0, duration)
        }, 0)
        return sum + dayHours
      }, 0)
    
    // Aproximadamente 4.3 semanas por mes
    return Math.round(weeklyTotal * 4.3)
  }, [schedule])

  // Actualizar cuando cambia el value (datos iniciales)
  useEffect(() => {
    setSchedule(
      buildInitialSchedule(value)
    )
  }, [value])

  // Actualizar cuando cambia el schedule
  useEffect(() => {
    const newSchedule: Record<string, TimeSlot[]> = {};
    Object.entries(schedule).forEach(([dayOfWeek, config]) => {
      if (config.enabled && config.timeSlots.length > 0) {
        newSchedule[dayOfWeek] = config.timeSlots;
      }
    });
    onChange(newSchedule);
    // Auto-calcular horas totales
    const autoTotal = calculateTotalHours()
    if (autoTotal !== totalHours) {
      onTotalHoursChange(autoTotal)
    }
  }, [schedule, onChange, onTotalHoursChange, calculateTotalHours, totalHours])

  const toggleDay = (dayOfWeek: string) => {
    setSchedule(prev => {
      const newState = {
        ...prev,
        [dayOfWeek]: {
          ...prev[dayOfWeek],
          enabled: !prev[dayOfWeek].enabled
        }
      }
      
      return newState
    })
  }

  const updateTimeSlots = (dayOfWeek: string, timeSlots: TimeSlot[]) => {
    setSchedule(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        timeSlots: timeSlots
      }
    }))
  }

  const weeklyTotal = Object.entries(schedule)
    .filter(([, config]) => config.enabled)
    .reduce((sum, [, config]) => {
      const dayHours = config.timeSlots.reduce((daySum, slot) => {
        const [startHour, startMinute] = slot.start.split(':').map(Number)
        const [endHour, endMinute] = slot.end.split(':').map(Number)
        const startTime = startHour + startMinute / 60
        const endTime = endHour + endMinute / 60
        const duration = endTime - startTime
        return daySum + Math.max(0, duration)
      }, 0)
      return sum + dayHours
    }, 0)

  const enabledDays = Object.entries(schedule).filter(([, config]) => config.enabled).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-primary-600" />
          <span>Horario Semanal Detallado</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen */}
        <div className="bg-primary-50 p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-900">{enabledDays}</div>
              <div className="text-sm text-primary-600">Días/semana</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-900">{weeklyTotal.toFixed(2)}h</div>
              <div className="text-sm text-primary-600">Total semanal</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-900">{calculateTotalHours()}h</div>
              <div className="text-sm text-primary-600">Total mensual</div>
            </div>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-slate-700">
            Configura los horarios por día
          </label>
          
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => {
              const config = schedule[day.value]
              const isEnabled = config.enabled
              
              return (
                <div 
                  key={day.value}
                  className={`border rounded-lg transition-all ${
                    isEnabled 
                      ? 'border-primary-300 bg-primary-50' 
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="p-4">
                    {/* Header del día */}
                    <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => toggleDay(day.value)}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            isEnabled ? 'bg-primary-600' : 'bg-slate-300'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform transform ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                            } mt-0.5`}></div>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{day.label}</div>
                          <div className="text-sm text-slate-600">
                            {isEnabled ? 'Activo' : 'Inactivo'}
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Selector de horarios (solo si está habilitado) */}
                    {isEnabled && (
                      <TimeRangeSelector
                        value={config.timeSlots}
                        onChange={(timeSlots) => updateTimeSlots(day.value, timeSlots)}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Campo de horas totales manuales (opcional) */}
        <div className="border-t pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Horas totales del mes (se calcula automáticamente)
            </label>
            <input
              type="number"
              min="0"
              value={totalHours}
              onChange={(e) => onTotalHoursChange(Number(e.target.value))}
              placeholder="Ej: 60"
              className="text-center font-semibold"
            />
            <p className="text-xs text-slate-500">
              Calculado automáticamente: {calculateTotalHours()}h 
              ({weeklyTotal.toFixed(2)}h/semana × 4.3 semanas)
            </p>
          </div>
        </div>

        {/* Ayuda rápida */}
        {enabledDays === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Selecciona al menos un día
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Activa los días de la semana y configura los horarios específicos de inicio y fin
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 