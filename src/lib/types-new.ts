// =====================================================
// NUEVOS TIPOS TYPESCRIPT - SAD LAS
// Correspondientes al nuevo esquema de base de datos
// =====================================================

// =====================================================
// ROLES Y PERMISOS
// =====================================================

export interface SystemRole {
  id: string
  name: 'super_admin' | 'admin' | 'worker'
  description: string
  permissions: {
    manage_admins?: boolean
    manage_workers?: boolean
    manage_users?: boolean
    manage_assignments?: boolean
    view_reports?: boolean
    view_own_schedule?: boolean
    update_own_status?: boolean
    system_config?: boolean
    view_all?: boolean
  }
  created_at: string
  updated_at: string
}

// =====================================================
// ADMINISTRADORES
// =====================================================

export interface Admin {
  id: string
  email: string
  full_name: string
  role_id: string
  is_active: boolean
  created_by?: string
  last_login?: string
  created_at: string
  updated_at: string
  // Relaciones
  role?: SystemRole
  created_by_admin?: Admin
}

// =====================================================
// TRABAJADORAS
// =====================================================

export type WorkerType = 'regular' | 'holidays' | 'weekends' | 'flexible'
export type WorkerSpecialization = 'elderly_care' | 'disability_care' | 'medical_assistance' | 'companionship' | 'housekeeping' | 'personal_care'
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface Worker {
  id: string
  auth_user_id?: string
  employee_code: string
  name: string
  surname: string
  email: string
  phone: string
  dni?: string
  social_security_number?: string
  address?: string
  hire_date: string
  is_active: boolean
  
  // Configuración de trabajo
  worker_type: WorkerType
  hourly_rate: number
  max_weekly_hours: number
  max_monthly_hours: number
  
  // Especializaciones
  specializations: WorkerSpecialization[]
  certifications: string[]
  
  // Disponibilidad
  availability_days: WeekDay[]
  preferred_hours?: {
    start: string
    end: string
  }
  
  // Contacto de emergencia
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  
  // Metadatos
  profile_photo_url?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  
  // Relaciones
  created_by_admin?: Admin
  assignments?: Assignment[]
  monthly_plans?: MonthlyPlan[]
}

// =====================================================
// USUARIOS (CLIENTES)
// =====================================================

export type ServiceType = 'elderly_care' | 'disability_care' | 'medical_assistance' | 'companionship' | 'housekeeping'
export type UserStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface User {
  id: string
  client_code: string
  name: string
  surname: string
  phone: string
  email?: string
  address: string
  postal_code?: string
  city: string
  province: string
  
  // Información del servicio
  monthly_hours: number
  service_type?: ServiceType
  special_requirements: string[]
  
  // Información médica
  medical_conditions: string[]
  allergies: string[]
  medications: string[]
  
  // Contactos de emergencia
  emergency_contacts: EmergencyContact[]
  
  // Estado
  is_active: boolean
  status: UserStatus
  
  // Metadatos
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  
  // Relaciones
  created_by_admin?: Admin
  assignments?: Assignment[]
  monthly_plans?: MonthlyPlan[]
}

// =====================================================
// ASIGNACIONES
// =====================================================

export type AssignmentType = 'regular' | 'holidays' | 'weekends' | 'temporary'
export type AssignmentStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type AssignmentPriority = 1 | 2 | 3 // 1=alta, 2=media, 3=baja

export interface ScheduleTime {
  start: string
  end: string
}

export interface Assignment {
  id: string
  worker_id: string
  user_id: string
  
  // Configuración de la asignación
  assignment_type: AssignmentType
  start_date: string
  end_date?: string
  
  // Horarios
  weekly_hours: number
  schedule: Record<WeekDay, ScheduleTime>
  
  // Estado y prioridad
  status: AssignmentStatus
  priority: AssignmentPriority
  
  // Metadatos
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  
  // Relaciones
  worker?: Worker
  user?: User
  created_by_admin?: Admin
  monthly_plans?: MonthlyPlan[]
  history?: AssignmentHistory[]
}

// =====================================================
// HISTORIAL DE ASIGNACIONES
// =====================================================

export interface AssignmentHistory {
  id: string
  assignment_id: string
  previous_worker_id?: string
  new_worker_id: string
  changed_by: string
  change_reason?: string
  created_at: string
  
  // Relaciones
  assignment?: Assignment
  previous_worker?: Worker
  new_worker?: Worker
  changed_by_user?: Admin
}

// =====================================================
// PLANIFICACIÓN MENSUAL
// =====================================================

export type PlanStatus = 'draft' | 'approved' | 'in_progress' | 'completed'

export interface HolidayHours {
  [date: string]: number // "2025-01-01": 3.5
}

export interface WeekendHours {
  saturday: number
  sunday: number
}

export interface MonthlyPlan {
  id: string
  worker_id: string
  user_id: string
  assignment_id: string
  
  // Período
  month: number
  year: number
  
  // Horas planificadas
  planned_hours: number
  actual_hours: number
  
