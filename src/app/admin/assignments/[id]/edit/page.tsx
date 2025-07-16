'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Zap } from 'lucide-react'
import { useNotificationHelpers } from '@/components/ui/toast-notification'
import { getHolidaysForYear } from '@/lib/holidayUtils'
import AssignmentHistoryCard from '@/components/AssignmentHistoryCard'

interface Assignment {
  id: string
  worker_id: string
  user_id: string
  assignment_type: string
  start_date: string
  end_date: string | null
  weekly_hours: number
  status: string
  schedule?: WeeklySchedule
}

interface Worker {
  id: string
  name: string
  surname: string
  email?: string
  is_active: boolean
}

interface User {
  id: string
  name: string
  surname: string
  email?: string
  is_active: boolean
}

interface TimeSlot {
  start: string
  end: string
}

interface DaySchedule {
  enabled: boolean
  timeSlots: TimeSlot[]
}

interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  holiday: DaySchedule;
}

interface FormData {
  worker_id: string
  user_id: string
  assignment_type: 'laborables' | 'festivos' | 'flexible'
  start_date: string
  end_date: string
  weekly_hours: number
  schedule: WeeklySchedule
  selectedTypes: {
    laborables: boolean
    festivos: boolean
    flexible: boolean
  }
}

const defaultDaySchedule: DaySchedule = {
  enabled: false,
  timeSlots: [{ start: '08:00', end: '09:00' }]
}

const defaultWeeklySchedule: WeeklySchedule = {
  monday: { ...defaultDaySchedule },
  tuesday: { ...defaultDaySchedule },
  wednesday: { ...defaultDaySchedule },
  thursday: { ...defaultDaySchedule },
  friday: { ...defaultDaySchedule },
  saturday: { ...defaultDaySchedule },
  sunday: { ...defaultDaySchedule },
  holiday: { ...defaultDaySchedule } // Festivos entre semana
}

