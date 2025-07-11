'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Calendar, Clock, User, Users, AlertTriangle, Star } from 'lucide-react'

interface Assignment {
  id: string
  worker_id: string
  user_id: string
  assignment_type: string
  start_date: string
  end_date: string | null
  weekly_hours: number
  status: string
  priority: number
  created_at: string
  worker_name: string
  worker_surname: string
  user_name: string
  user_surname: string
}

export default function AssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchAssignment(params.id as string)
    }
  }, [params.id])

  const fetchAssignment = async (assignmentId: string) => {
    if (!supabase) {
      console.error('Supabase client no disponible')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          workers!inner(name, surname),
          users!inner(name, surname)
        `)
        .eq('id', assignmentId)
        .single()

      if (error) {
        console.error('Error al cargar asignación:', error)
        alert('Error al cargar asignación: ' + JSON.stringify(error))
      } else {
        const formattedData = {
          ...data,
          worker_name: data.workers?.name || '',
          worker_surname: data.workers?.surname || '',
          user_name: data.users?.name || '',
          user_surname: data.users?.surname || ''
        }
        setAssignment(formattedData)
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      alert('Error inesperado: ' + JSON.stringify(error))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando asignación...</p>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Asignación no encontrada</h1>
          <p className="text-slate-600 mb-6">La asignación que buscas no existe o ha sido eliminada.</p>
          <Link href="/admin/assignments">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Asignaciones
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
          <Link href="/admin/assignments">
            <Button variant="default" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Asignación #{assignment.id.slice(0, 8)}
            </h1>
            <p className="text-slate-600">Detalles de la asignación</p>
          </div>
        </div>
        <Link href={`/admin/assignments/${assignment.id}/edit`}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Edit className="w-4 h-4 mr-2" />
            Editar Asignación
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Información de la Asignación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Información de la Asignación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">ID de Asignación</label>
              <p className="text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded text-sm">
                {assignment.id}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Tipo de Asignación</label>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                {assignment.assignment_type}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Estado</label>
              <span className={assignment.status === 'active' ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold' : 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold'}>
                {assignment.status === 'active' ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Prioridad</label>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">
                {assignment.priority}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Fecha de Creación</label>
              <p className="text-slate-900">
                {new Date(assignment.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fechas y Horarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Fechas y Horarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Fecha de Inicio</label>
              <p className="text-slate-900">
                {new Date(assignment.start_date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Fecha de Fin</label>
              <p className="text-slate-900">
                {assignment.end_date 
                  ? new Date(assignment.end_date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Sin fecha de fin (indefinida)'
                }
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Horas Semanales</label>
              <p className="text-slate-900 font-semibold text-lg">
                {assignment.weekly_hours} horas/semana
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Duración Estimada</label>
              <p className="text-slate-900">
                {assignment.end_date 
                  ? `${Math.ceil((new Date(assignment.end_date).getTime() - new Date(assignment.start_date).getTime()) / (1000 * 60 * 60 * 24 * 7))} semanas`
                  : 'Duración indefinida'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trabajadora Asignada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Trabajadora Asignada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Nombre Completo</label>
              <p className="text-slate-900 font-medium">
                {assignment.worker_name} {assignment.worker_surname}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">ID de Trabajadora</label>
              <p className="text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded text-sm">
                {assignment.worker_id}
              </p>
            </div>

            <div className="pt-4">
              <Link href={`/admin/workers/${assignment.worker_id}`}>
                <Button variant="default" size="sm">
                  Ver Perfil de Trabajadora
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Usuario Asignado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Usuario Asignado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Nombre Completo</label>
              <p className="text-slate-900 font-medium">
                {assignment.user_name} {assignment.user_surname}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">ID de Usuario</label>
              <p className="text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded text-sm">
                {assignment.user_id}
              </p>
            </div>

            <div className="pt-4">
              <Link href={`/admin/users/${assignment.user_id}`}>
                <Button variant="default" size="sm">
                  Ver Perfil de Usuario
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 