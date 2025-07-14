'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  UserPlus, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  User,
  Calendar,
  Users,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useNotificationHelpers } from '@/components/ui/toast-notification'

interface Assignment {
  id: string
  worker_id: string
  user_id: string
  weekly_hours: number
  status: string
  start_date: string
  end_date?: string
  assignment_type?: string
  schedule?: any
  worker: {
    id: string
    name: string
    surname: string
    worker_type: string
  }
  user: {
    id: string
    name: string
    surname: string
    client_code: string
  }
}

interface Worker {
  id: string
  name: string
  surname: string
  worker_type: string
  is_active: boolean
  max_weekly_hours: number
  current_weekly_hours?: number
}

export default function ReassignAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string
  const { success, error: showError, warning } = useNotificationHelpers()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([])
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [reassigning, setReassigning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [changeReason, setChangeReason] = useState('')

  useEffect(() => {
    loadAssignment()
    loadAvailableWorkers()
  }, [assignmentId])

  const loadAssignment = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          worker_id,
          user_id,
          weekly_hours,
          status,
          start_date,
          end_date,
          assignment_type,
          schedule,
          worker:workers(id, name, surname, worker_type, is_active),
          user:users(id, name, surname, client_code, is_active)
        `)
        .eq('id', assignmentId)
        .single()

      if (error) throw error
      setAssignment(data)
    } catch (error) {
      console.error('Error al cargar la asignación:', error)
    }
  }

  const loadAvailableWorkers = async () => {
    try {
      // Cargar trabajadoras activas
      const { data: workers, error } = await supabase
        .from('workers')
        .select('id, name, surname, worker_type, is_active, max_weekly_hours')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      // Calcular horas semanales actuales de cada trabajadora
      const workersWithHours = await Promise.all(
        workers.map(async (worker) => {
          const { data: assignments } = await supabase
            .from('assignments')
            .select('weekly_hours')
            .eq('worker_id', worker.id)
            .eq('status', 'active')

          const currentHours = assignments?.reduce((sum, a) => sum + a.weekly_hours, 0) || 0
          return {
            ...worker,
            current_weekly_hours: currentHours
          }
        })
      )

      setAvailableWorkers(workersWithHours)
    } catch (error) {
      console.error('Error al cargar trabajadoras:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReassign = async () => {
    if (!selectedWorkerId || !assignment) return

    setReassigning(true)
    try {
      // 1. Actualizar la asignación con la nueva trabajadora
      const { error: updateError } = await supabase
        .from('assignments')
        .update({ worker_id: selectedWorkerId })
        .eq('id', assignmentId)

      if (updateError) throw updateError

      // 2. Registrar la reasignación en el historial
      const { error: historyError } = await supabase
        .from('assignment_history')
        .insert({
          assignment_id: assignmentId,
          previous_worker_id: assignment.worker_id,
          new_worker_id: selectedWorkerId,
          changed_by: (await supabase.auth.getUser()).data.user?.id || '',
          change_reason: changeReason || 'Reasignación de trabajadora'
        })

      if (historyError) {
        console.warn('Error al registrar historial:', historyError)
        warning('Reasignación exitosa', 'No se pudo registrar en el historial')
      } else {
        success(
          'Reasignación exitosa', 
          `Asignación reasignada de ${assignment.worker.name} ${assignment.worker.surname} a ${availableWorkers.find(w => w.id === selectedWorkerId)?.name} ${availableWorkers.find(w => w.id === selectedWorkerId)?.surname}`
        )
      }

      // 3. Redirigir al planning
      setTimeout(() => {
        router.push('/admin/planning?reassigned=true')
      }, 1500)
    } catch (error) {
      console.error('Error al reasignar:', error)
      showError('Error al reasignar', 'No se pudo completar la reasignación')
    } finally {
      setReassigning(false)
    }
  }

  const filteredWorkers = availableWorkers.filter(worker => 
    worker.id !== assignment?.worker_id && // Excluir la trabajadora actual
    (worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     worker.surname.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedWorker = availableWorkers.find(w => w.id === selectedWorkerId)
  const canAssign = selectedWorker && 
    (selectedWorker.current_weekly_hours + (assignment?.weekly_hours || 0)) <= selectedWorker.max_weekly_hours

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Asignación no encontrada</h2>
              <p className="text-slate-600 mb-4">La asignación que buscas no existe o ha sido eliminada.</p>
              <Link href="/admin/planning">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Planning
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Reasignar Servicio
              </h1>
              <p className="text-slate-600">
                Transferir asignación a otra trabajadora
              </p>
            </div>
            <Link href="/admin/planning">
              <Button variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Planning
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información de la asignación actual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Asignación Actual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">
                    {assignment.worker.name} {assignment.worker.surname}
                  </p>
                  <p className="text-sm text-slate-500">{assignment.worker.worker_type}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">
                    {assignment.user.name} {assignment.user.surname}
                  </p>
                  <p className="text-sm text-slate-500">{assignment.user.client_code}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">{assignment.weekly_hours}h/semana</p>
                  <p className="text-sm text-slate-500">
                    {assignment.assignment_type === 'festivos' ? 'Servicio de festivos' : 'Servicio laborable'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  <strong>Fecha de inicio:</strong> {new Date(assignment.start_date).toLocaleDateString('es-ES')}
                </p>
                {assignment.end_date && (
                  <p className="text-sm text-slate-600">
                    <strong>Fecha de fin:</strong> {new Date(assignment.end_date).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selección de nueva trabajadora */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-purple-600" />
                Seleccionar Nueva Trabajadora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Buscar trabajadora
                </label>
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredWorkers.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No se encontraron trabajadoras disponibles</p>
                ) : (
                  filteredWorkers.map(worker => (
                    <div
                      key={worker.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedWorkerId === worker.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedWorkerId(worker.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {worker.name} {worker.surname}
                          </p>
                          <p className="text-sm text-slate-500">{worker.worker_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">
                            {worker.current_weekly_hours}h / {worker.max_weekly_hours}h
                          </p>
                          <p className="text-xs text-slate-500">horas semanales</p>
                        </div>
                      </div>
                      
                      {selectedWorkerId === worker.id && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center space-x-2">
                            <ArrowRight className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-purple-600 font-medium">
                              Nueva carga: {worker.current_weekly_hours + assignment.weekly_hours}h/semana
                            </span>
                          </div>
                          {!canAssign && (
                            <div className="flex items-center space-x-2 mt-1">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-red-600">
                                Excede el límite de horas semanales
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {selectedWorker && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-slate-900">
                      Trabajadora seleccionada: {selectedWorker.name} {selectedWorker.surname}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Motivo del cambio (opcional)
                    </label>
                    <Input
                      placeholder="Ej: Disponibilidad, preferencia del usuario, etc."
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                    />
                  </div>
                  
                  <Button
                    onClick={handleReassign}
                    disabled={!canAssign || reassigning}
                    className="w-full"
                  >
                    {reassigning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Reasignando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Confirmar Reasignación
                      </>
                    )}
                  </Button>

                  {!canAssign && (
                    <p className="text-sm text-red-600 mt-2 text-center">
                      Esta trabajadora no puede asumir más horas semanales
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 