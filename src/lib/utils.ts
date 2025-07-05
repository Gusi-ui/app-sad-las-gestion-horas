import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export function calculateRemainingHours(
  totalHours: number,
  usedHours: number
): number {
  return Math.max(0, totalHours - usedHours)
}

// Función para ordenar los días de la semana correctamente (lunes a domingo)
export function getOrderedWeekDays(): string[] {
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
}

// Función para formatear horarios ordenados cronológicamente
export function formatScheduleOrdered(schedule: Record<string, any[]> | undefined, dayNames: Record<string, string>): string {
  if (!schedule) return 'No configurado'
  
  const dayOrder = getOrderedWeekDays()
  
  const formattedDays = dayOrder
    .filter(day => {
      const hasData = schedule[day] && Array.isArray(schedule[day]) && schedule[day].length > 0;
      return hasData;
    })
    .map(day => {
      const slots = schedule[day]
      
      // Caso 1: Array de strings (formato antiguo) - ['08:00', '10:00', '13:00', '15:00']
      if (Array.isArray(slots) && slots.length > 0 && typeof slots[0] === 'string') {
        if (slots.length === 2) {
          // Un solo tramo: ['08:00', '10:00']
          return `${dayNames[day]}: ${slots[0]} - ${slots[1]}`
        } else if (slots.length > 2 && slots.length % 2 === 0) {
          // Múltiples tramos: ['08:00', '10:00', '13:00', '15:00']
          const timeSlots = [];
          for (let i = 0; i < slots.length; i += 2) {
            if (typeof slots[i] === 'string' && typeof slots[i+1] === 'string') {
              timeSlots.push(`${slots[i]} - ${slots[i+1]}`);
            }
          }
          return `${dayNames[day]}: ${timeSlots.join(' y ')}`
        } else {
          // Formato desconocido, mostrar como está
          return `${dayNames[day]}: ${slots.join(', ')}`
        }
      } 
      // Caso 2: Array de objetos {start, end} (formato nuevo)
      else if (Array.isArray(slots) && slots.length > 0 && typeof slots[0] === 'object' && slots[0] !== null && 'start' in slots[0] && 'end' in slots[0]) {
        const timeSlots = slots.map((slot: any) => `${slot.start} - ${slot.end}`);
        return `${dayNames[day]}: ${timeSlots.join(' y ')}`
      } 
      // Caso 3: Otros formatos
      else {
        return `${dayNames[day]}: ${JSON.stringify(slots)}`
      }
    })
    .filter(Boolean)
  
  return formattedDays.join(' | ')
} 