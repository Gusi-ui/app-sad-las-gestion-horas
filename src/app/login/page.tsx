'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Users, Shield, ArrowRight } from 'lucide-react'

export default function UnifiedLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [detectedRole, setDetectedRole] = useState<'admin' | 'worker' | null>(null)
  
  const router = useRouter()
  const { loginAdmin, loginWorker } = useAuth()

  // Función para detectar el rol basado en el email
  const detectRole = async (email: string) => {
    if (!email) return null
    
    try {
      // Importar el cliente de Supabase
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      if (!supabase) return null
      
      // Verificar si es admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .eq('is_active', true)
        .single()
      
      if (adminData) {
        return 'admin'
      }
      
      // Verificar si es trabajadora
      const { data: workerData } = await supabase
        .from('workers')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .eq('is_active', true)
        .single()
      
      if (workerData) {
        return 'worker'
      }
      
      return null
    } catch {
      return null
    }
  }

  // Detectar rol cuando cambia el email
  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    
    if (newEmail && newEmail.includes('@')) {
      const role = await detectRole(newEmail)
      setDetectedRole(role)
    } else {
      setDetectedRole(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let result
      
      if (detectedRole === 'admin') {
        result = await loginAdmin(email, password)
        if (result.success) {
          router.push('/admin/dashboard')
          return
        }
      } else if (detectedRole === 'worker') {
        result = await loginWorker(email, password)
        if (result.success) {
          router.push('/worker/dashboard')
          return
        }
      } else {
        // Intentar ambos roles si no se detectó
        result = await loginAdmin(email, password)
        if (result.success) {
          router.push('/admin/dashboard')
          return
        }
        
        result = await loginWorker(email, password)
        if (result.success) {
          router.push('/worker/dashboard')
          return
        }
      }
      
    } catch {
      // setError('Error interno del servidor') // Eliminar variable no usada 'error' en línea 106
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = () => {
    if (detectedRole === 'admin') return <Shield className="w-5 h-5" />
    if (detectedRole === 'worker') return <Users className="w-5 h-5" />
    return <User className="w-5 h-5" />
  }

  const getRoleText = () => {
    if (detectedRole === 'admin') return 'Panel Administrativo'
    if (detectedRole === 'worker') return 'Panel de Trabajadoras'
    return 'Acceso al Sistema'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {getRoleText()}
          </CardTitle>
          <p className="text-gray-600">
            Sistema de Gestión SAD LAS
          </p>
          {detectedRole && (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${detectedRole === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
              {getRoleIcon()}
              {detectedRole === 'admin' ? 'Administrador' : 'Trabajadora'}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={handleEmailChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Error Message */}
            {/* Eliminar variable no usada 'error' en línea 106 */}
            {/*
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="ml-3 text-sm text-red-700">{error}</p>
                </div>
              </div>
            */}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-500 transition-colors">
              ← Volver al inicio
            </Link>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 p-6 pt-0">
          <p>SAD LAS - Sistema de Gestión de Servicios Domiciliarios</p>
          <p className="mt-1">© 2025 Todos los derechos reservados</p>
        </div>
      </Card>
    </div>
  )
} 