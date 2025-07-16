import { createClient } from '@supabase/supabase-js'
import type { Database } from './types-new'

// =====================================================
// CLIENTE SUPABASE - SAD LAS V2
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Cliente principal de Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Cliente con service role para operaciones administrativas
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// =====================================================
// FUNCIONES DE AUTENTICACIÓN
// =====================================================

export const auth = {
  // Login para administradores
  async loginAdmin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    // Verificar que el usuario es un admin
    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (!admin) {
      throw new Error('Usuario no autorizado como administrador')
    }
    
    return { user: data.user, admin }
  },

  // Login para trabajadoras
  async loginWorker(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    // Verificar que el usuario es una trabajadora
    const { data: worker } = await supabase
      .from('workers')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single()
    
    if (!worker) {
      throw new Error('Usuario no autorizado como trabajadora')
    }
    
    return { user: data.user, worker }
  },

  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Obtener usuario actual
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Obtener sesión actual
  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }
}

// =====================================================
// FUNCIONES DE ADMINISTRADORES
// =====================================================

export const admins = {
  // Obtener todos los administradores
  async getAll() {
    const { data, error } = await supabase
      .from('admins')
      .select(`
        *,
        role:system_roles(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Obtener administrador por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('admins')
      .select(`
        *,
        role:system_roles(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Crear nuevo administrador
  async create(adminData: {
    email: string
    full_name: string
    role_id: string
    created_by?: string
  }) {
    const { data, error } = await supabase
      .from('admins')
      .insert(adminData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Actualizar administrador
  async update(id: string, updates: Partial<{
    full_name: string
    role_id: string
    is_active: boolean
  }>) {
    const { data, error } = await supabase
      .from('admins')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Eliminar administrador
  async delete(id: string) {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// FUNCIONES DE TRABAJADORAS
// =====================================================

export const workers = {
  // Obtener todas las trabajadoras
  async getAll(filters?: {
    worker_type?: string
    is_active?: boolean
    specializations?: string[]
  }) {
    let query = supabase
      .from('workers')
      .select(`
        *,
        created_by_admin:admins(full_name)
      `)
      .order('created_at', { ascending: false })
    
    if (filters?.worker_type) {
      query = query.eq('worker_type', filters.worker_type)
    }
    
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    
    if (filters?.specializations?.length) {
      query = query.overlaps('specializations', filters.specializations)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  // Obtener trabajadora por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('workers')
      .select(`
        *,
        created_by_admin:admins(full_name),
        assignments(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Crear nueva trabajadora
  async create(workerData: {
    name: string
    surname: string
    email: string
    phone: string
    worker_type: string
    hourly_rate: number
    max_weekly_hours: number
    specializations: string[]
    availability_days: string[]
    created_by: string
  }) {
    const { data, error } = await supabase
      .from('workers')
      .insert(workerData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Actualizar trabajadora
  async update(id: string, updates: Partial<{
    name: string
    surname: string
    email: string
    phone: string
    worker_type: string
    hourly_rate: number
    max_weekly_hours: number
    specializations: string[]
    availability_days: string[]
    is_active: boolean
  }>) {
    const { data, error } = await supabase
      .from('workers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Eliminar trabajadora
  async delete(id: string) {
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// FUNCIONES DE USUARIOS
// =====================================================

export const users = {
  // Obtener todos los usuarios
  async getAll(filters?: {
    status?: string
    service_type?: string
    city?: string
  }) {
    let query = supabase
      .from('users')
      .select(`
        *,
        created_by_admin:admins(full_name)
      `)
      .order('created_at', { ascending: false })
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.service_type) {
      query = query.eq('service_type', filters.service_type)
    }
    
    if (filters?.city) {
      query = query.eq('city', filters.city)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  // Obtener usuario por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        created_by_admin:admins(full_name),
        assignments(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Crear nuevo usuario
  async create(userData: {
    name: string
    surname: string
    phone: string
    email?: string
    address: string
    city: string
    monthly_hours: number
    service_type?: string
    special_requirements: string[]
    medical_conditions: string[]
    allergies: string[]
    medications: string[]
    emergency_contacts: unknown[]
    created_by: string
  }) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Actualizar usuario
  async update(id: string, updates: Partial<{
    name: string
    surname: string
    phone: string
    email: string
    address: string
    monthly_hours: number
    service_type: string
    status: string
    is_active: boolean
  }>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Eliminar usuario
  async delete(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// FUNCIONES DE ASIGNACIONES
// =====================================================

export const assignments = {
  // Obtener todas las asignaciones
  async getAll(filters?: {
    status?: string
    assignment_type?: string
    worker_id?: string
    user_id?: string
  }) {
    let query = supabase
      .from('assignments')
      .select(`
        *,
        worker:workers(name, surname, email),
        user:users(name, surname, phone),
        created_by_admin:admins(full_name)
      `)
      .order('created_at', { ascending: false })
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.assignment_type) {
      query = query.eq('assignment_type', filters.assignment_type)
    }
    
    if (filters?.worker_id) {
      query = query.eq('worker_id', filters.worker_id)
    }
    
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  // Obtener asignación por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        worker:workers(*),
        user:users(*),
        created_by_admin:admins(full_name),
        monthly_plans(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Crear nueva asignación
  async create(assignmentData: {
    worker_id: string
    user_id: string
    assignment_type: string
    start_date: string
    end_date?: string
    weekly_hours: number
    schedule: unknown
    priority: number
    created_by: string
  }) {
    const { data, error } = await supabase
      .from('assignments')
      .insert(assignmentData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Actualizar asignación
  async update(id: string, updates: Partial<{
    assignment_type: string
    end_date: string
    weekly_hours: number
    schedule: unknown
    status: string
    priority: number
  }>) {
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Eliminar asignación
  async delete(id: string) {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// FUNCIONES DE PLANIFICACIÓN MENSUAL
// =====================================================

export const monthlyPlans = {
  // Obtener planes mensuales
  async getAll(filters?: {
    worker_id?: string
    user_id?: string
    month?: number
    year?: number
    status?: string
  }) {
    let query = supabase
      .from('monthly_plans')
      .select(`
        *,
        worker:workers(name, surname),
        user:users(name, surname),
        assignment:assignments(*)
      `)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
    
    if (filters?.worker_id) {
      query = query.eq('worker_id', filters.worker_id)
    }
    
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    
    if (filters?.month) {
      query = query.eq('month', filters.month)
    }
    
    if (filters?.year) {
      query = query.eq('year', filters.year)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  // Obtener plan mensual por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('monthly_plans')
      .select(`
        *,
        worker:workers(*),
        user:users(*),
        assignment:assignments(*),
        service_days(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Crear nuevo plan mensual
  async create(planData: {
    worker_id: string
    user_id: string
    assignment_id: string
    month: number
    year: number
    schedule_config: unknown
    holiday_hours?: unknown
    weekend_hours?: unknown
    created_by: string
  }) {
    const { data, error } = await supabase
      .from('monthly_plans')
      .insert(planData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Actualizar plan mensual
  async update(id: string, updates: Partial<{
    schedule_config: unknown
    holiday_hours: unknown
    weekend_hours: unknown
    status: string
    actual_hours: number
  }>) {
    const { data, error } = await supabase
      .from('monthly_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Eliminar plan mensual
  async delete(id: string) {
    const { error } = await supabase
      .from('monthly_plans')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// FUNCIONES DE DÍAS DE SERVICIO
// =====================================================

export const serviceDays = {
  // Obtener días de servicio
  async getAll(filters?: {
    monthly_plan_id?: string
    service_date?: string
    status?: string
  }) {
    let query = supabase
      .from('service_days')
      .select(`
        *,
        monthly_plan:monthly_plans(*)
      `)
      .order('service_date', { ascending: true })
    
    if (filters?.monthly_plan_id) {
      query = query.eq('monthly_plan_id', filters.monthly_plan_id)
    }
    
    if (filters?.service_date) {
      query = query.eq('service_date', filters.service_date)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  // Actualizar día de servicio (para trabajadoras)
  async update(id: string, updates: Partial<{
    status: string
    worker_notes: string
    start_time: string
    end_time: string
    hours: number
  }>) {
    const { data, error } = await supabase
      .from('service_days')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// =====================================================
// FUNCIONES DE FESTIVOS
// =====================================================

export const holidays = {
  // Obtener todos los festivos
  async getAll(filters?: {
    year?: number
    type?: string
    is_active?: boolean
  }) {
    let query = supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: true })
    
    if (filters?.year) {
      query = query.gte('date', `${filters.year}-01-01`)
      query = query.lt('date', `${filters.year + 1}-01-01`)
    }
    
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  // Crear nuevo festivo
  async create(holidayData: {
    date: string
    name: string
    type: string
    region?: string
    city?: string
  }) {
    const { data, error } = await supabase
      .from('holidays')
      .insert(holidayData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// =====================================================
// FUNCIONES DE ALERTAS DEL SISTEMA
// =====================================================

export const alerts = {
  // Obtener alertas
  async getAll(filters?: {
    status?: string
    severity?: string
    type?: string
  }) {
    let query = supabase
      .from('system_alerts')
      .select(`
        *,
        resolved_by_admin:admins(full_name)
      `)
      .order('created_at', { ascending: false })
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.severity) {
      query = query.eq('severity', filters.severity)
    }
    
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  // Crear nueva alerta
  async create(alertData: {
    type: string
    severity: string
    title: string
    description?: string
    alert_date: string
    affected_workers?: string[]
    affected_users?: string[]
    affected_assignments?: string[]
  }) {
    const { data, error } = await supabase
      .from('system_alerts')
      .insert(alertData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Resolver alerta
  async resolve(id: string, resolved_by: string) {
    const { data, error } = await supabase
      .from('system_alerts')
      .update({
        status: 'resolved',
        resolved_date: new Date().toISOString(),
        resolved_by
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export default supabase 