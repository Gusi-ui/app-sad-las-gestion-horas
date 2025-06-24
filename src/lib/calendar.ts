// Calendario con festivos de España y Mataró
export interface Holiday {
  date: string // YYYY-MM-DD
  name: string
  type: 'national' | 'regional' | 'local'
}

// Festivos nacionales de España
const nationalHolidays2024: Holiday[] = [
  { date: '2024-01-01', name: 'Año Nuevo', type: 'national' },
  { date: '2024-01-06', name: 'Epifanía del Señor', type: 'national' },
  { date: '2024-03-29', name: 'Viernes Santo', type: 'national' },
  { date: '2024-05-01', name: 'Fiesta del Trabajo', type: 'national' },
  { date: '2024-08-15', name: 'Asunción de la Virgen', type: 'national' },
  { date: '2024-10-12', name: 'Fiesta Nacional de España', type: 'national' },
  { date: '2024-11-01', name: 'Todos los Santos', type: 'national' },
  { date: '2024-12-06', name: 'Día de la Constitución', type: 'national' },
  { date: '2024-12-08', name: 'Inmaculada Concepción', type: 'national' },
  { date: '2024-12-25', name: 'Navidad', type: 'national' }
]

const nationalHolidays2025: Holiday[] = [
  { date: '2025-01-01', name: 'Año Nuevo', type: 'national' },
  { date: '2025-01-06', name: 'Epifanía del Señor', type: 'national' },
  { date: '2025-04-18', name: 'Viernes Santo', type: 'national' },
  { date: '2025-05-01', name: 'Fiesta del Trabajo', type: 'national' },
  { date: '2025-08-15', name: 'Asunción de la Virgen', type: 'national' },
  { date: '2025-10-12', name: 'Fiesta Nacional de España', type: 'national' },
  { date: '2025-11-01', name: 'Todos los Santos', type: 'national' },
  { date: '2025-12-06', name: 'Día de la Constitución', type: 'national' },
  { date: '2025-12-08', name: 'Inmaculada Concepción', type: 'national' },
  { date: '2025-12-25', name: 'Navidad', type: 'national' }
]

// Festivos de Cataluña
const regionalHolidays2024: Holiday[] = [
  { date: '2024-04-01', name: 'Lunes de Pascua', type: 'regional' },
  { date: '2024-06-24', name: 'San Juan', type: 'regional' },
  { date: '2024-09-11', name: 'Diada de Cataluña', type: 'regional' },
  { date: '2024-12-26', name: 'San Esteban', type: 'regional' }
]

const regionalHolidays2025: Holiday[] = [
  { date: '2025-04-21', name: 'Lunes de Pascua', type: 'regional' },
  { date: '2025-06-24', name: 'San Juan', type: 'regional' },
  { date: '2025-09-11', name: 'Diada de Cataluña', type: 'regional' },
  { date: '2025-12-26', name: 'San Esteban', type: 'regional' }
]

// Festivos locales de Mataró
const localHolidays2024: Holiday[] = [
  { date: '2024-07-22', name: 'Santa María Magdalena (Patrona)', type: 'local' },
  { date: '2024-07-23', name: 'Fiesta Mayor de Mataró', type: 'local' },
  { date: '2024-02-26', name: 'Lunes de Carnaval', type: 'local' },
  { date: '2024-05-20', name: 'Lunes de Pascua Granada', type: 'local' }
]

const localHolidays2025: Holiday[] = [
  { date: '2025-07-22', name: 'Santa María Magdalena (Patrona)', type: 'local' },
  { date: '2025-07-23', name: 'Fiesta Mayor de Mataró', type: 'local' },
  { date: '2025-03-03', name: 'Lunes de Carnaval', type: 'local' },
  { date: '2025-06-09', name: 'Lunes de Pascua Granada', type: 'local' }
]

// Base de datos de festivos completa
const allHolidays = [
  ...nationalHolidays2024,
  ...nationalHolidays2025,
  ...regionalHolidays2024,
  ...regionalHolidays2025,
  ...localHolidays2024,
  ...localHolidays2025
]

export function getHolidaysForYear(year: number): Holiday[] {
  return allHolidays.filter(holiday => holiday.date.startsWith(year.toString()))
}

export function getHolidaysForMonth(year: number, month: number): Holiday[] {
  const monthStr = month.toString().padStart(2, '0')
  return allHolidays.filter(holiday => 
    holiday.date.startsWith(`${year}-${monthStr}`)
  )
}

export function isHoliday(date: Date): boolean {
  const dateStr = formatDateToISO(date)
  return allHolidays.some(holiday => holiday.date === dateStr)
}

export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // Domingo o Sábado
}

export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export interface WorkDayCalculation {
  totalDaysInMonth: number
  workDays: number
  weekends: number
  holidays: number
  scheduledHours: number
  totalAvailableHours: number
  difference: number // Positivo = sobran horas, Negativo = faltan horas
  weeklySchedule: { [key: number]: number } // día de semana -> horas
}

export function calculateMonthlyHours(
  year: number,
  month: number,
  weeklySchedule: { [dayOfWeek: number]: number }, // 0=domingo, 1=lunes, etc.
  includesHolidays: boolean = false,
  includesWeekends: boolean = false
): WorkDayCalculation {
  const totalDaysInMonth = getDaysInMonth(year, month)
  const holidays = getHolidaysForMonth(year, month)
  
  let workDays = 0
  let weekends = 0
  let holidayCount = 0
  let scheduledHours = 0

  // Iterar por cada día del mes
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day) // month - 1 porque Date usa 0-indexed months
    const dayOfWeek = currentDate.getDay()
    const isHolidayDay = isHoliday(currentDate)
    const isWeekendDay = isWeekend(currentDate)

    // Contar tipos de días
    if (isWeekendDay) {
      weekends++
    } else if (isHolidayDay) {
      holidayCount++
    } else {
      workDays++
    }

    // Calcular horas programadas para este día
    const hoursForThisDay = weeklySchedule[dayOfWeek] || 0
    
    if (hoursForThisDay > 0) {
      // Decidir si trabajar este día según configuración
      let shouldWork = true
      
      if (isWeekendDay && !includesWeekends) {
        shouldWork = false
      }
      
      if (isHolidayDay && !includesHolidays) {
        shouldWork = false
      }
      
      if (shouldWork) {
        scheduledHours += hoursForThisDay
      }
    }
  }

  // Calcular horas teóricas semanales
  const weeklyHours = Object.values(weeklySchedule).reduce((sum, hours) => sum + hours, 0)
  
  // Calcular aproximación de horas disponibles en el mes
  const weeksInMonth = totalDaysInMonth / 7
  const totalAvailableHours = weeklyHours * weeksInMonth

  return {
    totalDaysInMonth,
    workDays,
    weekends,
    holidays: holidayCount,
    scheduledHours,
    totalAvailableHours,
    difference: scheduledHours - totalAvailableHours,
    weeklySchedule
  }
}

export function getMonthName(month: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return months[month - 1]
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return days[dayOfWeek]
}

// Función para obtener el rango de fechas de ±1 año
export function getAvailableDateRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear() - 1, 0, 1) // 1 año atrás
  const end = new Date(now.getFullYear() + 1, 11, 31) // 1 año adelante
  
  return { start, end }
} 