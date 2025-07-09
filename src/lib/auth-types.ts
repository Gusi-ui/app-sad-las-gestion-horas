// =====================================================
// TIPOS DE AUTENTICACIÓN - SAD LAS V2
// =====================================================

export type UserRole = 'super_admin' | 'admin' | 'worker'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  full_name?: string
  is_active: boolean
}

export interface AdminUser extends AuthUser {
  role: 'super_admin' | 'admin'
  role_id: string
  created_by?: string
  last_login?: string
}

export interface WorkerUser extends AuthUser {
  role: 'worker'
  worker_id: string
  employee_code: string
  name: string
  surname: string
  phone: string
  worker_type: string
  is_active: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Permisos por rol
export interface RolePermissions {
  can_manage_admins: boolean
  can_manage_workers: boolean
  can_manage_users: boolean
  can_manage_assignments: boolean
  can_view_reports: boolean
  can_manage_system: boolean
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  super_admin: {
    can_manage_admins: true,
    can_manage_workers: true,
    can_manage_users: true,
    can_manage_assignments: true,
    can_view_reports: true,
    can_manage_system: true,
  },
  admin: {
    can_manage_admins: false,
    can_manage_workers: true,
    can_manage_users: true,
    can_manage_assignments: true,
    can_view_reports: true,
    can_manage_system: false,
  },
  worker: {
    can_manage_admins: false,
    can_manage_workers: false,
    can_manage_users: false,
    can_manage_assignments: false,
    can_view_reports: false,
    can_manage_system: false,
  },
} 