  // Configuración específica del mes
  schedule_config: Record<WeekDay, ScheduleTime>
  holiday_hours?: HolidayHours
  weekend_hours?: WeekendHours
  
  // Estado
  status: PlanStatus
  
  // Metadatos
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  
  // Relaciones
  worker?: Worker
  user?: User
  assignment?: Assignment
  created_by_admin?: Admin
  service_days?: ServiceDay[]
}

// =====================================================
// DÍAS DE SERVICIO
// =====================================================

export type ServiceDayStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

export interface ServiceDay {
  id: string
  monthly_plan_id: string
  
  // Fecha específica
  service_date: string
  day_of_week: number // 0-6 (Domingo-Sábado)
  
  // Horarios
  start_time?: string
  end_time?: string
  hours: number
  
  // Estado del servicio
  status: ServiceDayStatus
  
  // Notas
  worker_notes?: string
  admin_notes?: string
  
  // Metadatos
  created_at: string
  updated_at: string
  
  // Relaciones
  monthly_plan?: MonthlyPlan
}

// =====================================================
// FESTIVOS
// =====================================================

export type HolidayType = 'national' | 'regional' | 'local'

export interface Holiday {
  id: string
  date: string
  name: string
  type: HolidayType
  region: string
  city: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// =====================================================
// ALERTAS DEL SISTEMA
// =====================================================

export type AlertType = 'conflict' | 'warning' | 'info' | 'error'
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed'

export interface SystemAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description?: string
  
  // Entidades afectadas
  affected_workers?: string[]
  affected_users?: string[]
  affected_assignments?: string[]
  
  // Fechas
  alert_date: string
  resolved_date?: string
  resolved_by?: string
  
  // Estado
  status: AlertStatus
  
  // Metadatos
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  
  // Relaciones
  resolved_by_admin?: Admin
}

// =====================================================
// TIPOS PARA FORMULARIOS Y UI
// =====================================================

export interface CreateWorkerForm {
  name: string
  surname: string
  email: string
  phone: string
  dni?: string
  social_security_number?: string
  address?: string
  worker_type: WorkerType
  hourly_rate: number
  max_weekly_hours: number
  specializations: WorkerSpecialization[]
  availability_days: WeekDay[]
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  notes?: string
}

export interface CreateUserForm {
  name: string
  surname: string
  phone: string
  email?: string
  address: string
  postal_code?: string
  city: string
  province: string
  monthly_hours: number
  service_type?: ServiceType
  special_requirements: string[]
  medical_conditions: string[]
  allergies: string[]
  medications: string[]
  emergency_contacts: EmergencyContact[]
  notes?: string
}

export interface CreateAssignmentForm {
  worker_id: string
  user_id: string
  assignment_type: AssignmentType
  start_date: string
  end_date?: string
  weekly_hours: number
  schedule: Record<WeekDay, ScheduleTime>
  priority: AssignmentPriority
  notes?: string
}

export interface CreateMonthlyPlanForm {
  worker_id: string
  user_id: string
  assignment_id: string
  month: number
  year: number
  schedule_config: Record<WeekDay, ScheduleTime>
  holiday_hours?: HolidayHours
  weekend_hours?: WeekendHours
  notes?: string
}

// =====================================================
// TIPOS PARA CÁLCULOS Y MÉTRICAS
// =====================================================

export interface HourCalculation {
  planned: number
  actual: number
  difference: number
  percentage: number
  status: 'on_track' | 'behind' | 'ahead' | 'completed'
}

export interface WorkerMetrics {
  worker_id: string
  total_assignments: number
  active_assignments: number
  total_weekly_hours: number
  available_weekly_hours: number
  utilization_rate: number
  average_rating?: number
}

export interface UserMetrics {
  user_id: string
  total_workers: number
  total_monthly_hours: number
  used_monthly_hours: number
  remaining_hours: number
  service_coverage: number
}

// =====================================================
// TIPOS PARA FILTROS Y BÚSQUEDAS
// =====================================================

export interface WorkerFilters {
  worker_type?: WorkerType
  is_active?: boolean
  specializations?: WorkerSpecialization[]
  availability_days?: WeekDay[]
  search?: string
}

export interface UserFilters {
  status?: UserStatus
  service_type?: ServiceType
  city?: string
  search?: string
}

export interface AssignmentFilters {
  status?: AssignmentStatus
  assignment_type?: AssignmentType
  worker_id?: string
  user_id?: string
  priority?: AssignmentPriority
  date_range?: {
    start: string
    end: string
  }
}

// =====================================================
// TIPOS PARA REPORTES
// =====================================================

export interface MonthlyReport {
  month: number
  year: number
  total_workers: number
  total_users: number
  total_assignments: number
  total_hours_planned: number
  total_hours_actual: number
  utilization_rate: number
  alerts_count: number
  conflicts_count: number
}

export interface WorkerReport {
  worker_id: string
  worker_name: string
  month: number
  year: number
  assignments_count: number
  hours_planned: number
  hours_actual: number
  efficiency_rate: number
  conflicts_count: number
  notes_count: number
} 