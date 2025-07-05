'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      } else {
        // 1. Obtener el usuario autenticado
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('No se pudo obtener el usuario autenticado.')
          setLoading(false)
          return
        }

        // 2. Consultar el perfil en worker_profiles usando el id
        const { data: profile, error: profileError } = await supabase
          .from('worker_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          setError('No tienes permisos para acceder a la administración.')
        } else if (profile.role === 'admin') {
        router.push('/dashboard')
        } else {
          setError('No tienes permisos para acceder a la administración.')
        }
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-blue-200 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-900">Iniciar Sesión</CardTitle>
          <p className="text-blue-700">Accede a tu cuenta para gestionar tus servicios</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-900 mb-1">Email</label>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blue-900 mb-1">Contraseña</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
              loading={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
              ← Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 