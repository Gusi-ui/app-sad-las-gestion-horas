'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, User, Mail, Phone, MapPin, Calendar, AlertTriangle, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

interface User {
  id: string
  name: string
  surname: string
  email: string
  is_active: boolean
  client_code: string
  phone: string
  address: string
  city: string
  postal_code: string
  emergency_contacts?: EmergencyContact[]
  created_at: string
  monthly_hours?: number
  special_requirements?: string[]
  dni?: string
  medical_conditions?: string[]
  allergies?: string[]
  medications?: string[]
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchUser(params.id as string)
    }
  }, [params.id])

  const fetchUser = async (userId: string) => {
    if (!supabase) {
      console.error('Supabase client no disponible')
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
        console.error('Error al cargar usuario:', error)
        alert('Error al cargar usuario: ' + JSON.stringify(error))
      } else {
        setUser(data)
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      alert('Error inesperado: ' + JSON.stringify(error))
    } finally {
      setLoading(false)
    }
  }

  // Helper para mostrar el nombre del día
  const getDayName = (day: string) => {
    const dayNames: { [key: string]: string } = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
    }
    return dayNames[day] || day
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando usuario...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Usuario no encontrado</h1>
          <p className="text-slate-600 mb-6">El usuario que buscas no existe o ha sido eliminado.</p>
          <Link href="/admin/users">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Usuarios
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Link href="/admin/users">
            <Button variant="default" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {user.name} {user.surname}
            </h1>
            <p className="text-slate-600">Detalles del usuario</p>
          </div>
        </div>
        <Link href={`/admin/users/${user.id}/edit`}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Edit className="w-4 h-4 mr-2" />
            Editar Usuario
          </Button>
        </Link>
      </div>

      {/* Servicio: Horas y Días */}
      <Card className="mb-8">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Calendar className="w-6 h-6 text-blue-600" />
            Servicio Asignado
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-8">
          <div className="flex flex-col items-center justify-center flex-1">
            <span className="text-5xl md:text-7xl font-extrabold text-blue-700 mb-2">{user.monthly_hours || 0}h</span>
            <span className="text-base text-slate-600">Horas mensuales asignadas</span>
          </div>
          <div className="flex-1">
            <div className="mb-2 text-slate-700 font-semibold">Días de servicio:</div>
            <div className="flex flex-wrap gap-2">
              {(user.special_requirements && user.special_requirements.length > 0)
                ? [
                    'monday','tuesday','wednesday','thursday','friday','saturday','sunday'
                  ].filter(day => (user.special_requirements ?? []).includes(day)).map(day => (
                    <Badge key={day} className="text-base px-4 py-2 bg-blue-100 text-blue-800 border border-blue-300 font-semibold">
                      {getDayName(day)}
                    </Badge>
                  ))
                : <span className="text-slate-400 italic">No hay días asignados</span>
              }
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Nombre</label>
                <p className="text-slate-900">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Apellidos</label>
                <p className="text-slate-900">{user.surname}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">DNI</label>
                <p className="text-slate-900">{user.dni || <span className="text-slate-400 italic">No registrado</span>}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Código de Cliente</label>
                <p className="text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded">{user.client_code}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Estado</label>
              <span className={user.is_active ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold' : 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold'}>
                {user.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Fecha de Registro</label>
              <p className="text-slate-900">
                {new Date(user.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
        {/* Información de Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Email</label>
              <p className="text-slate-900 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-slate-400" />
                {user.email}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Teléfono</label>
              <p className="text-slate-900 flex items-center">
                <Phone className="w-4 h-4 mr-2 text-slate-400" />
                {user.phone}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Dirección</label>
              <p className="text-slate-900 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                {user.address}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Ciudad</label>
                <p className="text-slate-900">{user.city}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Código Postal</label>
                <p className="text-slate-900">{user.postal_code}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Información Médica */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              Información Médica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Condiciones Médicas</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {user.medical_conditions && user.medical_conditions.length > 0
                  ? user.medical_conditions.map((cond, idx) => (
                      <Badge key={idx} className="bg-pink-100 text-pink-800 border border-pink-300 font-semibold px-3 py-1">
                        {cond}
                      </Badge>
                    ))
                  : <span className="text-slate-400 italic">Sin condiciones médicas</span>
                }
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Alergias</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {user.allergies && user.allergies.length > 0
                  ? user.allergies.map((allergy, idx) => (
                      <Badge key={idx} className="bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold px-3 py-1">
                        {allergy}
                      </Badge>
                    ))
                  : <span className="text-slate-400 italic">Sin alergias</span>
                }
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Medicamentos</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {user.medications && user.medications.length > 0
                  ? user.medications.map((med, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-800 border border-blue-300 font-semibold px-3 py-1">
                        {med}
                      </Badge>
                    ))
                  : <span className="text-slate-400 italic">Sin medicamentos</span>
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 