export default function EditAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.id as string
  const { success, error: showError } = useNotificationHelpers()
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    worker_id: '',
    user_id: '',
    assignment_type: 'laborables',
    start_date: '',
    end_date: '',
    weekly_hours: 0,
    schedule: defaultWeeklySchedule,
    selectedTypes: {
      laborables: false,
      festivos: false,
      flexible: false
    }
  })

  useEffect(() => {
    if (assignmentId) {
      fetchData()
    }
  }, [assignmentId])

  // Calcular horas semanales automáticamente cuando cambia el horario
  useEffect(() => {
    const totalHours = calculateWeeklyHours(formData.schedule)
    setFormData(prev => ({ ...prev, weekly_hours: totalHours }))
  }, [formData.schedule])

  useEffect(() => {
    // Cargar festivos del año de la asignación
    if (formData.start_date) {
      const year = new Date(formData.start_date).getFullYear()
      getHolidaysForYear(year).then(festivos => {
        // setHolidays(festivos.map(f => f.date)) // Eliminado: holidays no se usa
      })
    }
  }, [formData.start_date])

  const fetchData = async () => {
    if (!supabase) {
      console.error('Supabase client no disponible')
      setLoading(false)
      return
    }

    try {
      // Fetch assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single()

      if (assignmentError) {
        console.error('Error al cargar asignación:', assignmentError)
        showError('Error al cargar asignación: ' + assignmentError.message)
        return
      }

      // Fetch workers
      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('id, name, surname, email, is_active')
        .eq('is_active', true)
        .order('name')

      if (workersError) {
        console.error('Error al cargar trabajadoras:', workersError)
        showError(`Error al cargar trabajadoras: ${workersError.message || 'Error desconocido'}`)
      }

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, surname, email, is_active')
        .eq('is_active', true)
        .order('name')

      if (usersError) {
        console.error('Error al cargar usuarios:', usersError)
        showError(`Error al cargar usuarios: ${usersError.message || 'Error desconocido'}`)
      }

      setAssignment(assignmentData)
      setWorkers(workersData || [])
      setUsers(usersData || [])
      
      // Set form data
      let schedule = assignmentData.schedule || defaultWeeklySchedule
      // Asegurar que holiday existe
      if (!schedule.holiday) {
        schedule = { ...schedule, holiday: { ...defaultDaySchedule } }
      }

      // Determinar los tipos seleccionados basándose en el tipo de asignación
      const selectedTypes = {
        laborables: assignmentData.assignment_type === 'laborables',
        festivos: assignmentData.assignment_type === 'festivos',
        flexible: assignmentData.assignment_type === 'flexible'
      }

      setFormData({
        worker_id: assignmentData.worker_id,
        user_id: assignmentData.user_id,
        assignment_type: assignmentData.assignment_type as 'laborables' | 'festivos' | 'flexible',
        start_date: assignmentData.start_date,
        end_date: assignmentData.end_date || '',
        weekly_hours: assignmentData.weekly_hours,
        schedule: schedule,
        selectedTypes: selectedTypes
      })
    } catch (error) {
      console.error('Error inesperado:', error)
      showError('Error inesperado al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const calculateWeeklyHours = (schedule: WeeklySchedule): number => {
    let totalHours = 0
    const days = Object.keys(schedule) as (keyof WeeklySchedule)[]
    
    days.forEach(day => {
      if (schedule[day].enabled) {
        schedule[day].timeSlots.forEach(slot => {
          try {
            const start = new Date(`2000-01-01T${slot.start}`)
            const end = new Date(`2000-01-01T${slot.end}`)
            
            // Verificar que las fechas son válidas
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              return
            }
            
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            
            // Verificar que las horas son válidas
            if (isNaN(hours) || hours < 0) {
              return
            }
            
            totalHours += hours
          } catch (error) {
            console.error(`Error al calcular horas para ${day}:`, error)
          }
        })
      }
    })
    
    // Verificar que el total es válido
    if (isNaN(totalHours)) {
      return 0
    }
    
    return Math.round(totalHours * 100) / 100 // Redondear a 2 decimales
  }

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAssignmentTypeChange = (type: 'laborables' | 'festivos' | 'flexible') => {
    setFormData(prev => {
      const newSelectedTypes = { ...prev.selectedTypes }
      newSelectedTypes[type] = !newSelectedTypes[type]
      
      const newFormData = { 
        ...prev, 
        selectedTypes: newSelectedTypes,
        assignment_type: type // Mantener el tipo principal para compatibilidad
      }
      
      return newFormData
    })
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.worker_id) {
      errors.push('Debe seleccionar una trabajadora')
    }

    if (!formData.user_id) {
      errors.push('Debe seleccionar un usuario')
    }

    if (!formData.start_date) {
      errors.push('Debe especificar una fecha de inicio')
    }

    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      errors.push('La fecha de fin no puede ser anterior a la fecha de inicio')
    }

    // Verificar que al menos un tipo de asignación esté seleccionado
    if (!formData.selectedTypes.laborables && !formData.selectedTypes.festivos && !formData.selectedTypes.flexible) {
      errors.push('Debe seleccionar al menos un tipo de asignación')
    }

    // Verificar que al menos un día tenga horario configurado
    const hasSchedule = Object.values(formData.schedule).some(day => day.enabled)
    if (!hasSchedule) {
      errors.push('Debe configurar al menos un día con horario')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      errors.forEach(error => showError(error))
      return
    }

    setSaving(true)

    try {
      if (!supabase) {
        throw new Error('Cliente Supabase no disponible')
      }

      const { data, error: supabaseError } = await supabase
        .from('assignments')
        .update({
          worker_id: formData.worker_id,
          user_id: formData.user_id,
          assignment_type: formData.assignment_type,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          weekly_hours: formData.weekly_hours,
          schedule: formData.schedule
        })
        .eq('id', assignmentId)
        .select()

      if (supabaseError) {
        throw new Error(`Error de base de datos: ${supabaseError.message} (${supabaseError.code})`)
      }

      if (!data || data.length === 0) {
        throw new Error('No se pudo actualizar la asignación')
      }

      success('Asignación actualizada correctamente')

      // Redirect to assignments list
      setTimeout(() => {
        router.push('/admin/assignments')
      }, 1500)

    } catch (error) {
      console.error('Error completo:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      showError(`Error al actualizar asignación: ${errorMessage}`)
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600 text-lg">Asignación no encontrada</p>
          <Link href="/admin/assignments">
            <Button className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              Volver a Asignaciones
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/admin/assignments">
            <Button className="border border-slate-300 hover:bg-slate-50 bg-white text-slate-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Editar Asignación
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">
              Modificar información de la asignación
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Assignment Details */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-slate-600" />
              Información de la Asignación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Worker Selection */}
              <div className="space-y-2">
                <label htmlFor="worker_id" className="text-sm font-medium text-slate-700">
                  Trabajadora *
                </label>
                <select
                  id="worker_id"
                  value={formData.worker_id}
                  onChange={(e) => handleInputChange('worker_id', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar trabajadora</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} {worker.surname} - {worker.is_active ? 'Activo' : 'Inactivo'}
                    </option>
                  ))}
                </select>
              </div>

              {/* User Selection */}
              <div className="space-y-2">
                <label htmlFor="user_id" className="text-sm font-medium text-slate-700">
                  Usuario *
                </label>
                <select
                  id="user_id"
                  value={formData.user_id}
                  onChange={(e) => handleInputChange('user_id', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar usuario</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.surname} - {user.is_active ? 'Activo' : 'Inactivo'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Type with Toggle Switches */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-slate-600" />
              Tipo de Asignación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Selecciona los tipos de asignación que deseas aplicar. Los cambios se reflejarán automáticamente en el horario semanal y el calendario:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Días Laborables */}
                <div
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${formData.selectedTypes.laborables 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                    }
                  `}
                  onClick={() => handleAssignmentTypeChange('laborables')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Días Laborables</h3>
                    {formData.selectedTypes.laborables && (
                      <span className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                        Seleccionado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    Horario de trabajo regular para la trabajadora.
                  </p>
                </div>
                {/* Festivos */}
                <div
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${formData.selectedTypes.festivos 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-slate-200 hover:border-slate-300'
                    }
                  `}
                  onClick={() => handleAssignmentTypeChange('festivos')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Festivos</h3>
                    {formData.selectedTypes.festivos && (
                      <span className="px-2 py-1 bg-purple-500 text-white rounded-full text-xs font-medium">
                        Seleccionado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    Días en los que la trabajadora no trabaja.
                  </p>
                </div>
                {/* Flexible */}
                <div
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${formData.selectedTypes.flexible 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-slate-200 hover:border-slate-300'
                    }
                  `}
                  onClick={() => handleAssignmentTypeChange('flexible')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Flexible</h3>
                    {formData.selectedTypes.flexible && (
                      <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                        Seleccionado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    Horario de trabajo que puede variar según las necesidades.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Weekly Schedule */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-slate-600" />
            Horario Semanal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Aquí puedes renderizar el horario semanal, por ejemplo, usando un componente o el propio formulario de días y tramos */}
        </CardContent>
      </Card>

      {/* Calendar Preview */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-slate-600" />
            Vista Previa del Calendario
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Aquí puedes renderizar el componente de calendario, por ejemplo: */}
          {/* <AssignmentCalendar ...props /> */}
        </CardContent>
      </Card>

      {/* Assignment History */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-slate-600" />
            Historial de Cambios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AssignmentHistoryCard assignmentId={assignmentId} />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  </div>
  );
}