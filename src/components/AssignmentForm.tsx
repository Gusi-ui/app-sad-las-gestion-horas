'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkers } from '@/hooks/useWorkers'
import { useUsers } from '@/hooks/useUsers'
import { Assignment, WeekDay, AssignmentPriority, AssignmentStatus } from '@/lib/types'
import { WeeklyScheduleForm } from './WeeklyScheduleForm'

interface AssignmentFormProps {
  assignment?: Assignment | null
  isEditing?: boolean
  onSubmit: (data: AssignmentFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  userId?: string
  workerId?: string
}

export interface AssignmentFormData {
  worker_id: string
  user_id: string
  assigned_hours_per_week: number
  start_date: string
  end_date?: string
  priority: AssignmentPriority
  status: AssignmentStatus
  notes?: string
  specific_schedule: Record<WeekDay, string[]>
}

export function AssignmentForm({ 
  assignment, 
  isEditing = false, 
  onSubmit, 
  onCancel, 
  loading = false,
  userId,
  workerId
}: AssignmentFormProps) {
  const { workers, getAvailableWorkers } = useWorkers()
  const { data: users } = useUsers()
  
  const [formData, setFormData] = useState<AssignmentFormData>({
    worker_id: workerId || '',
    user_id: userId || '',
    assigned_hours_per_week: 0,
    start_date: '',
    end_date: '',
    priority: 2,
    status: 'active',
    notes: '',
    specific_schedule: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [weeklySchedule, setWeeklySchedule] = useState<{ day_of_week: number; hours: number }[]>([])
  const [totalHours, setTotalHours] = useState(0)

  const availableWorkers = getAvailableWorkers()
  const activeUsers = users?.filter(u => u.is_active) || []

  // Cargar datos de la asignación si estamos editando
  useEffect(() => {
    if (assignment && isEditing) {
      setFormData({
        worker_id: assignment.worker_id,
        user_id: assignment.user_id,
        assigned_hours_per_week: assignment.assigned_hours_per_week,
        start_date: assignment.start_date,
        end_date: assignment.end_date || '',
        priority: assignment.priority,
        status: assignment.status,
        notes: assignment.notes || '',
        specific_schedule: assignment.specific_schedule || {
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: []
        }
      })
      // Convertir el specific_schedule a weeklySchedule
      const newWeekly: { day_of_week: number; hours: number }[] = []
      if (assignment.specific_schedule) {
        Object.entries(assignment.specific_schedule).forEach(([day, times]) => {
          if (times && times.length === 2) {
            // Calcular horas entre start y end
            const [start, end] = times
            const [h1, m1] = start.split(':').map(Number)
            const [h2, m2] = end.split(':').map(Number)
            const hours = (h2 + m2/60) - (h1 + m1/60)
            if (hours > 0) {
              // Mapear day string a número (0=domingo, 1=lunes...)
              const dayMap: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }
              newWeekly.push({ day_of_week: dayMap[day], hours })
            }
          }
        })
      }
      setWeeklySchedule(newWeekly)
      setTotalHours(Math.round(newWeekly.reduce((acc, d) => acc + d.hours, 0) * 4.3))
    }
  }, [assignment, isEditing])

  // Sincronizar weeklySchedule y totalHours con formData
  useEffect(() => {
    // Mapear weeklySchedule a specific_schedule formato antiguo
    const dayMap: Record<number, string> = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' }
    const newSpecific: Record<WeekDay, string[]> = {
      monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
    }
    weeklySchedule.forEach(({ day_of_week, hours }) => {
      // Convertir horas a bloque 08:00-XX:00 (simple, para compatibilidad)
      // Si ya hay un bloque, sobrescribir
      if (hours > 0) {
        const start = '08:00'
        const endHour = 8 + hours
        const end = `${endHour.toString().padStart(2, '0')}:00`
        newSpecific[dayMap[day_of_week] as WeekDay] = [start, end]
      }
    })
    setFormData(prev => ({
      ...prev,
      assigned_hours_per_week: weeklySchedule.reduce((acc, d) => acc + d.hours, 0),
      specific_schedule: newSpecific
    }))
  }, [weeklySchedule])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.worker_id) {
      newErrors.worker_id = 'Debe seleccionar una trabajadora'
    }
    if (!formData.user_id) {
      newErrors.user_id = 'Debe seleccionar un usuario'
    }
    if (!formData.start_date) {
      newErrors.start_date = 'La fecha de inicio es obligatoria'
    }
    if (formData.end_date && formData.end_date <= formData.start_date) {
      newErrors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio'
    }
    // Validar que al menos un día tenga horas > 0
    if (weeklySchedule.length === 0) {
      newErrors.schedule = 'Debe configurar al menos un día de horario'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    await onSubmit(formData)
  }

  const selectedWorker = workers.find(w => w.id === formData.worker_id)
  const selectedUser = activeUsers.find(u => u.id === formData.user_id)

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {isEditing ? 'Editar Asignación' : 'Nueva Asignación'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Modifica los datos de la asignación' : 'Crea una nueva asignación de trabajadora a usuario'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de Trabajadora y Usuario */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trabajadora */}
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Trabajadora</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={formData.worker_id}
                  onChange={(e) => handleInputChange('worker_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.worker_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isEditing}
                >
                  <option value="">Selecciona una trabajadora...</option>
                  {availableWorkers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} {worker.surname} - {worker.hourly_rate}€/h
                    </option>
                  ))}
                </select>
                {errors.worker_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.worker_id}</p>
                )}
                
                {selectedWorker && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Información de la trabajadora:</p>
                    <p className="text-sm text-blue-700">
                      Tarifa: {selectedWorker.hourly_rate}€/h • 
                      Máx: {selectedWorker.max_weekly_hours}h/semana
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usuario */}
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Usuario</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={formData.user_id}
                  onChange={(e) => handleInputChange('user_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.user_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isEditing}
                >
                  <option value="">Selecciona un usuario...</option>
                  {activeUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.surname} - {user.monthly_hours || 0}h/mes
                    </option>
                  ))}
                </select>
                {errors.user_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.user_id}</p>
                )}
                
                {selectedUser && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Información del usuario:</p>
                    <p className="text-sm text-green-700">
                      Teléfono: {selectedUser.phone} • 
                      Horas/mes: {selectedUser.monthly_hours || 0}h
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Configuración de la Asignación */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de la Asignación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.start_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.start_date && (
                    <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin (opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.end_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.end_date && (
                    <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>🔴 Alta - Urgente</option>
                    <option value={2}>🟡 Media - Normal</option>
                    <option value={3}>🟢 Baja - Flexible</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horario Semanal */}
          <WeeklyScheduleForm
            value={weeklySchedule}
            onChange={setWeeklySchedule}
            totalHours={totalHours}
            onTotalHoursChange={setTotalHours}
          />

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle>Notas y Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Instrucciones especiales, preferencias del usuario, observaciones importantes..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Asignación')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}