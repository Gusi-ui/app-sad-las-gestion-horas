'use client'

import { Clock } from 'lucide-react'
import { formatScheduleOrdered } from '@/lib/utils'

interface ScheduleDisplayProps {
  schedule: Record<string, any[]> | undefined
  className?: string
  showIcon?: boolean
  layout?: 'inline' | 'rows' | 'cards'
}

export function ScheduleDisplay({ schedule, className = '', showIcon = true, layout = 'rows' }: ScheduleDisplayProps) {
  if (!schedule) {
    return (
      <div className={`text-sm text-slate-500 ${className}`}>
        {showIcon && <Clock className="w-4 h-4 inline mr-1" />}
        Sin horario configurado
      </div>
    )
  }

  const dayNames: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  }

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  const activeDays = dayOrder.filter(day => 
    schedule[day] && Array.isArray(schedule[day]) && schedule[day].length > 0
  )

  // Layout en filas (nuevo formato atractivo)
  if (layout === 'rows') {
    return (
      <div className={`${className}`}>
        <div className="space-y-2">
          {activeDays.map(day => {
            const slots = schedule[day]
            let timeDisplay = ''
            let timeLines: string[] = []

            // Formatear los horarios
            if (Array.isArray(slots) && slots.length > 0 && typeof slots[0] === 'string') {
              if (slots.length === 2) {
                timeDisplay = `${slots[0]} - ${slots[1]}`
                timeLines = [timeDisplay]
              } else if (slots.length > 2 && slots.length % 2 === 0) {
                const timeSlots = []
                for (let i = 0; i < slots.length; i += 2) {
                  if (typeof slots[i] === 'string' && typeof slots[i+1] === 'string') {
                    timeSlots.push(`${slots[i]} - ${slots[i+1]}`)
                  }
                }
                timeDisplay = timeSlots.join(' y ')
                timeLines = timeSlots
              }
            } else if (Array.isArray(slots) && slots.length > 0 && typeof slots[0] === 'object' && slots[0] !== null && 'start' in slots[0] && 'end' in slots[0]) {
              timeDisplay = slots.map((slot: any) => `${slot.start} - ${slot.end}`).join(' y ')
              timeLines = slots.map((slot: any) => `${slot.start} - ${slot.end}`)
            }

            return (
              <div key={day} className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg px-4 py-3 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3 shadow-sm">
                    <span className="text-white font-bold text-sm sm:text-sm">
                      {dayNames[day].substring(0, 2)}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900 text-sm sm:text-sm">
                    {dayNames[day]}
                  </span>
                </div>
                {/* Horario: en móvil, mostrar cada slot en una línea, en desktop igual que antes */}
                <div className="flex-shrink-0">
                  <div className="
                    bg-white border border-blue-200 rounded-full
                    px-3 py-1
                    text-blue-700 font-semibold
                    text-xs sm:text-sm
                    flex flex-col items-center justify-center
                    min-w-[80px] min-h-[40px]
                    sm:min-w-[120px] sm:min-h-[40px]
                    text-center
                  ">
                    <span className="block sm:hidden">
                      {timeLines.map((line, idx) => (
                        <span key={idx} className="block leading-tight">{line}</span>
                      ))}
                    </span>
                    <span className="hidden sm:block">
                      {timeDisplay}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Layout en tarjetas (formato existente)
  if (layout === 'cards') {
    return <ScheduleCards schedule={schedule} />
  }

  // Layout inline (formato original)
  const formattedSchedule = formatScheduleOrdered(schedule, {
    monday: 'Lun',
    tuesday: 'Mar',
    wednesday: 'Mié',
    thursday: 'Jue',
    friday: 'Vie',
    saturday: 'Sáb',
    sunday: 'Dom'
  })

  if (formattedSchedule === 'No configurado') {
    return (
      <div className={`text-sm text-slate-500 ${className}`}>
        {showIcon && <Clock className="w-4 h-4 inline mr-1" />}
        Sin horario configurado
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {showIcon && <Clock className="w-4 h-4 inline mr-1 text-primary-600" />}
      <span className="text-sm text-slate-700 font-medium">
        {formattedSchedule}
      </span>
    </div>
  )
}

// Componente para mostrar horarios en formato de tarjetas
export function ScheduleCards({ schedule }: { schedule: Record<string, any[]> | undefined }) {
  if (!schedule) {
    return (
      <div className="text-sm text-slate-500 italic">
        Sin horario configurado
      </div>
    )
  }

  const dayNames: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  }

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  const activeDays = dayOrder.filter(day => 
    schedule[day] && Array.isArray(schedule[day]) && schedule[day].length > 0
  )

  if (activeDays.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic">
        Sin horario configurado
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {activeDays.map(day => {
        const slots = schedule[day]
        let timeDisplay = ''

        // Formatear los horarios
        if (Array.isArray(slots) && slots.length > 0 && typeof slots[0] === 'string') {
          if (slots.length === 2) {
            timeDisplay = `${slots[0]} - ${slots[1]}`
          } else if (slots.length > 2 && slots.length % 2 === 0) {
            const timeSlots = []
            for (let i = 0; i < slots.length; i += 2) {
              if (typeof slots[i] === 'string' && typeof slots[i+1] === 'string') {
                timeSlots.push(`${slots[i]} - ${slots[i+1]}`)
              }
            }
            timeDisplay = timeSlots.join(' y ')
          }
        } else if (Array.isArray(slots) && slots.length > 0 && typeof slots[0] === 'object' && slots[0] !== null && 'start' in slots[0] && 'end' in slots[0]) {
          timeDisplay = slots.map((slot: any) => `${slot.start} - ${slot.end}`).join(' y ')
        }

        return (
          <div key={day} className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <div className="font-medium text-primary-900 text-sm mb-1">
              {dayNames[day]}
            </div>
            <div className="text-primary-700 text-sm">
              {timeDisplay}
            </div>
          </div>
        )
      })}
    </div>
  )
} 