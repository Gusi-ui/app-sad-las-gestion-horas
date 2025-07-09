'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthUser, AuthState } from '@/lib/auth-types'
import { authService } from '@/lib/auth-service'

interface AuthContextType extends AuthState {
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWorker: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // =====================================================
  // FUNCIONES DE AUTENTICACIÓN
  // =====================================================

  const loginAdmin = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const { user, error } = await authService.loginAdmin({ email, password })
      
      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return { success: false, error }
      }

      if (user) {
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })
        return { success: true }
      }

      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Error de autenticación' }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  const loginWorker = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const { user, error } = await authService.loginWorker({ email, password })
      
      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return { success: false, error }
      }

      if (user) {
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })
        return { success: true }
      }

      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Error de autenticación' }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      await authService.logout()
      
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    } catch (error) {
      console.error('Error en logout:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const refreshUser = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const { user, error } = await authService.getCurrentUser()
      
      if (error) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
        return
      }

      if (user) {
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    } catch (error) {
      console.error('Error al refrescar usuario:', error)
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }

  // =====================================================
  // EFECTO INICIAL
  // =====================================================

  useEffect(() => {
    refreshUser()
  }, [])

  // =====================================================
  // VALOR DEL CONTEXTO
  // =====================================================

  const contextValue: AuthContextType = {
    ...authState,
    loginAdmin,
    loginWorker,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
} 