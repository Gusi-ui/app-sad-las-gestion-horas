'use client'

import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Users, Calendar, Clock, Settings } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface AssignmentFormData {
  worker_id: string
  user_id: string
  assignment_type: 'regular' | 'holidays' | 'weekends' | 'temporary'
  start_date: string
  end_date: string
  weekly_hours: number
  schedule: any
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  priority: 1 | 2 | 3
  notes: string
}

interface Worker {
  id: string
  name: string
  surname: string
  email: string
  worker_type?: string
}

interface User {
  id: string
  name: string
  surname: string
  client_code?: string
}

export default function NewAssignmentPage() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [loading, setLoading] = useState(false)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [rlsError, setRlsError] = useState(false)

  const [formData, setFormData] = useState<AssignmentFormData>({
    worker_id: '',
    user_id: '',
    assignment_type: 'regular',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    weekly_hours: 0,
    schedule: {},
    status: 'active',
    priority: 2,
    notes: ''
  })

  // Cargar trabajadoras y usuarios
  useEffect(() => {
    const loadData = async () => {
      if (!supabase) {
        console.error('Supabase client no disponible')
        showToast('Error de configuración de base de datos', 'error')
        return
      }

      try {
        // Cargar trabajadoras - intentar con worker_type primero, si falla usar campos básicos
        const workersQuery = supabase
          .from('workers')
          .select('id, name, surname, email, worker_type')
          .eq('is_active', true)

        const { data: workersData, error: workersError } = await workersQuery

        if (workersError) {
          console.warn('Error al cargar trabajadoras con worker_type, intentando sin él:', workersError)
          // Intentar sin worker_type
          const { data: workersDataBasic, error: workersErrorBasic } = await supabase
            .from('workers')
            .select('id, name, surname, email')
            .eq('is_active', true)

          if (workersErrorBasic) {
            console.error('Error al cargar trabajadoras:', workersErrorBasic)
            
            // Verificar si es el error de recursión infinita
            if (workersErrorBasic.message && workersErrorBasic.message.includes('infinite recursion')) {
              showToast('Error de configuración de base de datos: Políticas RLS problemáticas. Contacta al administrador.', 'error')
              setRlsError(true)
            } else {
              showToast('Error al cargar trabajadoras', 'error')
            }
          } else {
            setWorkers(workersDataBasic || [])
          }
        } else {
          setWorkers(workersData || [])
        }

        // Cargar usuarios - intentar con client_code primero, si falla usar campos básicos
        const usersQuery = supabase
          .from('users')
          .select('id, name, surname, client_code')
          .eq('is_active', true)

        const { data: usersData, error: usersError } = await usersQuery

        if (usersError) {
          console.warn('Error al cargar usuarios con client_code, intentando sin él:', usersError)
          // Intentar sin client_code
          const { data: usersDataBasic, error: usersErrorBasic } = await supabase
            .from('users')
            .select('id, name, surname')
            .eq('is_active', true)

          if (usersErrorBasic) {
            console.error('Error al cargar usuarios:', usersErrorBasic)
            
            // Verificar si es el error de recursión infinita
            if (usersErrorBasic.message && usersErrorBasic.message.includes('infinite recursion')) {
              showToast('Error de configuración de base de datos: Políticas RLS problemáticas. Contacta al administrador.', 'error')
              setRlsError(true)
            } else {
              showToast('Error al cargar usuarios', 'error')
            }
          } else {
            setUsers(usersDataBasic || [])
          }
        } else {
          setUsers(usersData || [])
        }
      } catch (error) {
        console.error('Error inesperado al cargar datos:', error)
        showToast('Error inesperado al cargar datos', 'error')
      }
    }

    loadData()
  }, [showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!supabase) {
      console.error('Supabase client no disponible')
      showToast('Error de configuración de base de datos', 'error')
      setLoading(false)
      return
    }

    try {
      // Preparar datos para insertar - usar los campos correctos según el schema
      const assignmentData = {
        worker_id: formData.worker_id,
        user_id: formData.user_id,
        assignment_type: formData.assignment_type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        weekly_hours: formData.weekly_hours,
        schedule: formData.schedule,
        status: formData.status,
        priority: formData.priority,
        notes: formData.notes
      }

      const { data, error } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select()
        .single()

      if (error) {
        console.error('Error al crear asignación:', error)
        showToast(`Error al crear asignación: ${error.message}`, 'error')
        return
      }

      showToast('Asignación creada correctamente', 'success')
      router.push('/admin/assignments')
    } catch (error) {
      console.error('Error inesperado:', error)
      showToast('Error inesperado al crear asignación', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof AssignmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin/assignments">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Nueva Asignación
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Creando nueva asignación trabajadora-usuario
              </p>
            </div>
          </div>
        </div>

        {/* Error de RLS */}
        {rlsError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">
                    Error de Configuración de Base de Datos
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    Las políticas de seguridad (RLS) están causando un error de recursión infinita. 
                    Esto impide el acceso a los datos.
                  </p>
                  <div className="mt-3 text-sm text-red-700">
                    <p className="font-medium">Para solucionarlo:</p>
                    <ol className="mt-1 ml-4 list-decimal space-y-1">
                      <li>Ve al dashboard de Supabase</li>
                      <li>Navega a Authentication → Policies</li>
                      <li>Elimina las políticas problemáticas de las tablas</li>
                      <li>Crea políticas simples: "FOR ALL USING (true)"</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Selección de Trabajadora y Usuario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Selección de Personal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Trabajadora *
                  </label>
                  <select
                    required
                    value={formData.worker_id}
                    onChange={(e) => handleInputChange('worker_id', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar trabajadora</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} {worker.surname} {worker.worker_type ? `(${worker.worker_type})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Usuario/Cliente *
                  </label>
                  <select
                    required
                    value={formData.user_id}
                    onChange={(e) => handleInputChange('user_id', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar usuario</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.surname} {user.client_code ? `(${user.client_code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de la Asignación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-green-600" />
                  <span>Configuración</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de Asignación *
                  </label>
                  <select
                    required
                    value={formData.assignment_type}
                    onChange={(e) => handleInputChange('assignment_type', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="regular">Regular</option>
                    <option value="holidays">Festivos</option>
                    <option value="weekends">Fines de Semana</option>
                    <option value="temporary">Temporal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Horas Semanales *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.weekly_hours}
                    onChange={(e) => handleInputChange('weekly_hours', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>Alta</option>
                    <option value={2}>Media</option>
                    <option value={3}>Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Activa</option>
                    <option value="paused">Pausada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fechas */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <span>Período de Asignación</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Dejar vacío para indefinido"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horario Semanal */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span>Horario Semanal</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>La configuración detallada del horario se realizará después de crear la asignación</p>
                <p className="text-sm mt-2">Puedes editar el horario desde la página de asignaciones</p>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notas Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Información adicional sobre la asignación..."
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-4">
            <Link href="/admin/assignments">
              <Button variant="secondary" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Asignación'}
            </Button>
          </div>
        </form>

        {ToastComponent}
      </div>
    </div>
  )
} 