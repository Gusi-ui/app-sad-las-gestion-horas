'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, User, Mail, Phone, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Worker {
  id: string
  name: string
  surname: string
  email: string
  phone: string
  dni?: string
  address?: string
  street_address?: string
  postal_code?: string
  city?: string
  province?: string
  worker_type: string
  hourly_rate: number
  is_active: boolean
  employee_code: string
  specializations: string[]
  availability_days: string[]
  created_at: string
}

export default function WorkerDetailPage() {
  const params = useParams()
  const [worker, setWorker] = useState<Worker | null>(null)
  const [loading, setLoading] = useState(true)
  const [monthlyHours, setMonthlyHours] = useState<number | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchWorker(params.id as string)
      fetchMonthlyHours(params.id as string)
    }
  }, [params.id])

  const formatAddress = (worker: Worker) => {
    if (worker.street_address && worker.city) {
      const parts = [worker.street_address]
      if (worker.postal_code) parts.push(worker.postal_code)
      parts.push(worker.city)
      if (worker.province && worker.province !== 'Barcelona') parts.push(worker.province)
      return parts.join(', ')
    }
    return worker.address || ''
  }

  const fetchWorker = async (workerId: string) => {
    if (!supabase) {
      console.error('Supabase client no disponible')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('id', workerId)
        .single()

      if (error) {
        console.error('Error al cargar trabajadora:', error)
        alert('Error al cargar trabajadora: ' + JSON.stringify(error))
      } else {
        setWorker(data)
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      alert('Error inesperado: ' + JSON.stringify(error))
    } finally {
      setLoading(false)
    }
  }

  // Fetch de horas mensuales planificadas para el mes actual
  const fetchMonthlyHours = async (workerId: string) => {
    if (!supabase) return
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const { data, error } = await supabase
      .from('monthly_plans')
      .select('planned_hours')
      .eq('worker_id', workerId)
      .eq('month', month)
      .eq('year', year)
      .single()
    if (!error && data && typeof data.planned_hours === 'number') {
      setMonthlyHours(data.planned_hours)
    } else {
      setMonthlyHours(null)
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
          <p className="mt-4 text-slate-600">Cargando trabajadora...</p>
        </div>
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-16 h-16 text-red-500 mx-auto mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Trabajadora no encontrada</h1>
          <p className="text-slate-600 mb-6">La trabajadora que buscas no existe o ha sido eliminada.</p>
          <Link href="/admin/workers">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Trabajadoras
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center">
          <Link href="/admin/workers">
            <Button variant="default" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {worker.name} {worker.surname}
            </h1>
            <p className="text-slate-600">Detalles de la trabajadora</p>
          </div>
        </div>
        <Link href={`/admin/workers/${worker.id}/edit`}>
          <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <Edit className="w-4 h-4 mr-2" />
            Editar Trabajadora
          </Button>
        </Link>
      </div>

      {/* Información Laboral destacada */}
      <Card className="mb-8">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Clock className="w-6 h-6 text-purple-600" />
            Información Laboral
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-8">
          <div className="flex-1 mb-6 md:mb-0">
            <div className="mb-2 text-slate-700 font-semibold">Horas mensuales planificadas:</div>
            <div className="flex items-end gap-2">
              <span className="text-5xl md:text-6xl font-extrabold text-purple-700">{monthlyHours !== null ? monthlyHours : '--'}</span>
              <span className="text-base text-slate-600 mb-1">h</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">(Según planning mensual actual)</div>
          </div>
          <div className="flex-1">
            <div className="mb-2 text-slate-700 font-semibold">Tipo de trabajadora:</div>
            <div className="mb-4">
              <Badge className="text-base px-4 py-2 bg-blue-100 text-blue-800 border border-blue-300 font-semibold">
                {worker.worker_type === 'regular' ? 'Laborables' : 
                 worker.worker_type === 'holidays' ? 'Festivos' : 
                 worker.worker_type === 'weekends' ? 'Fines de semana' : 
                 worker.worker_type === 'flexible' ? 'Flexible' : worker.worker_type}
              </Badge>
            </div>
            <div className="mb-2 text-slate-700 font-semibold">Días de disponibilidad:</div>
            <div className="flex flex-wrap gap-2">
              {(worker.availability_days && worker.availability_days.length > 0)
                ? [
                    'monday','tuesday','wednesday','thursday','friday','saturday','sunday'
                  ].filter(day => worker.availability_days.includes(day)).map(day => (
                    <Badge key={day} className="text-base px-4 py-2 bg-green-100 text-green-800 border border-green-300 font-semibold">
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
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
            <CardTitle className="flex items-center text-blue-900">
              <User className="w-5 h-5 mr-2" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Nombre</label>
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 px-3 py-2 rounded-md">
                  <p className="text-slate-900 font-semibold">{worker.name}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Apellidos</label>
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 px-3 py-2 rounded-md">
                  <p className="text-slate-900 font-semibold">{worker.surname}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Código de Empleada</label>
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 px-3 py-2 rounded-md">
                  <p className="text-slate-900 font-mono text-sm font-semibold">{worker.employee_code}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">DNI</label>
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 px-3 py-2 rounded-md">
                  <p className="text-slate-900 font-mono text-sm font-semibold">{worker.dni || <span className='text-slate-400 italic'>No registrado</span>}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Estado</label>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${worker.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-semibold ${worker.is_active ? 'text-green-700' : 'text-red-700'}`}>
                  {worker.is_active ? 'Trabajadora activa' : 'Trabajadora inactiva'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Fecha de Registro</label>
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 px-3 py-2 rounded-md">
                <p className="text-slate-900 font-semibold">
                  {new Date(worker.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Contacto */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
            <CardTitle className="flex items-center text-green-900">
              <Mail className="w-5 h-5 mr-2" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 px-3 py-2 rounded-md">
                <p className="text-slate-900 flex items-center font-semibold">
                  <Mail className="w-4 h-4 mr-2 text-slate-500" />
                  {worker.email}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Teléfono</label>
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 px-3 py-2 rounded-md">
                <p className="text-slate-900 flex items-center font-semibold">
                  <Phone className="w-4 h-4 mr-2 text-slate-500" />
                  {worker.phone}
                </p>
              </div>
            </div>

            {(worker.street_address || worker.address) && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Dirección</label>
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 px-3 py-2 rounded-md">
                  <p className="text-slate-900 flex items-start font-semibold">
                    <svg className="w-4 h-4 mr-2 mt-0.5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="leading-relaxed">{formatAddress(worker)}</span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


      </div>
    </div>
  )
} 