'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateUser } from '@/hooks/useUsers'
import { ArrowLeft } from 'lucide-react'

export default function NewUserPage() {
  const [userData, setUserData] = useState({
    name: '',
    surname: '',
    phone: '',
    notes: ''
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const createUserMutation = useCreateUser()

  const handleUserDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUserData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validaciones básicas
      if (!userData.name.trim() || !userData.surname.trim() || !userData.phone.trim()) {
        throw new Error('Nombre, apellido y teléfono son obligatorios')
      }

      // Crear usuario
      const newUser = await createUserMutation.mutateAsync({
        ...userData,
        is_active: true
      })

      // Redirigir a la página de detalle del usuario para configurar servicios
      router.push(`/dashboard/users/${newUser.id}`)
    } catch (err: any) {
      setError(err.message || 'Error al crear el usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/dashboard" className="mr-4">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Nuevo Usuario</h1>
              <p className="text-slate-600">Crear un nuevo usuario (podrás configurar servicios después)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Datos Personales */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Personales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  name="name"
                  type="text"
                  placeholder="Nombre del usuario"
                  value={userData.name}
                  onChange={handleUserDataChange}
                  required
                  size="lg"
                />

                <Input
                  label="Apellidos"
                  name="surname"
                  type="text"
                  placeholder="Apellidos del usuario"
                  value={userData.surname}
                  onChange={handleUserDataChange}
                  required
                  size="lg"
                />
              </div>

              <Input
                label="Teléfono"
                name="phone"
                type="tel"
                placeholder="+34 600 000 000"
                value={userData.phone}
                onChange={handleUserDataChange}
                required
                size="lg"
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Notas adicionales sobre el usuario..."
                  value={userData.notes}
                  onChange={handleUserDataChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información sobre próximos pasos */}
          <Card className="bg-sky-50 border-sky-200">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-sky-900 mb-2">
                  📋 Próximos Pasos
                </h3>
                <p className="text-sky-700 text-sm mb-4">
                  Después de crear el usuario, podrás configurar sus servicios de forma sencilla e intuitiva
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-sky-600">
                  <span>✅ Horarios semanales</span>
                  <span>✅ Horas mensuales</span>
                  <span>✅ Predicción automática</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3">
            <Link href="/dashboard">
              <Button variant="secondary" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" loading={loading}>
              {loading ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}