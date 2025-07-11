'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Calendar, Clock, User, Users, AlertTriangle } from 'lucide-react'

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
  worker_name: string
  worker_surname: string
  user_name: string
  user_surname: string
}

export default function EditAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    assignment_type: '',
    start_date: '',
    end_date: '',
    weekly_hours: 0,
    status: 'active',
    priority: 1
  })

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
        setFormData({
          assignment_type: data.assignment_type || '',
          start_date: data.start_date ? data.start_date.split('T')[0] : '',
          end_date: data.end_date ? data.end_date.split('T')[0] : '',
          weekly_hours: data.weekly_hours || 0,
          status: data.status || 'active',
          priority: data.priority || 1
        })
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      alert('Error inesperado: ' + JSON.stringify(error))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignment || !supabase) return

    setSaving(true)
    try {
      const updateData = {
        ...formData,
        end_date: formData.end_date || null
      }

      const { error } = await supabase
        .from('assignments')
        .update(updateData)
        .eq('id', assignment.id)

      if (error) {
        throw error
      }

      alert('Asignación actualizada correctamente')
      router.push(`/admin/assignments/${assignment.id}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert('Error al actualizar asignación: ' + errorMessage)
    } finally {
      setSaving(false)
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
          <Link href={`/admin/assignments/${assignment.id}`}>
            <Button variant="default" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Editar Asignación
            </h1>
            <p className="text-slate-600">Modificar asignación #{assignment.id.slice(0, 8)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
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
                <p className="text-xs text-slate-500 mt-1">El ID no se puede modificar</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Tipo de Asignación *</label>
                <select
                  value={formData.assignment_type}
                  onChange={(e) => handleInputChange('assignment_type', e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="regular">Regular</option>
                  <option value="temporary">Temporal</option>
                  <option value="emergency">Emergencia</option>
                  <option value="special">Especial</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                  <option value="suspended">Suspendida</option>
                  <option value="completed">Completada</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Prioridad</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 - Baja</option>
                  <option value={2}>2 - Media</option>
                  <option value={3}>3 - Alta</option>
                  <option value={4}>4 - Crítica</option>
                </select>
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
                <label className="text-sm font-medium text-slate-600">Fecha de Inicio *</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Fecha de Fin</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">Dejar vacío para asignación indefinida</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Horas Semanales *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.weekly_hours}
                  onChange={(e) => handleInputChange('weekly_hours', parseFloat(e.target.value) || 0)}
                  required
                />
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
                <p className="text-xs text-slate-500 mt-1">La trabajadora no se puede cambiar desde aquí</p>
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
                <p className="text-xs text-slate-500 mt-1">El usuario no se puede cambiar desde aquí</p>
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

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href={`/admin/assignments/${assignment.id}`}>
            <Button variant="default" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
} 