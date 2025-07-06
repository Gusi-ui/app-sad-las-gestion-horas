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

// Funciones para cálculo de horas
export interface HoursCalculation {
  weeklyHours: number;
  monthlyHours: number;
  usedHours: number;
  remainingHours: number;
  status: 'excess' | 'deficit' | 'perfect';
  percentage: number;
}

/**
 * Calcula las horas semanales basadas en el horario específico
 */
export function calculateWeeklyHours(schedule: Record<string, any[]> | undefined): number {
  if (!schedule) return 0;
  
  let totalHours = 0;
  
  Object.values(schedule).forEach(daySchedule => {
    if (!Array.isArray(daySchedule) || daySchedule.length === 0) return;
    
    // Caso 1: Array de objetos {start, end} (formato nuevo)
    if (typeof daySchedule[0] === 'object' && daySchedule[0] !== null && 'start' in daySchedule[0] && 'end' in daySchedule[0]) {
      daySchedule.forEach((slot: any) => {
        const [startHour, startMin] = slot.start.split(':').map(Number);
        const [endHour, endMin] = slot.end.split(':').map(Number);
        const startTime = startHour + startMin / 60;
        const endTime = endHour + endMin / 60;
        totalHours += Math.max(0, endTime - startTime);
      });
    }
    // Caso 2: Array de strings (formato antiguo) - ['08:00', '10:00']
    else if (daySchedule.length === 2 && typeof daySchedule[0] === 'string' && typeof daySchedule[1] === 'string') {
      const [startHour, startMin] = daySchedule[0].split(':').map(Number);
      const [endHour, endMin] = daySchedule[1].split(':').map(Number);
      const startTime = startHour + startMin / 60;
      const endTime = endHour + endMin / 60;
      totalHours += Math.max(0, endTime - startTime);
    }
    // Caso 3: Array de strings múltiples - ['08:00-10:00', '13:00-15:00']
    else if (Array.isArray(daySchedule) && daySchedule.length > 0 && typeof daySchedule[0] === 'string') {
      daySchedule.forEach((slot: string) => {
        if (slot.includes('-')) {
          const parts = slot.split('-');
          if (parts.length === 2) {
            const [startHour, startMin] = parts[0].split(':').map(Number);
            const [endHour, endMin] = parts[1].split(':').map(Number);
            const startTime = startHour + startMin / 60;
            const endTime = endHour + endMin / 60;
            totalHours += Math.max(0, endTime - startTime);
          }
        }
      });
    }
  });
  
  return Math.round(totalHours * 10) / 10; // Redondear a 1 decimal
}

/**
 * Calcula las horas mensuales basadas en las horas semanales
 */
export function calculateMonthlyHours(weeklyHours: number): number {
  // Aproximadamente 4.3 semanas por mes
  return Math.round(weeklyHours * 4.3 * 10) / 10;
}

/**
 * Calcula el estado completo de horas para un usuario
 */
export function calculateUserHoursStatus(
  monthlyHours: number,
  usedHours: number
): HoursCalculation {
  const remainingHours = monthlyHours - usedHours;
  const percentage = monthlyHours > 0 ? (usedHours / monthlyHours) * 100 : 0;
  
  let status: 'excess' | 'deficit' | 'perfect';
  if (Math.abs(remainingHours) < 0.1) {
    status = 'perfect';
  } else if (remainingHours < 0) {
    status = 'excess';
  } else {
    status = 'deficit';
  }
  
  return {
    weeklyHours: Math.round((usedHours / 4.3) * 10) / 10,
    monthlyHours,
    usedHours,
    remainingHours,
    status,
    percentage: Math.round(percentage * 10) / 10
  };
}

/**
 * Calcula las horas utilizadas hasta el día actual del mes
 */
export function calculateUsedHoursUntilToday(
  schedule: Record<string, any[]> | undefined,
  year: number,
  month: number
): number {
  if (!schedule) return 0;
  
  const today = new Date();
  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();
  const lastDayToCount = isCurrentMonth ? today.getDate() : new Date(year, month, 0).getDate();
  
  let totalUsedHours = 0;
  
  // Iterar por cada día del mes hasta hoy (si es el mes actual) o hasta el final del mes
  for (let day = 1; day <= lastDayToCount; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek] as keyof typeof schedule;
    
    const daySchedule = schedule[dayName];
    if (daySchedule && daySchedule.length > 0) {
      // Calcular horas para este día
      let dayHours = 0;
      
      // Caso 1: Array de objetos {start, end}
      if (typeof daySchedule[0] === 'object' && daySchedule[0] !== null && 'start' in daySchedule[0] && 'end' in daySchedule[0]) {
        daySchedule.forEach((slot: any) => {
          const [startHour, startMin] = slot.start.split(':').map(Number);
          const [endHour, endMin] = slot.end.split(':').map(Number);
          const startTime = startHour + startMin / 60;
          const endTime = endHour + endMin / 60;
          dayHours += Math.max(0, endTime - startTime);
        });
      }
      // Caso 2: Array de strings - ['08:00', '10:00']
      else if (daySchedule.length === 2 && typeof daySchedule[0] === 'string' && typeof daySchedule[1] === 'string') {
        const [startHour, startMin] = daySchedule[0].split(':').map(Number);
        const [endHour, endMin] = daySchedule[1].split(':').map(Number);
        const startTime = startHour + startMin / 60;
        const endTime = endHour + endMin / 60;
        dayHours = Math.max(0, endTime - startTime);
      }
      // Caso 3: Array de strings múltiples - ['08:00-10:00', '13:00-15:00']
      else if (Array.isArray(daySchedule) && daySchedule.length > 0 && typeof daySchedule[0] === 'string') {
        daySchedule.forEach((slot: string) => {
          if (slot.includes('-')) {
            const parts = slot.split('-');
            if (parts.length === 2) {
              const [startHour, startMin] = parts[0].split(':').map(Number);
              const [endHour, endMin] = parts[1].split(':').map(Number);
              const startTime = startHour + startMin / 60;
              const endTime = endHour + endMin / 60;
              dayHours += Math.max(0, endTime - startTime);
            }
          }
        });
      }
      
      totalUsedHours += dayHours;
    }
  }
  
  return Math.round(totalUsedHours * 10) / 10;
} 