'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { TimeSelector } from '@/components/TimeSelector'

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes', short: 'L' },
  { value: 2, label: 'Martes', short: 'M' },
  { value: 3, label: 'Miércoles', short: 'X' },
  { value: 4, label: 'Jueves', short: 'J' },
  { value: 5, label: 'Viernes', short: 'V' },
  { value: 6, label: 'Sábado', short: 'S' },
  { value: 0, label: 'Domingo', short: 'D' }
]

interface WeeklySchedule {
  [dayOfWeek: number]: {
    enabled: boolean
    hours: number
  }
}

interface WeeklyScheduleFormProps {
  value: { day_of_week: number; hours: number }[]
  onChange: (schedule: { day_of_week: number; hours: number }[]) => void
  totalHours: number
  onTotalHoursChange: (totalHours: number) => void
}

export function WeeklyScheduleForm({ 
  value, 
  onChange, 
  totalHours, 
  onTotalHoursChange 
}: WeeklyScheduleFormProps) {
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
    const initial: WeeklySchedule = {}
    
    // Inicializar todos los días como deshabilitados
    DAYS_OF_WEEK.forEach(day => {
      initial[day.value] = { enabled: false, hours: 2 }
    })
    
    // Habilitar días que ya están en el valor
    value.forEach(item => {
      initial[item.day_of_week] = {
        enabled: true,
        hours: item.hours
      }
    })
    
    return initial
  })

  // Calcular total de horas automáticamente
  const calculateTotalHours = () => {
    const weeklyTotal = Object.entries(schedule)
      .filter(([_, config]) => config.enabled)
      .reduce((sum, [_, config]) => sum + config.hours, 0)
    
    // Aproximadamente 4.3 semanas por mes
    return Math.round(weeklyTotal * 4.3)
  }

  // Actualizar cuando cambia el schedule
  useEffect(() => {
    const newSchedule = Object.entries(schedule)
      .filter(([_, config]) => config.enabled)
      .map(([dayOfWeek, config]) => ({
        day_of_week: Number(dayOfWeek),
        hours: config.hours
      }))
    
    onChange(newSchedule)
    
    // Auto-calcular horas totales
    const autoTotal = calculateTotalHours()
    if (autoTotal !== totalHours) {
      onTotalHoursChange(autoTotal)
    }
  }, [schedule])

  const toggleDay = (dayOfWeek: number) => {
    
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

  const updateHours = (dayOfWeek: number, hours: number) => {
    setSchedule(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        hours: Math.max(0.5, Math.min(24, hours))
      }
    }))
  }

  const weeklyTotal = Object.entries(schedule)
    .filter(([_, config]) => config.enabled)
    .reduce((sum, [_, config]) => sum + config.hours, 0)

  const enabledDays = Object.entries(schedule).filter(([_, config]) => config.enabled).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-primary-600" />
          <span>Horario Semanal</span>
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
              <div className="text-2xl font-bold text-primary-900">{weeklyTotal}h</div>
              <div className="text-sm text-primary-600">Total semanal</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-900">{calculateTotalHours()}h</div>
              <div className="text-sm text-primary-600">Total mensual</div>
            </div>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">
            Selecciona los días de trabajo
          </label>
          
          <div className="grid grid-cols-1 gap-3 w-full">
            {DAYS_OF_WEEK.map((day) => {
              const config = schedule[day.value]
              const isEnabled = config.enabled
              
              return (
                <div 
                  key={day.value}
                  className={`border rounded-lg transition-all w-full ${
                    isEnabled 
                      ? 'border-primary-300 bg-primary-50' 
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                      {/* Toggle del día - CORREGIDO */}
                      <label className="flex items-center space-x-3 cursor-pointer min-w-0">
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
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">{day.label}</div>
                          <div className="text-sm text-slate-600">
                            {isEnabled ? 'Activo' : 'Inactivo'}
                          </div>
                        </div>
                      </label>

                      {/* Campo de horas (solo si está habilitado) */}
                      {isEnabled && (
                        <div className="flex items-center space-x-2 flex-wrap min-w-0">
                          <TimeSelector
                            value={config.hours}
                            onChange={(hours) => updateHours(day.value, hours)}
                          />
                          <span className="text-sm text-slate-600 font-medium whitespace-nowrap">por día</span>
                        </div>
                      )}
                    </div>
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
              ({weeklyTotal}h/semana × 4.3 semanas)
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
                  Activa los días de la semana en los que realizarás el servicio
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
