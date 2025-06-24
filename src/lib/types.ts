export interface User {
  id: string
  created_at: string
  updated_at: string
  worker_id: string
  name: string
  surname: string
  phone: string
  notes?: string
  is_active: boolean
  monthly_hours?: number // Horas totales asignadas al mes (ej: 86h)
}

export type WorkerType = 'regular' | 'holidays' | 'weekends'

export interface ServiceCard {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  month: number
  year: number
  worker_type: WorkerType // NUEVO: Tipo de trabajadora
  total_hours: number
  used_hours: number
  // Campos específicos según tipo de trabajadora
  specific_dates?: string[] // Para trabajadora de festivos: ['2025-01-01', '2025-01-06']
  holiday_hours?: number // Horas por día festivo (por defecto 3.5)
  weekend_config?: { saturday: boolean; sunday: boolean } // Para trabajadora de fines de semana
  weekend_hours?: { saturday: number; sunday: number } // Horas específicas por día de fin de semana
  weekly_schedule?: { [key: number]: number } // Para trabajadora regular
}

export interface ServiceDay {
  id: string
  card_id: string
  day_of_week: number // 0-6 (Domingo-Sábado)
  hours: number
  specific_date?: string // Para festivos específicos: '2025-01-01'
}

export interface WorkerProfile {
  id: string
  email: string
  full_name: string
  worker_type: WorkerType // NUEVO: Tipo de trabajadora
  created_at: string
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface ServiceSchedule {
  [key: number]: number // day_of_week: hours
} 