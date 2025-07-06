'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModalCustom } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Edit, Trash2, Clock, Save, X } from 'lucide-react'

interface User {
  id: string
  name: string
  surname: string
  phone: string
  address: string | null
  monthly_hours: number
  is_active: boolean
}

interface Worker {
  id: string
  name: string
  surname: string
  email: string
  worker_type: string
  is_active: boolean
}

interface Assignment {
  id: string
  user_id: string
  worker_id: string
  assigned_hours_per_week: number
  specific_schedule: Record<string, string[]>
  start_date: string
  status: string
  created_at: string
  workers: Worker
}

interface AssignmentForm {
  worker_id: string
  assigned_hours_per_week: number
  specific_schedule: Record<string, string[]>
  start_date: string
  status: string
}

export default function UserAssignmentsPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { showToast, ToastComponent } = useToast()
  
  const [user, setUser] = useState<User | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [formData, setFormData] = useState<AssignmentForm>({
    worker_id: '',
    assigned_hours_per_week: 0,
    specific_schedule: {},
    start_date: new Date().toISOString().split('T')[0],
    status: 'active'
  })

  const daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ]

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      if (!supabase) {
        showToast('Error de configuración: Supabase no está configurado', 'error')
        return
      }
      
      // Obtener usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('Error fetching user:', userError)
        showToast('Error al cargar usuario', 'error')
        return
      }

      setUser(userData)

      // Obtener trabajadoras activas
      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (workersError) {
        console.error('Error fetching workers:', workersError)
        showToast('Error al cargar trabajadoras', 'error')
        return
      }

      setWorkers(workersData || [])

      // Obtener asignaciones del usuario
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          workers(*)
        `)
        .eq('user_id', userId)
        .order('created_at')

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError)
        showToast('Error al cargar asignaciones', 'error')
        return
      }

      setAssignments(assignmentsData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      showToast('Error inesperado al cargar datos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (assignment?: Assignment) => {
    if (assignment) {
      setEditingAssignment(assignment)
      setFormData({
        worker_id: assignment.worker_id,
        assigned_hours_per_week: assignment.assigned_hours_per_week,
        specific_schedule: assignment.specific_schedule || {},
        start_date: assignment.start_date,
        status: assignment.status
      })
    } else {
      setEditingAssignment(null)
      setFormData({
        worker_id: '',
        assigned_hours_per_week: 0,
        specific_schedule: {},
        start_date: new Date().toISOString().split('T')[0],
        status: 'active'
      })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingAssignment(null)
  }

  const handleSave = async () => {
    try {
      if (!formData.worker_id) {
        showToast('Por favor selecciona una trabajadora', 'error')
        return
      }

      // Verificar que al menos un día tenga horarios configurados
      const hasSchedules = daysOfWeek.some(day => 
        (formData.specific_schedule[day.key] || []).length > 0
      )

      if (!hasSchedules) {
        showToast('Por favor configura al menos un horario para un día de la semana', 'error')
        return
      }

      // Calcular horas por semana automáticamente
      const calculatedHoursPerWeek = daysOfWeek.reduce((total, day) => {
        const slots = formData.specific_schedule[day.key] || []
        const dayHours = slots.reduce((dayTotal, slot) => {
          const [start, end] = slot.split('-')
          if (start && end) {
            const startTime = new Date(`2000-01-01T${start}`)
            const endTime = new Date(`2000-01-01T${end}`)
            const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
            return dayTotal + hours
          }
          return dayTotal
        }, 0)
        return total + dayHours
      }, 0)

      if (calculatedHoursPerWeek <= 0) {
        showToast('Por favor configura horarios válidos', 'error')
        return
      }

      if (!supabase) {
        showToast('Error de configuración: Supabase no está configurado', 'error')
        return
      }

      const assignmentData = {
        user_id: userId,
        worker_id: formData.worker_id,
        assigned_hours_per_week: calculatedHoursPerWeek,
        specific_schedule: formData.specific_schedule,
        start_date: formData.start_date,
        status: formData.status
      }

      if (editingAssignment) {
        // Actualizar asignación existente
        const { error } = await supabase
          .from('assignments')
          .update(assignmentData)
          .eq('id', editingAssignment.id)

        if (error) {
          console.error('Error updating assignment:', error)
          showToast('Error al actualizar asignación', 'error')
          return
        }

        showToast('Asignación actualizada correctamente', 'success')
      } else {
        // Crear nueva asignación
        const { error } = await supabase
          .from('assignments')
          .insert([assignmentData])

        if (error) {
          console.error('Error creating assignment:', error)
          showToast('Error al crear asignación', 'error')
          return
        }

        showToast('Asignación creada correctamente', 'success')
      }

      closeModal()
      fetchData()
    } catch (error) {
      console.error('Error saving assignment:', error)
      showToast('Error inesperado al guardar asignación', 'error')
    }
  }

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta asignación?')) {
      return
    }

    try {
      if (!supabase) {
        showToast('Error de configuración: Supabase no está configurado', 'error')
        return
      }

      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) {
        console.error('Error deleting assignment:', error)
        showToast('Error al eliminar asignación', 'error')
        return
      }

      showToast('Asignación eliminada correctamente', 'success')
      fetchData()
    } catch (error) {
      console.error('Error deleting assignment:', error)
      showToast('Error inesperado al eliminar asignación', 'error')
    }
  }

  const updateSchedule = (day: string, timeSlots: string[]) => {
    setFormData(prev => ({
      ...prev,
      specific_schedule: {
        ...prev.specific_schedule,
        [day]: timeSlots
      }
    }))
  }

  const addTimeSlot = (day: string) => {
    const currentSlots = formData.specific_schedule[day] || []
    updateSchedule(day, [...currentSlots, '08:00-09:00'])
  }

  const removeTimeSlot = (day: string, index: number) => {
    const currentSlots = formData.specific_schedule[day] || []
    const newSlots = currentSlots.filter((_, i) => i !== index)
    updateSchedule(day, newSlots)
  }

  const updateTimeSlot = (day: string, index: number, value: string) => {
    const currentSlots = formData.specific_schedule[day] || []
    const newSlots = [...currentSlots]
    newSlots[index] = value
    updateSchedule(day, newSlots)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Usuario no encontrado</p>
            <Link href="/dashboard/users">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/users">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Asignaciones de {user.name} {user.surname}
                </h1>
                <p className="text-sm text-slate-600">
                  Gestiona las asignaciones de trabajadoras para este usuario
                </p>
              </div>
            </div>
            <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Asignación
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Información del usuario */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-medium text-slate-900">Usuario</h3>
                <p className="text-slate-600">{user.name} {user.surname}</p>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Teléfono</h3>
                <p className="text-slate-600">{user.phone}</p>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Horas Mensuales</h3>
                <p className="text-slate-600">{user.monthly_hours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de asignaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Asignaciones ({assignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">
                  <Clock className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No hay asignaciones
                </h3>
                <p className="text-slate-600 mb-4">
                  Crea la primera asignación para este usuario
                </p>
                <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Asignación
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="border border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div>
                              <h4 className="font-medium text-slate-900">
                                {assignment.workers.name} {assignment.workers.surname}
                              </h4>
                              <p className="text-sm text-slate-600">
                                {assignment.workers.worker_type === 'laborable' ? 'Trabajadora laborable' : 
                                 assignment.workers.worker_type === 'holiday_weekend' ? 'Trabajadora festivos/fines de semana' : 
                                 'Trabajadora mixta'}
                              </p>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-blue-600">
                                {assignment.assigned_hours_per_week}h
                              </div>
                              <div className="text-xs text-slate-500">por semana</div>
                            </div>
                            <div>
                              <div className="text-sm text-slate-600">
                                Estado: <span className={`font-medium ${
                                  assignment.status === 'active' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {assignment.status === 'active' ? 'Activa' : 'Inactiva'}
                                </span>
                              </div>
                              <div className="text-sm text-slate-600">
                                Desde: {new Date(assignment.start_date).toLocaleDateString('es-ES')}
                              </div>
                            </div>
                          </div>
                          
                          {/* Horario específico */}
                          {assignment.specific_schedule && Object.keys(assignment.specific_schedule).length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-slate-700 mb-2">Horario:</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {daysOfWeek.map(day => {
                                  const slots = assignment.specific_schedule[day.key]
                                  if (!slots || slots.length === 0) return null
                                  
                                  return (
                                    <div key={day.key} className="text-xs">
                                      <span className="font-medium text-slate-600">{day.label}:</span>
                                      <div className="text-slate-500">
                                        {slots.join(', ')}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => openModal(assignment)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleDelete(assignment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para crear/editar asignación */}
      <ModalCustom isOpen={modalOpen} onClose={closeModal}>
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {editingAssignment ? 'Editar Asignación' : 'Nueva Asignación'}
            </h2>
            <Button variant="secondary" size="sm" onClick={closeModal}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Trabajadora */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trabajadora *
              </label>
              <select
                value={formData.worker_id}
                onChange={(e) => setFormData(prev => ({ ...prev, worker_id: e.target.value }))}
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar trabajadora</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} {worker.surname} ({worker.worker_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha de inicio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de inicio *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </div>

            {/* Horario específico */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-4">
                Horario específico por día *
              </label>
              <div className="space-y-4">
                {daysOfWeek.map(day => (
                  <div key={day.key} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-700">{day.label}</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => addTimeSlot(day.key)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Añadir horario
                      </Button>
                    </div>
                    
                    {(formData.specific_schedule[day.key] || []).map((slot, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={slot}
                          onChange={(e) => updateTimeSlot(day.key, index, e.target.value)}
                          placeholder="08:00-09:00"
                          className="flex-1 p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => removeTimeSlot(day.key, index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {(formData.specific_schedule[day.key] || []).length === 0 && (
                      <p className="text-sm text-slate-500 italic">
                        No hay horarios configurados para este día
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de horas calculadas */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Resumen de horas por semana</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {daysOfWeek.map(day => {
                  const slots = formData.specific_schedule[day.key] || []
                  const totalHours = slots.reduce((total, slot) => {
                    const [start, end] = slot.split('-')
                    if (start && end) {
                      const startTime = new Date(`2000-01-01T${start}`)
                      const endTime = new Date(`2000-01-01T${end}`)
                      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
                      return total + hours
                    }
                    return total
                  }, 0)
                  
                  return (
                    <div key={day.key} className="text-center">
                      <div className="text-sm font-medium text-blue-700">{day.label}</div>
                      <div className="text-lg font-semibold text-blue-900">
                        {totalHours > 0 ? `${totalHours.toFixed(1)}h` : '0h'}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-900">Total semanal:</span>
                  <span className="text-lg font-bold text-blue-900">
                    {(() => {
                      const totalWeekly = daysOfWeek.reduce((total, day) => {
                        const slots = formData.specific_schedule[day.key] || []
                        const dayHours = slots.reduce((dayTotal, slot) => {
                          const [start, end] = slot.split('-')
                          if (start && end) {
                            const startTime = new Date(`2000-01-01T${start}`)
                            const endTime = new Date(`2000-01-01T${end}`)
                            const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
                            return dayTotal + hours
                          }
                          return dayTotal
                        }, 0)
                        return total + dayHours
                      }, 0)
                      return `${totalWeekly.toFixed(1)}h`
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200">
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {editingAssignment ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </ModalCustom>

      {ToastComponent}
    </div>
  )
} 