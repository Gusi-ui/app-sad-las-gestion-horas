'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAssignments } from '@/hooks/useAssignments'
import { useWorkers } from '@/hooks/useWorkers'
import { useUsers } from '@/hooks/useUsers'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Save, X, AlertTriangle, Clock, Calendar, User, Users } from 'lucide-react'
import { WeekDay, AssignmentPriority, AssignmentStatus, Assignment } from '@/lib/types'

const weekDayOptions: { value: WeekDay; label: string }[] = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
]

export default function NewAssignmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const { createAssignment, checkDuplicateAssignment, suggestNewStartDate } = useAssignments()
  const { workers, getAvailableWorkers } = useWorkers()
  const { data: users } = useUsers()
  const { showToast, ToastComponent } = useToast()

  const [formData, setFormData] = useState({
    worker_id: '',
    user_id: '',
    assigned_hours_per_week: 4,
    start_date: '',
    end_date: '',
    priority: 2 as AssignmentPriority,
    status: 'active' as AssignmentStatus,
    notes: '',
    specific_schedule: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    } as Record<WeekDay, string[]>
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflicts, setConflicts] = useState<Assignment[]>([])

  const availableWorkers = getAvailableWorkers()
  const activeUsers = users?.filter(u => u.is_active) || []

  // Parse URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const workerId = urlParams.get('worker_id')
    const userId = urlParams.get('user_id')
    const assignedHours = urlParams.get('assigned_hours_per_week')
    const priority = urlParams.get('priority')
    const notes = urlParams.get('notes')
    const startDate = urlParams.get('start_date')

    if (workerId) setFormData(prev => ({ ...prev, worker_id: workerId }))
    if (userId) setFormData(prev => ({ ...prev, user_id: userId }))
    if (assignedHours) setFormData(prev => ({ ...prev, assigned_hours_per_week: parseInt(assignedHours) }))
    if (priority) setFormData(prev => ({ ...prev, priority: parseInt(priority) as AssignmentPriority }))
    if (notes) setFormData(prev => ({ ...prev, notes: notes }))
    if (startDate) setFormData(prev => ({ ...prev, start_date: startDate }))
  }, [])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleScheduleChange = (day: WeekDay, timeIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      specific_schedule: {
        ...prev.specific_schedule,
        [day]: prev.specific_schedule[day] 
          ? prev.specific_schedule[day].map((time, index) => 
              index === timeIndex ? value : time
            )
          : timeIndex === 0 ? [value, ''] : ['', value]
      }
    }))
  }

  const toggleDaySchedule = (day: WeekDay) => {
    setFormData(prev => ({
      ...prev,
      specific_schedule: {
        ...prev.specific_schedule,
        [day]: prev.specific_schedule[day] ? undefined : ['09:00', '11:00']
      }
    }))
  }

  const calculateTotalHours = () => {
    return Object.values(formData.specific_schedule).reduce((total, times) => {
      if (times && times.length >= 2 && times[0] && times[1]) {
        const start = new Date(`2000-01-01T${times[0]}:00`)
        const end = new Date(`2000-01-01T${times[1]}:00`)
        const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        return total + diffHours
      }
      return total
    }, 0)
  }

  useEffect(() => {
    const totalHours = calculateTotalHours()
    if (totalHours > 0 && totalHours !== formData.assigned_hours_per_week) {
      setFormData(prev => ({ ...prev, assigned_hours_per_week: totalHours }))
    }
  }, [formData.specific_schedule, formData.assigned_hours_per_week])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.worker_id) {
      newErrors.worker_id = 'Debe seleccionar una trabajadora'
    }

    if (!formData.user_id) {
      newErrors.user_id = 'Debe seleccionar un usuario'
    }

    if (formData.assigned_hours_per_week <= 0) {
      newErrors.assigned_hours_per_week = 'Debe asignar al menos 1 hora por semana'
    }

    if (formData.assigned_hours_per_week > 40) {
      newErrors.assigned_hours_per_week = 'No se pueden asignar más de 40 horas por semana'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La fecha de inicio es obligatoria'
    }

    if (formData.end_date && formData.end_date <= formData.start_date) {
      newErrors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio'
    }

    // Validate that at least one day has a schedule
    const hasSchedule = Object.values(formData.specific_schedule).some(times => 
      times && times.length >= 2 && times[0] && times[1]
    )
    
    if (!hasSchedule) {
      newErrors.specific_schedule = 'Debe configurar al menos un día de horario'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showToast('Por favor, corrige los errores del formulario', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      // Check for duplicate assignment first
      const duplicate = await checkDuplicateAssignment({
        worker_id: formData.worker_id,
        user_id: formData.user_id,
        start_date: formData.start_date
      })

      if (duplicate) {
        const suggestedDate = suggestNewStartDate(formData.start_date)
        showToast(
          `Ya existe una asignación para esta trabajadora, usuario y fecha de inicio. Sugerencia: Cambia la fecha de inicio a ${suggestedDate}`,
          'warning'
        )
        setIsSubmitting(false)
        return
      }

      const { error, conflicts } = await createAssignment({
        worker_id: formData.worker_id,
        user_id: formData.user_id,
        assigned_hours_per_week: formData.assigned_hours_per_week,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        priority: formData.priority,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
        specific_schedule: formData.specific_schedule
      })

      if (conflicts && conflicts.length > 0) {
        setConflicts(conflicts)
        const conflictDetails = conflicts.map(conflict => {
          const user = activeUsers.find(u => u.id === conflict.user_id)
          return `• ${user?.name} ${user?.surname} (${formatSchedule(conflict.specific_schedule)})`
        }).join('\n')
        
        showToast(
          `Se detectaron ${conflicts.length} conflicto(s) de horario:\n${conflictDetails}`, 
          'warning'
        )
        return
      }

      if (error) {
        showToast(`Error al crear asignación: ${error}`, 'error')
      } else {
        showToast('Asignación creada correctamente', 'success')
        router.push('/dashboard/planning')
      }
    } catch {
      showToast('Error inesperado al crear asignación', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedWorker = workers.find(w => w.id === formData.worker_id)
  const selectedUser = activeUsers.find(u => u.id === formData.user_id)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/assignments">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Asignaciones
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                🔄 Nueva Asignación
              </h1>
              <p className="text-slate-600">
                Asigna una trabajadora a un usuario con horario específico
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Worker and User Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Worker Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Seleccionar Trabajadora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <label htmlFor="worker_id" className="block text-sm font-medium text-slate-700 mb-2">
                  Trabajadora *
                </label>
                <select
                  id="worker_id"
                  name="worker_id"
                  value={formData.worker_id}
                  onChange={(e) => handleInputChange('worker_id', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.worker_id ? 'border-red-500' : 'border-slate-300'
                  }`}
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
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedWorker.specializations.map((spec) => (
                        <span key={spec} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Seleccionar Usuario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <label htmlFor="user_id" className="block text-sm font-medium text-slate-700 mb-2">
                  Usuario *
                </label>
                <select
                  id="user_id"
                  name="user_id"
                  value={formData.user_id}
                  onChange={(e) => handleInputChange('user_id', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.user_id ? 'border-red-500' : 'border-slate-300'
                  }`}
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
                    {selectedUser.notes && (
                      <p className="text-sm text-green-600 mt-1">{selectedUser.notes}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Assignment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Configuración de la Asignación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="assigned_hours_per_week" className="block text-sm font-medium text-slate-700 mb-2">
                    Horas por Semana *
                  </label>
                  <input
                    id="assigned_hours_per_week"
                    name="assigned_hours_per_week"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="40"
                    value={formData.assigned_hours_per_week || 0}
                    onChange={(e) => handleInputChange('assigned_hours_per_week', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.assigned_hours_per_week ? 'border-red-500' : 'border-slate-300'
                    }`}
                    readOnly
                  />
                  <p className="text-xs text-slate-500 mt-1">Se calcula automáticamente según el horario</p>
                  {errors.assigned_hours_per_week && (
                    <p className="text-red-500 text-xs mt-1">{errors.assigned_hours_per_week}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.start_date ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {errors.start_date && (
                    <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha de Fin (opcional)
                  </label>
                  <input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.end_date ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {errors.end_date && (
                    <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-2">
                  Prioridad
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value) as AssignmentPriority)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>🔴 Alta - Urgente</option>
                  <option value={2}>🟡 Media - Normal</option>
                  <option value={3}>🟢 Baja - Flexible</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Horario Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weekDayOptions.map((day) => {
                  const isActive = !!formData.specific_schedule[day.value]
                  const times = formData.specific_schedule[day.value] || ['', '']
                  
                  return (
                    <div key={day.value} className="flex items-center space-x-4">
                      <label className="flex items-center min-w-[120px]">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleDaySchedule(day.value)}
                          className="mr-2"
                        />
                        <span className="font-medium">{day.label}</span>
                      </label>
                      
                      {isActive && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={times[0] || ''}
                            onChange={(e) => handleScheduleChange(day.value, 0, e.target.value)}
                            className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span>a</span>
                          <input
                            type="time"
                            value={times[1] || ''}
                            onChange={(e) => handleScheduleChange(day.value, 1, e.target.value)}
                            className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {times[0] && times[1] && (
                            <span className="text-sm text-slate-600 ml-2">
                              ({((new Date(`2000-01-01T${times[1]}:00`).getTime() - 
                                   new Date(`2000-01-01T${times[0]}:00`).getTime()) / 
                                   (1000 * 60 * 60)).toFixed(1)}h)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {errors.specific_schedule && (
                <p className="text-red-500 text-xs mt-2">{errors.specific_schedule}</p>
              )}
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Total horas por semana: {formData.assigned_hours_per_week.toFixed(1)}h
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Conflicts Warning */}
          {conflicts.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">Conflictos Detectados</h3>
                    <p className="text-red-700 mb-3">
                      La trabajadora seleccionada ya tiene asignaciones en horarios similares:
                    </p>
                    <ul className="space-y-2">
                      {conflicts.map((conflict, index) => (
                        <li key={index} className="text-sm text-red-600">
                          • Usuario: {conflict.user?.name} - Horario: {formatSchedule(conflict.specific_schedule)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Notas y Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Instrucciones especiales, preferencias del usuario, observaciones importantes..."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/assignments">
              <Button type="button" variant="secondary">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isSubmitting || conflicts.length > 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creando...' : 'Crear Asignación'}
            </Button>
          </div>
        </form>
      </div>
      {ToastComponent}
    </div>
  )
}

const formatSchedule = (schedule?: Record<string, string[]>) => {
  if (!schedule) return 'Sin horario específico'
  
  const dayLabels: Record<string, string> = {
    monday: 'L',
    tuesday: 'M',
    wednesday: 'X',
    thursday: 'J',
    friday: 'V',
    saturday: 'S',
    sunday: 'D'
  }
  
  const activeDays = Object.entries(schedule)
    .filter(([_, times]) => times && times.length >= 2)
    .map(([day, times]) => `${dayLabels[day]} ${times[0]}-${times[1]}`)
  
  return activeDays.length > 0 ? activeDays.join(', ') : 'Sin horario específico'
} 