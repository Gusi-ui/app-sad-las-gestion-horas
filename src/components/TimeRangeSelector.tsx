'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TimeSlot {
  id: string
  start: string
  end: string
}

interface TimeRangeSelectorProps {
  value: TimeSlot[]
  onChange: (timeSlots: TimeSlot[]) => void
  className?: string
}

// Generar opciones de hora desde 06:00 hasta 22:00
const generateTimeOptions = () => {
  const options = []
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      options.push(time)
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

export function TimeRangeSelector({ value, onChange, className = '' }: TimeRangeSelectorProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(value)

  useEffect(() => {
    setTimeSlots(value)
  }, [value])

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      start: '08:00',
      end: '10:00'
    }
    const updatedSlots = [...timeSlots, newSlot]
    setTimeSlots(updatedSlots)
    onChange(updatedSlots)
  }

  const removeTimeSlot = (id: string) => {
    const updatedSlots = timeSlots.filter(slot => slot.id !== id)
    setTimeSlots(updatedSlots)
    onChange(updatedSlots)
  }

  const updateTimeSlot = (id: string, field: 'start' | 'end', time: string) => {
    const updatedSlots = timeSlots.map(slot => {
      if (slot.id === id) {
        return { ...slot, [field]: time }
      }
      return slot
    })
    setTimeSlots(updatedSlots)
    onChange(updatedSlots)
  }

  const calculateTotalHours = (slots: TimeSlot[]) => {
    return slots.reduce((total, slot) => {
      const [startHour, startMinute] = slot.start.split(':').map(Number)
      const [endHour, endMinute] = slot.end.split(':').map(Number)
      const startTime = startHour + startMinute / 60
      const endTime = endHour + endMinute / 60
      const duration = endTime - startTime
      return total + Math.max(0, duration)
    }, 0)
  }

  const totalHours = calculateTotalHours(timeSlots)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Resumen de horas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-secondary">Horarios del día</span>
        </div>
        <div className="text-sm text-slate-600">
          Total: <span className="font-semibold">{totalHours.toFixed(2)}h</span>
        </div>
      </div>

      {/* Lista de horarios */}
      <div className="space-y-2">
        {timeSlots.map((slot, index) => (
          <div key={slot.id} className="flex items-center space-x-2 p-3 bg-secondary rounded-lg border border-secondary">
            <div className="flex items-center space-x-2 flex-1">
              <span className="text-sm text-slate-600 w-8">{index + 1}.</span>
              
              <select
                value={slot.start}
                onChange={(e) => updateTimeSlot(slot.id, 'start', e.target.value)}
                className="px-2 py-1 text-sm border border-secondary rounded focus:border-primary focus:outline-none"
              >
                {TIME_OPTIONS.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              
              <span className="text-slate-500">-</span>
              
              <select
                value={slot.end}
                onChange={(e) => updateTimeSlot(slot.id, 'end', e.target.value)}
                className="px-2 py-1 text-sm border border-secondary rounded focus:border-primary focus:outline-none"
              >
                {TIME_OPTIONS.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => removeTimeSlot(slot.id)}
              className="p-1 h-8 w-8"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Botón para añadir horario */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={addTimeSlot}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Añadir horario
      </Button>

      {/* Validación */}
      {timeSlots.some(slot => {
        const [startHour, startMinute] = slot.start.split(':').map(Number)
        const [endHour, endMinute] = slot.end.split(':').map(Number)
        const startTime = startHour + startMinute / 60
        const endTime = endHour + endMinute / 60
        return endTime <= startTime
      }) && (
        <div className="text-danger text-xs">
          ⚠️ La hora de fin debe ser posterior a la hora de inicio
        </div>
      )}
    </div>
  )
} 