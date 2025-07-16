'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkers } from '@/hooks/useWorkers'
import { useUsers } from '@/hooks/useUsers'
import { Assignment, WeekDay, AssignmentPriority, AssignmentStatus } from '@/lib/types'
import { WeeklyScheduleFormV2 } from './WeeklyScheduleFormV2'

interface AssignmentFormProps {
  assignment?: Assignment | null
  isEditing?: boolean
  onSubmit: (data: AssignmentFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  userId?: string
  workerId?: string
}

interface TimeSlot {
  id: string
  start: string
  end: string
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
  specific_schedule: Record<WeekDay, TimeSlot[]>
}

// Añadir tipo local compatible para edición
interface AssignmentFormCompatible {
  worker_id: string
  user_id: string
  assigned_hours_per_week: number
  start_date: string
  end_date?: string
  priority: AssignmentPriority
  status: AssignmentStatus
  notes?: string
  specific_schedule: Record<string, string[]>;
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
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, TimeSlot[]>>({})
  const [totalHours, setTotalHours] = useState(0)

  const availableWorkers = getAvailableWorkers()
  const activeUsers = users?.filter(u => u.is_active) || []

  // Cargar datos de la asignación si estamos editando
  useEffect(() => {
    if (assignment && isEditing) {
      // Forzar conversión segura
      const a = assignment as unknown as AssignmentFormCompatible;
      setFormData({
        worker_id: a.worker_id,
        user_id: a.user_id,
        assigned_hours_per_week: a.assigned_hours_per_week,
        start_date: a.start_date,
        end_date: a.end_date || '',
        priority: a.priority,
        status: a.status,
        notes: a.notes || '',
        specific_schedule: {
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: []
        } as Record<WeekDay, TimeSlot[]>
      })

      // Convertir el specific_schedule al nuevo formato
      const newSchedule: Record<string, TimeSlot[]> = {}
      if (a && a.specific_schedule) {
        Object.entries(a.specific_schedule).forEach(([day, timeData]) => {
          if (Array.isArray(timeData) && timeData.length > 0 && typeof timeData[0] === 'string') {
            const slots: TimeSlot[] = [];
            for (let i = 0; i < timeData.length - 1; i += 2) {
              if (typeof timeData[i] === 'string' && typeof timeData[i+1] === 'string') {
                slots.push({
                  id: `${day}-${i/2}`,
                  start: timeData[i],
                  end: timeData[i+1]
                });
              }
            }
            newSchedule[day] = slots;
          } else if (Array.isArray(timeData) && timeData.length > 0 && typeof timeData[0] === 'object') {
            newSchedule[day] = timeData as unknown as TimeSlot[];
          } else {
            newSchedule[day] = [];
          }
        });
      }
      // Asegurar que todos los días existen en el objeto
      ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].forEach(day => {
        if (!newSchedule[day]) newSchedule[day] = []
      })
      setWeeklySchedule(newSchedule)

      // Calcular horas totales
      const total = Object.values(newSchedule).reduce((sum, slots) => {
        return sum + slots.reduce((daySum, slot) => {
          const [startHour, startMinute] = slot.start.split(':').map(Number)
          const [endHour, endMinute] = slot.end.split(':').map(Number)
          const startTime = startHour + startMinute / 60
          const endTime = endHour + endMinute / 60
          const duration = endTime - startTime
          return daySum + Math.max(0, duration)
        }, 0)
      }, 0)
      setTotalHours(Math.round(total * 4.3))
    }
  }, [assignment, isEditing])

  // Sincronizar weeklySchedule con formData
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      assigned_hours_per_week: Object.values(weeklySchedule).reduce((sum, slots) => {
        return sum + slots.reduce((daySum, slot) => {
          const [startHour, startMinute] = slot.start.split(':').map(Number)
          const [endHour, endMinute] = slot.end.split(':').map(Number)
          const startTime = startHour + startMinute / 60
          const endTime = endHour + endMinute / 60
          const duration = endTime - startTime
          return daySum + Math.max(0, duration)
        }, 0)
      }, 0),
      specific_schedule: weeklySchedule as Record<WeekDay, TimeSlot[]>
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
    // Validar que al menos un día tenga horarios
    const hasSchedules = Object.values(weeklySchedule).some(slots => slots.length > 0)
    if (!hasSchedules) {
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
                          <div className="mt-3 p-3 bg-primary-50 rounded-lg">
          <p className="text-sm font-medium text-primary-900">Información de la trabajadora:</p>
          <p className="text-sm text-primary-700">
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

          {/* Horario Semanal Detallado */}
          <WeeklyScheduleFormV2
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
              className="bg-primary-600 hover:bg-primary-700"
            >
              {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Asignación')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}