// =====================================================
// SERVICIO DE AUTENTICACIÓN - SAD LAS V2
// =====================================================

import { createClient } from './supabase'
import { AuthUser, AdminUser, WorkerUser, LoginCredentials, UserRole, RolePermissions, ROLE_PERMISSIONS } from './auth-types'

export class AuthService {
  private supabase = createClient()

  // =====================================================
  // AUTENTICACIÓN DE ADMINISTRADORES
  // =====================================================

  async loginAdmin(credentials: LoginCredentials): Promise<{ user: AdminUser | null; error: string | null }> {
    try {
      if (!this.supabase) {
        return { user: null, error: 'Cliente de Supabase no disponible' }
      }

      // Normalizar email a minúsculas para consistencia
      const normalizedEmail = credentials.email.toLowerCase().trim()

      // Autenticar con Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: credentials.password,
      })

      if (authError) {
        return { user: null, error: authError.message }
      }

      if (!authData.user) {
        return { user: null, error: 'Usuario no encontrado' }
      }

      // Buscar información del admin en la tabla admins
      const { data: adminData, error: adminError } = await this.supabase
        .from('admins')
        .select(`
          id,
          email,
          full_name,
          role_id,
          is_active,
          created_by,
          last_login
        `)
        .eq('email', normalizedEmail)
        .eq('is_active', true)
        .single()

      if (adminError) {
        return { user: null, error: 'Administrador no encontrado o inactivo' }
      }

      if (!adminData) {
        return { user: null, error: 'Administrador no encontrado o inactivo' }
      }

      // Obtener el rol del sistema
      const { data: roleData, error: roleError } = await this.supabase
        .from('system_roles')
        .select('name')
        .eq('id', adminData.role_id)
        .single()

      if (roleError) {
        return { user: null, error: 'Error al obtener rol del administrador' }
      }

      if (!roleData) {
        return { user: null, error: 'Rol del administrador no encontrado' }
      }

      // Actualizar último login
      await this.supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminData.id)

      const adminUser: AdminUser = {
        id: adminData.id,
        email: adminData.email,
        full_name: adminData.full_name,
        role: roleData?.name as 'super_admin' | 'admin',
        role_id: adminData.role_id,
        is_active: adminData.is_active,
        created_by: adminData.created_by,
        last_login: adminData.last_login,
      }

      return { user: adminUser, error: null }
    } catch (error) {
      console.error('Error inesperado en loginAdmin:', error)
      return { user: null, error: 'Error interno del servidor' }
    }
  }

  // =====================================================
  // AUTENTICACIÓN DE TRABAJADORAS
  // =====================================================

  async loginWorker(credentials: LoginCredentials): Promise<{ user: WorkerUser | null; error: string | null }> {
    try {
      if (!this.supabase) {
        return { user: null, error: 'Cliente de Supabase no disponible' }
      }

      // Autenticar con Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError) {
        return { user: null, error: authError.message }
      }

      if (!authData.user) {
        return { user: null, error: 'Usuario no encontrado' }
      }

      // Buscar información de la trabajadora
      const { data: workerData, error: workerError } = await this.supabase
        .from('workers')
        .select(`
          id,
          auth_user_id,
          employee_code,
          name,
          surname,
          email,
          phone,
          worker_type,
          is_active
        `)
        .eq('email', credentials.email)
        .eq('is_active', true)
        .single()

      if (workerError || !workerData) {
        return { user: null, error: 'Trabajadora no encontrada o inactiva' }
      }

      const workerUser: WorkerUser = {
        id: workerData.auth_user_id || workerData.id,
        email: workerData.email,
        role: 'worker',
        worker_id: workerData.id,
        employee_code: workerData.employee_code,
        name: workerData.name,
        surname: workerData.surname,
        phone: workerData.phone,
        worker_type: workerData.worker_type,
        is_active: workerData.is_active,
      }

      return { user: workerUser, error: null }
    } catch (error) {
      console.error('Error en loginWorker:', error)
      return { user: null, error: 'Error interno del servidor' }
    }
  }

  // =====================================================
  // VERIFICACIÓN DE SESIÓN
  // =====================================================

  async getCurrentUser(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      if (!this.supabase) {
        return { user: null, error: 'Cliente de Supabase no disponible' }
      }

      const { data: { user: authUser }, error: authError } = await this.supabase.auth.getUser()

      if (authError || !authUser) {
        return { user: null, error: 'No hay sesión activa' }
      }

      // Intentar encontrar como admin
      const { data: adminData } = await this.supabase
        .from('admins')
        .select(`
          id,
          email,
          full_name,
          role_id,
          is_active
        `)
        .eq('email', authUser.email)
        .eq('is_active', true)
        .single()

      if (adminData) {
        // Obtener el rol del sistema
        const { data: roleData } = await this.supabase
          .from('system_roles')
          .select('name')
          .eq('id', adminData.role_id)
          .single()

        const adminUser: AdminUser = {
          id: adminData.id,
          email: adminData.email,
          full_name: adminData.full_name,
          role: roleData?.name as 'super_admin' | 'admin',
          role_id: adminData.role_id,
          is_active: adminData.is_active,
        }
        return { user: adminUser, error: null }
      }

      // Intentar encontrar como trabajadora
      const { data: workerData } = await this.supabase
        .from('workers')
        .select(`
          id,
          auth_user_id,
          employee_code,
          name,
          surname,
          email,
          phone,
          worker_type,
          is_active
        `)
        .eq('email', authUser.email)
        .eq('is_active', true)
        .single()

      if (workerData) {
        const workerUser: WorkerUser = {
          id: workerData.auth_user_id || workerData.id,
          email: workerData.email,
          role: 'worker',
          worker_id: workerData.id,
          employee_code: workerData.employee_code,
          name: workerData.name,
          surname: workerData.surname,
          phone: workerData.phone,
          worker_type: workerData.worker_type,
          is_active: workerData.is_active,
        }
        return { user: workerUser, error: null }
      }

      return { user: null, error: 'Usuario no encontrado en el sistema' }
    } catch (error) {
      console.error('Error en getCurrentUser:', error)
      return { user: null, error: 'Error interno del servidor' }
    }
  }

  // =====================================================
  // CERRAR SESIÓN
  // =====================================================

  async logout(): Promise<{ error: string | null }> {
    try {
      if (!this.supabase) {
        return { error: 'Cliente de Supabase no disponible' }
      }

      const { error } = await this.supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      console.error('Error en logout:', error)
      return { error: 'Error interno del servidor' }
    }
  }

  // =====================================================
  // VERIFICACIÓN DE PERMISOS
  // =====================================================

  hasPermission(user: AuthUser | null, permission: keyof RolePermissions): boolean {
    if (!user) return false
    
    const permissions = ROLE_PERMISSIONS[user.role]
    return permissions[permission] || false
  }

  canAccessAdminPanel(user: AuthUser | null): boolean {
    return user?.role === 'super_admin' || user?.role === 'admin'
  }

  canAccessWorkerPanel(user: AuthUser | null): boolean {
    return user?.role === 'worker'
  }
}

// Instancia singleton
export const authService = new AuthService() 