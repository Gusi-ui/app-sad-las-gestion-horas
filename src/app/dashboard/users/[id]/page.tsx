'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Edit, Phone, MapPin, Clock, User, Calendar, FileText, Users } from 'lucide-react'

interface User {
  id: string
  name: string
  surname: string
  phone: string
  address: string | null
  notes: string | null
  is_active: boolean
  monthly_hours: number
  created_at: string
  updated_at: string
}

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { showToast, ToastComponent } = useToast()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    if (!userId || !supabase) {
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        showToast('Error al cargar usuario', 'error')
        router.push('/dashboard/users')
        return
      }

      setUser(data)
    } catch {
      showToast('Error inesperado al cargar usuario', 'error')
      router.push('/dashboard/users')
    } finally {
      setLoading(false)
    }
  }, [userId, router, showToast])

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId, fetchUser])

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    }
    return phone
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando usuario...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600">Usuario no encontrado</p>
          <Link href="/dashboard/users">
            <Button className="mt-4">Volver a Usuarios</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header sticky mobile-first */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center py-4">
            <Button variant="secondary" size="sm" onClick={() => router.back()} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
            <h1 className="text-xl font-bold text-slate-900 truncate flex-1">Detalle de Usuario</h1>
            <Link href={`/dashboard/users/${user.id}/edit`}>
              <Button variant="secondary" size="sm" className="ml-2">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos Personales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Datos Personales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <p className="text-gray-900 font-medium">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellidos
                    </label>
                    <p className="text-gray-900 font-medium">{user.surname}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <div className="flex items-center text-gray-900">
                    <Phone className="w-4 h-4 mr-2 text-blue-600" />
                    {formatPhone(user.phone)}
                  </div>
                </div>

                {user.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <div className="flex items-start text-gray-900">
                      <MapPin className="w-4 h-4 mr-2 text-green-600 mt-0.5" />
                      <span>{user.address}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuración del Servicio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Configuración del Servicio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-blue-600 mb-1">Horas Mensuales Asignadas</div>
                    <div className="text-4xl font-bold text-blue-900">
                      {user.monthly_hours}
                      <span className="text-2xl text-blue-700">h</span>
                    </div>
                    <div className="text-sm text-blue-600">por mes</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado del Usuario
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? '✅ Activo' : '❌ Inactivo'}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {user.is_active 
                      ? 'El usuario puede recibir asignaciones de trabajadoras'
                      : 'El usuario está inactivo y no recibirá asignaciones'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notas */}
            {user.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Notas y Observaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{user.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Información del Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Información del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID del Usuario
                  </label>
                  <p className="text-sm text-gray-600 font-mono">{user.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Creación
                  </label>
                  <p className="text-sm text-gray-600">{formatDate(user.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Última Actualización
                  </label>
                  <p className="text-sm text-gray-600">{formatDate(user.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/dashboard/users/${user.id}/edit`}>
                  <Button variant="secondary" className="w-full justify-start">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Usuario
                  </Button>
                </Link>
                <Link href="/dashboard/assignments/new">
                  <Button variant="secondary" className="w-full justify-start">
                    <Clock className="w-4 h-4 mr-2" />
                    Crear Asignación
                  </Button>
                </Link>
                <Link href="/dashboard/users">
                  <Button variant="secondary" className="w-full justify-start">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Usuarios
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {ToastComponent}
      {/* Footer de navegación fijo */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
        <nav className="flex justify-around py-3">
          <Link href="/dashboard/users" className="flex flex-col items-center text-xs text-slate-600 hover:text-blue-600 transition-colors">
            <User className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Usuarios</span>
          </Link>
          <Link href="/dashboard/workers" className="flex flex-col items-center text-xs text-slate-600 hover:text-green-600 transition-colors">
            <Users className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Trabajadoras</span>
          </Link>
          <Link href="/dashboard/assignments" className="flex flex-col items-center text-xs text-slate-600 hover:text-purple-600 transition-colors">
            <Clock className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Asignaciones</span>
          </Link>
          <Link href="/dashboard/planning" className="flex flex-col items-center text-xs text-blue-600 transition-colors">
            <Calendar className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Planning</span>
          </Link>
          <Link href="/dashboard/settings" className="flex flex-col items-center text-xs text-slate-600 hover:text-slate-800 transition-colors">
            <FileText className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Configuración</span>
          </Link>
        </nav>
      </footer>
      <div className="h-20"></div>
    </div>
  )
}
