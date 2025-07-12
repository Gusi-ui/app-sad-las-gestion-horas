import { supabase } from './supabase'

export interface Holiday {
  id: string
  date: string
  name: string
  type: 'national' | 'regional' | 'local'
  region?: string
  city?: string
  is_active: boolean
}

export interface DayInfo {
  date: string
  dayOfWeek: number // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  isWeekend: boolean
  isHoliday: boolean
  holidayInfo?: Holiday
  isWorkingDay: boolean // Para trabajadoras laborables (L-V, no festivos)
  isHolidayDay: boolean // Para trabajadoras festivas (S-D + festivos)
}

export interface MonthCalendar {
  year: number
  month: number
  days: DayInfo[]
}

/**
 * Obtiene todos los festivos de un año específico
 */
export async function getHolidaysForYear(year: number): Promise<Holiday[]> {
  try {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    
    if (!supabase) {
      console.error('Supabase client no disponible')
      return []
    }
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_active', true)
      .order('date')

    if (error) {
      console.error('Error al obtener festivos:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error inesperado al obtener festivos:', error)
    return []
  }
}

/**
 * Verifica si una fecha es fin de semana
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // Domingo = 0, Sábado = 6
}

/**
 * Verifica si una fecha es un día laborable (L-V, no festivo)
 */
export function isWorkingDay(date: Date, holidays: Holiday[]): boolean {
  const dayOfWeek = date.getDay()
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6
  
  if (isWeekendDay) return false
  
  // Verificar si es festivo
  const dateString = date.toISOString().split('T')[0]
  const isHoliday = holidays.some(holiday => holiday.date === dateString)
  
  return !isHoliday
}

/**
 * Verifica si una fecha es un día festivo (S-D + festivos)
 */
export function isHolidayDay(date: Date, holidays: Holiday[]): boolean {
  const dayOfWeek = date.getDay()
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6
  
  if (isWeekendDay) return true
  
  // Verificar si es festivo
  const dateString = date.toISOString().split('T')[0]
  const isHoliday = holidays.some(holiday => holiday.date === dateString)
  
  return isHoliday
}

/**
 * Obtiene información completa de un día específico
 */
export function getDayInfo(date: Date, holidays: Holiday[]): DayInfo {
  const dayOfWeek = date.getDay()
  const dateString = date.toISOString().split('T')[0]
  const isWeekendDay = isWeekend(date)
  const holidayInfo = holidays.find(holiday => holiday.date === dateString)
  const isHoliday = !!holidayInfo
  
  return {
    date: dateString,
    dayOfWeek,
    isWeekend: isWeekendDay,
    isHoliday,
    holidayInfo,
    isWorkingDay: isWorkingDay(date, holidays),
    isHolidayDay: isHolidayDay(date, holidays)
  }
}

/**
 * Genera un calendario completo para un mes específico
 */
export async function generateMonthCalendar(year: number, month: number): Promise<MonthCalendar> {
  const holidays = await getHolidaysForYear(year)
  const days: DayInfo[] = []
  
  // Obtener el primer día del mes
  const firstDay = new Date(year, month - 1, 1)
  // Obtener el último día del mes
  const lastDay = new Date(year, month, 0)
  
  // Generar todos los días del mes
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month - 1, day)
    days.push(getDayInfo(date, holidays))
  }
  
  return {
    year,
    month,
    days
  }
}

/**
 * Determina qué tipo de trabajadora debe atender un día específico
 */
export function getWorkerTypeForDay(dayInfo: DayInfo): 'laborables' | 'festivos' | 'flexible' {
  if (dayInfo.isHolidayDay) {
    return 'festivos'
  } else if (dayInfo.isWorkingDay) {
    return 'laborables'
  } else {
    // Días que no son ni laborables ni festivos (no debería ocurrir)
    return 'flexible'
  }
}

/**
 * Verifica si una trabajadora puede trabajar en un día específico
 */
export function canWorkerWorkOnDay(
  workerType: 'laborables' | 'festivos' | 'flexible',
  dayInfo: DayInfo
): boolean {
  switch (workerType) {
    case 'laborables':
      return dayInfo.isWorkingDay
    case 'festivos':
      return dayInfo.isHolidayDay
    case 'flexible':
      return true // Las trabajadoras flexibles pueden trabajar cualquier día
    default:
      return false
  }
}

/**
 * Obtiene los días disponibles para una trabajadora en un mes específico
 */
export async function getAvailableDaysForWorker(
  workerType: 'laborables' | 'festivos' | 'flexible',
  year: number,
  month: number
): Promise<DayInfo[]> {
  const calendar = await generateMonthCalendar(year, month)
  
  return calendar.days.filter(day => canWorkerWorkOnDay(workerType, day))
}

/**
 * Obtiene los días bloqueados para una trabajadora en un mes específico
 */
export async function getBlockedDaysForWorker(
  workerType: 'laborables' | 'festivos' | 'flexible',
  year: number,
  month: number
): Promise<DayInfo[]> {
  const calendar = await generateMonthCalendar(year, month)
  
  return calendar.days.filter(day => !canWorkerWorkOnDay(workerType, day))
}

/**
 * Calcula las horas mensuales para una trabajadora considerando su tipo
 */
export async function calculateMonthlyHoursForWorker(
  workerType: 'laborables' | 'festivos' | 'flexible',
  weeklyHours: number,
  year: number,
  month: number
): Promise<number> {
  const availableDays = await getAvailableDaysForWorker(workerType, year, month)
  const weeksInMonth = Math.ceil(availableDays.length / 7)
  
  // Para trabajadoras flexibles, usar todas las semanas del mes
  if (workerType === 'flexible') {
    const daysInMonth = new Date(year, month, 0).getDate()
    const weeksInMonth = Math.ceil(daysInMonth / 7)
    return weeklyHours * weeksInMonth
  }
  
  // Para trabajadoras laborables y festivas, calcular basado en días disponibles
  const workingWeeks = availableDays.length / (workerType === 'laborables' ? 5 : 2)
  return weeklyHours * workingWeeks
}

/**
 * Obtiene el nombre del día de la semana en español
 */
export function getDayName(dayOfWeek: number): string {
  const dayNames = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ]
  return dayNames[dayOfWeek]
}

/**
 * Obtiene el nombre corto del día de la semana en español
 */
export function getShortDayName(dayOfWeek: number): string {
  const dayNames = [
    'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'
  ]
  return dayNames[dayOfWeek]
} 