'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { ArrowLeft, Save, Calendar, Clock, Zap, Plus, X } from 'lucide-react'
import { useNotificationHelpers } from '@/components/ui/toast-notification'
import AssignmentCalendar from '@/components/AssignmentCalendar'
import { getAvailableDaysForWorker, getBlockedDaysForWorker } from '@/lib/holidayUtils'

interface Worker {
  id: string
  name: string
  surname: string
  email: string
  is_active: boolean
}

interface User {
  id: string
  name: string
  surname: string
  email: string
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
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
  holiday: DaySchedule // Festivos entre semana
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

export default function NewAssignmentPage() {
  const router = useRouter()
  const { success, error: showError } = useNotificationHelpers()
  
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
    fetchData()
  }, [])

  // Calcular horas semanales automáticamente cuando cambia el horario
  useEffect(() => {
    const totalHours = calculateWeeklyHours(formData.schedule)
    setFormData(prev => ({ ...prev, weekly_hours: totalHours }))
  }, [formData.schedule])

  const fetchData = async () => {
    if (!supabase) {
      console.error('Supabase client no disponible')
      setLoading(false)
      return
    }

    try {
      // Fetch workers
      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('id, name, surname, email, is_active')
        .eq('is_active', true)
        .order('name')

      if (workersError) {
        console.error('Error al cargar trabajadoras:', workersError)
        showError('Error al cargar trabajadoras: ' + workersError.message)
      }

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, surname, email, is_active')
        .eq('is_active', true)
        .order('name')

      if (usersError) {
        console.error('Error al cargar usuarios:', usersError)
        showError('Error al cargar usuarios: ' + usersError.message)
      }

      setWorkers(workersData || [])
      setUsers(usersData || [])
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

  const handleAssignmentTypeChange = (type: string) => {
    if (type === 'laborables' || type === 'festivos' || type === 'flexible') {
      setFormData(prev => {
        const newSelectedTypes = { ...prev.selectedTypes }
        newSelectedTypes[type as keyof FormData['selectedTypes']] = !newSelectedTypes[type as keyof FormData['selectedTypes']]
        
        const newFormData = { 
          ...prev, 
          selectedTypes: newSelectedTypes,
          assignment_type: type as FormData['assignment_type'] // Mantener el tipo principal para compatibilidad
        }
        
        // Ajustar el horario según los tipos seleccionados
        adjustScheduleForSelectedTypes(newSelectedTypes)
        
        return newFormData
      })
    }
  }

  const adjustScheduleForSelectedTypes = async (selectedTypes: { laborables: boolean, festivos: boolean, flexible: boolean }) => {
    if (!formData.worker_id || !formData.start_date) return

    try {
      const startDate = new Date(formData.start_date)
      const year = startDate.getFullYear()
      const month = startDate.getMonth() + 1

      // Obtener días disponibles para la trabajadora
      // const availableDays = await getAvailableDaysForWorker(formData.worker_id, year, month)
      // const blockedDays = await getBlockedDaysForWorker(formData.worker_id, year, month)

      setFormData(prev => {
        const newSchedule = { ...prev.schedule }

        // Si ningún tipo está seleccionado, deshabilitar todos los días
        if (!selectedTypes.laborables && !selectedTypes.festivos && !selectedTypes.flexible) {
          newSchedule.monday.enabled = false
          newSchedule.tuesday.enabled = false
          newSchedule.wednesday.enabled = false
          newSchedule.thursday.enabled = false
          newSchedule.friday.enabled = false
          newSchedule.saturday.enabled = false
          newSchedule.sunday.enabled = false
          newSchedule.holiday.enabled = false
        } else {
          // Configurar según los tipos seleccionados
          if (selectedTypes.laborables) {
            // Habilitar días laborables (L-V)
            newSchedule.monday.enabled = true
            newSchedule.tuesday.enabled = true
            newSchedule.wednesday.enabled = true
            newSchedule.thursday.enabled = true
            newSchedule.friday.enabled = true
          }

          if (selectedTypes.festivos) {
            // Habilitar fines de semana y festivos
            newSchedule.saturday.enabled = true
            newSchedule.sunday.enabled = true
            newSchedule.holiday.enabled = true
          }

          if (selectedTypes.flexible) {
            // Habilitar todos los días (sobrescribe las configuraciones anteriores)
            newSchedule.monday.enabled = true
            newSchedule.tuesday.enabled = true
            newSchedule.wednesday.enabled = true
            newSchedule.thursday.enabled = true
            newSchedule.friday.enabled = true
            newSchedule.saturday.enabled = true
            newSchedule.sunday.enabled = true
            newSchedule.holiday.enabled = true
          }
        }

        return { ...prev, schedule: newSchedule }
      })

    } catch (error) {
      console.error('Error al ajustar horario para tipos seleccionados:', error)
    }
  }

  const toggleDayEnabled = (day: keyof WeeklySchedule) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          enabled: !prev.schedule[day].enabled
        }
      }
    }))
  }

  const updateTimeSlot = (day: keyof WeeklySchedule, slotIndex: number, field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          timeSlots: prev.schedule[day].timeSlots.map((slot, index) =>
            index === slotIndex ? { ...slot, [field]: value } : slot
          )
        }
      }
    }))
  }

  const addTimeSlot = (day: keyof WeeklySchedule) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          timeSlots: [...prev.schedule[day].timeSlots, { start: '08:00', end: '09:00' }]
        }
      }
    }))
  }

  const removeTimeSlot = (day: keyof WeeklySchedule, slotIndex: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          timeSlots: prev.schedule[day].timeSlots.filter((_, index) => index !== slotIndex)
        }
      }
    }))
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

    // Verificar que al menos un día esté habilitado
    const hasEnabledDay = Object.values(formData.schedule).some(day => day.enabled)
    if (!hasEnabledDay) {
      errors.push('Debe habilitar al menos un día en el horario')
    }

        // Verificar que los días habilitados tengan horarios válidos
        Object.entries(formData.schedule).forEach(([day, daySchedule]) => {
          if (daySchedule.enabled) {
            daySchedule.timeSlots.forEach((slot: TimeSlot, index: number) => {
              if (!slot.start || !slot.end) {
                errors.push(`El tramo ${index + 1} del ${day} no tiene horario completo`)
              }
            })
          }
        })

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
      
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          worker_id: formData.worker_id,
          user_id: formData.user_id,
          assignment_type: formData.assignment_type,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          weekly_hours: formData.weekly_hours,
          schedule: formData.schedule,
          status: 'active',
          priority: 2
        })
        .select()

      if (error) {
        throw new Error(`Error de base de datos: ${error.message} (${error.code})`)
      }

      if (!data || data.length === 0) {
        throw new Error('No se pudo crear la asignación')
      }

      success('Asignación creada correctamente')

      // Redirect to assignments list
      setTimeout(() => {
        router.push('/admin/assignments')
      }, 1500)

    } catch (error) {
      console.error('Error completo:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      showError(`Error al crear asignación: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const dayNames = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando datos...</p>
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
              Nueva Asignación
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">
              Crear una nueva asignación de trabajadora a usuario
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
                <div className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                  ${formData.selectedTypes.laborables 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                  }
                `} onClick={() => handleAssignmentTypeChange('laborables')}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Días Laborables</h3>
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${formData.selectedTypes.laborables 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-slate-300'
                      }
                    `}>
                      {formData.selectedTypes.laborables && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">Lunes a Viernes, excluyendo festivos</p>
                </div>

                {/* Días Festivos */}
                <div className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                  ${formData.selectedTypes.festivos 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-slate-200 hover:border-slate-300'
                  }
                `} onClick={() => handleAssignmentTypeChange('festivos')}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Días Festivos</h3>
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${formData.selectedTypes.festivos 
                        ? 'border-purple-500 bg-purple-500' 
                        : 'border-slate-300'
                      }
                    `}>
                      {formData.selectedTypes.festivos && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">Sábados, domingos y festivos entre semana</p>
                </div>

                {/* Asignación Flexible */}
                <div className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                  ${formData.selectedTypes.flexible 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-slate-200 hover:border-slate-300'
                  }
                `} onClick={() => handleAssignmentTypeChange('flexible')}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Asignación Flexible</h3>
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${formData.selectedTypes.flexible 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-slate-300'
                      }
                    `}>
                      {formData.selectedTypes.flexible && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">Todos los días de la semana</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Hours and Dates */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Hours Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-blue-900">
                <Clock className="w-5 h-5 mr-2" />
                Horas Semanales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-900 mb-2">
                  {isNaN(formData.weekly_hours) ? 0 : formData.weekly_hours}
                </div>
                <p className="text-sm text-blue-700">horas calculadas automáticamente</p>
              </div>
            </CardContent>
          </Card>

          {/* Start Date */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-slate-900">
                <Calendar className="w-5 h-5 mr-2" />
                Fecha de Inicio *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-lg py-3"
                required
              />
            </CardContent>
          </Card>

          {/* End Date */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-slate-900">
                <Calendar className="w-5 h-5 mr-2" />
                Fecha de Fin (Opcional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-lg py-3"
              />
            </CardContent>
          </Card>
        </div>

        {/* Holiday Calendar Preview */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-slate-600" />
              Vista Previa del Calendario
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <AssignmentCalendar
              schedule={formData.schedule}
              assignmentType={formData.assignment_type}
              startDate={formData.start_date || new Date().toISOString().split('T')[0]}
              year={new Date().getFullYear()}
              month={new Date().getMonth() + 1}
              className="mt-4"
            />
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-slate-600" />
              Horario Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Object.entries(dayNames).map(([dayKey, dayName]) => {
                const day = dayKey as keyof WeeklySchedule
                const daySchedule = formData.schedule[day]
                
                return (
                  <div key={day} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`enable_${day}`}
                          checked={daySchedule.enabled}
                          onChange={() => toggleDayEnabled(day)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`enable_${day}`} className="text-sm font-medium text-slate-700">
                          {dayName}
                        </label>
                      </div>
                      {daySchedule.enabled && (
                        <Button
                          type="button"
                          onClick={() => addTimeSlot(day)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Añadir Tramo
                        </Button>
                      )}
                    </div>
                    
                    {daySchedule.enabled && (
                      <div className="space-y-2">
                        {daySchedule.timeSlots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(day, slotIndex, 'start', e.target.value)}
                              className="w-24 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-slate-500">-</span>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(day, slotIndex, 'end', e.target.value)}
                              className="w-24 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            {daySchedule.timeSlots.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeTimeSlot(day, slotIndex)}
                                className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {(formData.selectedTypes.festivos || formData.selectedTypes.flexible) && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="mb-2 font-semibold text-blue-700">Festivos entre semana</div>
                  <div className="text-xs text-blue-600 mb-2">Puedes definir un horario especial para los festivos que caen entre lunes y viernes. Este horario se aplicará automáticamente a todos los festivos entre semana.</div>
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      id="enable_holiday"
                      checked={formData.schedule.holiday?.enabled || false}
                      onChange={() => toggleDayEnabled('holiday')}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="enable_holiday" className="text-sm font-medium text-slate-700">
                      Habilitar horario para festivos entre semana
                    </label>
                  </div>
                  {formData.schedule.holiday?.enabled && (
                    <div className="space-y-2">
                      {formData.schedule.holiday.timeSlots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center space-x-2">
                          <Input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot('holiday', slotIndex, 'start', e.target.value)}
                            className="w-24 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-slate-500">-</span>
                          <Input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot('holiday', slotIndex, 'end', e.target.value)}
                            className="w-24 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          {formData.schedule.holiday.timeSlots.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeTimeSlot('holiday', slotIndex)}
                              className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => addTimeSlot('holiday')}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Añadir Tramo
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Crear Asignación
              </>
            )}
          </Button>
        </div>
      </form>

      {/* ToastNotification is now managed by useNotificationHelpers */}
    </div>
  )
} 