'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!supabase) {
      setError('Error de configuración del sistema')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setError(error.message)
      } else {
        // Redirigir al dashboard después del registro exitoso
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Error al crear la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="pb-4 border-b border-secondary text-center">
          <h3 className="font-semibold text-secondary text-2xl">Crear Cuenta</h3>
          <p className="text-slate-600">Regístrate para acceder al sistema</p>
        </div>
        
        <div className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-secondary mb-1">
                Nombre Completo
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Tu nombre completo"
                required
                className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg w-full disabled:opacity-50"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
          
          <div className="mt-2 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 