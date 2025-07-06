export interface User {
  id: string
  created_at: string
  updated_at: string
  name: string
  surname: string
  phone: string
  address?: string
  notes?: string
  is_active: boolean
  monthly_hours?: number // Horas totales asignadas al mes (ej: 86h)
}

export type WorkerType = 'laborable' | 'holiday_weekend' | 'both'

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

// NEW: Workers Management System Types
export type WorkerSpecialization = 'elderly_care' | 'disability_care' | 'medical_assistance' | 'companionship'
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type AssignmentStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type AssignmentPriority = 1 | 2 | 3 // 1=alta, 2=media, 3=baja

export interface Worker {
  id: string
  name: string
  surname: string
  phone: string
  email?: string
  address?: string
  dni?: string
  social_security_number?: string
  hire_date: string
  is_active: boolean
  hourly_rate: number
  max_weekly_hours: number
  specializations: WorkerSpecialization[]
  availability_days: WeekDay[]
  notes?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  profile_photo_url?: string
  created_at: string
  updated_at: string
  worker_type?: 'laborable' | 'holiday_weekend' | 'both'
}

export interface Assignment {
  id: string
  worker_id: string
  user_id: string
  assigned_hours_per_week: number
  start_date: string
  end_date?: string
  specific_schedule?: Record<WeekDay, string[]> // {"monday": ["09:00", "11:00"]}
  priority: AssignmentPriority
  status: AssignmentStatus
  notes?: string
  created_at: string
  updated_at: string
  // Populated fields
  worker?: Worker
  user?: User
}

export interface WorkerAvailability {
  id: string
  worker_id: string
  day_of_week: WeekDay
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
}

export interface WorkerStats {
  id: string
  name: string
  surname: string
  is_active: boolean
  total_assignments: number
  active_assignments: number
  total_weekly_hours: number
  max_weekly_hours: number
  available_hours: number
} 