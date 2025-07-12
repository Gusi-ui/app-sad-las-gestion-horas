export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          email: string
          full_name: string
          role_id: string
          is_active: boolean
          created_by: string | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role_id: string
          is_active?: boolean
          created_by?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role_id?: string
          is_active?: boolean
          created_by?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workers: {
        Row: {
          id: string
          auth_user_id: string | null
          employee_code: string
          name: string
          surname: string
          email: string
          phone: string
          dni: string | null
          social_security_number: string | null
          address: string | null
          street_address: string | null
          postal_code: string | null
          city: string | null
          province: string | null
          hire_date: string
          is_active: boolean
          worker_type: string
          hourly_rate: number
          max_weekly_hours: number
          max_monthly_hours: number
          specializations: string[]
          certifications: string[]
          availability_days: string[]
          preferred_hours: Json | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          profile_photo_url: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          employee_code: string
          name: string
          surname: string
          email: string
          phone: string
          dni?: string | null
          social_security_number?: string | null
          address?: string | null
          street_address?: string | null
          postal_code?: string | null
          city?: string | null
          province?: string | null
          hire_date?: string
          is_active?: boolean
          worker_type: string
          hourly_rate?: number
          max_weekly_hours?: number
          max_monthly_hours?: number
          specializations?: string[]
          certifications?: string[]
          availability_days?: string[]
          preferred_hours?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          profile_photo_url?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          employee_code?: string
          name?: string
          surname?: string
          email?: string
          phone?: string
          dni?: string | null
          social_security_number?: string | null
          address?: string | null
          street_address?: string | null
          postal_code?: string | null
          city?: string | null
          province?: string | null
          hire_date?: string
          is_active?: boolean
          worker_type?: string
          hourly_rate?: number
          max_weekly_hours?: number
          max_monthly_hours?: number
          specializations?: string[]
          certifications?: string[]
          availability_days?: string[]
          preferred_hours?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          profile_photo_url?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          client_code: string
          name: string
          surname: string
          phone: string
          email: string | null
          address: string
          postal_code: string | null
          city: string
          province: string
          monthly_hours: number
          service_type: string | null
          special_requirements: string[]
          medical_conditions: string[]
          allergies: string[]
          medications: string[]
          emergency_contacts: Json | null
          is_active: boolean
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_code: string
          name: string
          surname: string
          phone: string
          email?: string | null
          address: string
          postal_code?: string | null
          city?: string
          province?: string
          monthly_hours?: number
          service_type?: string | null
          special_requirements?: string[]
          medical_conditions?: string[]
          allergies?: string[]
          medications?: string[]
          emergency_contacts?: Json | null
          is_active?: boolean
          status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_code?: string
          name?: string
          surname?: string
          phone?: string
          email?: string | null
          address?: string
          postal_code?: string | null
          city?: string
          province?: string
          monthly_hours?: number
          service_type?: string | null
          special_requirements?: string[]
          medical_conditions?: string[]
          allergies?: string[]
          medications?: string[]
          emergency_contacts?: Json | null
          is_active?: boolean
          status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          worker_id: string
          user_id: string
          assignment_type: string
          start_date: string
          end_date: string | null
          weekly_hours: number
          schedule: Json | null
          status: string
          priority: number
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          user_id: string
          assignment_type: string
          start_date: string
          end_date?: string | null
          weekly_hours: number
          schedule?: Json | null
          status?: string
          priority?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          worker_id?: string
          user_id?: string
          assignment_type?: string
          start_date?: string
          end_date?: string | null
          weekly_hours?: number
          schedule?: Json | null
          status?: string
          priority?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      monthly_plans: {
        Row: {
          id: string
          worker_id: string
          user_id: string
          assignment_id: string
          month: number
          year: number
          planned_hours: number
          actual_hours: number
          schedule_config: Json | null
          holiday_hours: Json | null
          weekend_hours: Json | null
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          user_id: string
          assignment_id: string
          month: number
          year: number
          planned_hours?: number
          actual_hours?: number
          schedule_config?: Json | null
          holiday_hours?: Json | null
          weekend_hours?: Json | null
          status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          worker_id?: string
          user_id?: string
          assignment_id?: string
          month?: number
          year?: number
          planned_hours?: number
          actual_hours?: number
          schedule_config?: Json | null
          holiday_hours?: Json | null
          weekend_hours?: Json | null
          status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      service_days: {
        Row: {
          id: string
          monthly_plan_id: string
          service_date: string
          day_of_week: number
          start_time: string | null
          end_time: string | null
          hours: number
          status: string
          worker_notes: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          monthly_plan_id: string
          service_date: string
          day_of_week: number
          start_time?: string | null
          end_time?: string | null
          hours?: number
          status?: string
          worker_notes?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          monthly_plan_id?: string
          service_date?: string
          day_of_week?: number
          start_time?: string | null
          end_time?: string | null
          hours?: number
          status?: string
          worker_notes?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      holidays: {
        Row: {
          id: string
          date: string
          name: string
          type: string
          region: string
          city: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          name: string
          type: string
          region?: string
          city?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          name?: string
          type?: string
          region?: string
          city?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      system_alerts: {
        Row: {
          id: string
          type: string
          severity: string
          title: string
          description: string | null
          affected_workers: string[]
          affected_users: string[]
          affected_assignments: string[]
          alert_date: string
          resolved_date: string | null
          resolved_by: string | null
          status: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          severity: string
          title: string
          description?: string | null
          affected_workers?: string[]
          affected_users?: string[]
          affected_assignments?: string[]
          alert_date: string
          resolved_date?: string | null
          resolved_by?: string | null
          status?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          severity?: string
          title?: string
          description?: string | null
          affected_workers?: string[]
          affected_users?: string[]
          affected_assignments?: string[]
          alert_date?: string
          resolved_date?: string | null
          resolved_by?: string | null
          status?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      system_roles: {
        Row: {
          id: string
          name: string
          description: string | null
          permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          permissions: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 