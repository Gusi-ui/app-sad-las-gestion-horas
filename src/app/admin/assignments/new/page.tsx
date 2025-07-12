'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { ArrowLeft, Save, Calendar, Clock, Users, AlertCircle, Plus, X } from 'lucide-react'
import ToastNotification from '@/components/ui/toast-notification'
import HolidayAwareCalendar from '@/components/HolidayAwareCalendar'
import AssignmentCalendar from '@/components/AssignmentCalendar'
import { getAvailableDaysForWorker, getBlockedDaysForWorker, type DayInfo } from '@/lib/holidayUtils'

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
    schedule: defaultWeeklySchedule
  })
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    isVisible: boolean
  }>({
    message: '',
    type: 'info',
    isVisible: false
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
        setToast({
          message: 'Error al cargar trabajadoras: ' + workersError.message,
          type: 'error',
          isVisible: true
        })
      }

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, surname, email, is_active')
        .eq('is_active', true)
        .order('name')

      if (usersError) {
        console.error('Error al cargar usuarios:', usersError)
        setToast({
          message: 'Error al cargar usuarios: ' + usersError.message,
          type: 'error',
          isVisible: true
        })
      }

      setWorkers(workersData || [])
      setUsers(usersData || [])
    } catch (error) {
      console.error('Error inesperado:', error)
      setToast({
        message: 'Error inesperado al cargar datos',
        type: 'error',
        isVisible: true
      })
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
              console.warn(`Horario inválido para ${day}: ${slot.start} - ${slot.end}`)
              return
            }
            
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            
            // Verificar que las horas son válidas
            if (isNaN(hours) || hours < 0) {
              console.warn(`Cálculo de horas inválido para ${day}: ${hours}`)
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
      console.warn('Total de horas es NaN, devolviendo 0')
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

  const handleAssignmentTypeChange = async (type: 'laborables' | 'festivos' | 'flexible') => {
    setFormData(prev => {
      const newSchedule = { ...defaultWeeklySchedule }
      
      if (type === 'laborables') {
        // Solo lunes a viernes, pero necesitamos verificar festivos
        newSchedule.monday.enabled = true
        newSchedule.tuesday.enabled = true
        newSchedule.wednesday.enabled = true
        newSchedule.thursday.enabled = true
        newSchedule.friday.enabled = true
        newSchedule.saturday.enabled = false
        newSchedule.sunday.enabled = false
        newSchedule.holiday.enabled = false // Reset holiday for laborables
      } else if (type === 'festivos') {
        // Solo sábado y domingo, más festivos
        newSchedule.monday.enabled = false
        newSchedule.tuesday.enabled = false
        newSchedule.wednesday.enabled = false
        newSchedule.thursday.enabled = false
        newSchedule.friday.enabled = false
        newSchedule.saturday.enabled = true
        newSchedule.sunday.enabled = true
        newSchedule.holiday.enabled = true // Enable holiday for festivos
      } else if (type === 'flexible') {
        // Todos los días
        newSchedule.monday.enabled = true
        newSchedule.tuesday.enabled = true
        newSchedule.wednesday.enabled = true
        newSchedule.thursday.enabled = true
        newSchedule.friday.enabled = true
        newSchedule.saturday.enabled = true
        newSchedule.sunday.enabled = true
        newSchedule.holiday.enabled = true // Enable holiday for flexible
      }
      
      return { ...prev, assignment_type: type, schedule: newSchedule }
    })

    // Verificar y ajustar días basado en festivos para el año actual
    await adjustScheduleForHolidays(type)
  }

  const adjustScheduleForHolidays = async (assignmentType: 'laborables' | 'festivos' | 'flexible') => {
    try {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      
      // Obtener días bloqueados para este tipo de trabajadora
      const blockedDays = await getBlockedDaysForWorker(assignmentType, currentYear, currentMonth)
      
      // Crear un nuevo horario basado en los días bloqueados
      setFormData(prev => {
        const newSchedule = { ...prev.schedule }
        
        // Para trabajadoras laborables, deshabilitar días que son festivos
        if (assignmentType === 'laborables') {
          blockedDays.forEach(day => {
            const dayName = getDayNameFromDate(day.date)
            if (dayName && newSchedule[dayName]) {
              // Solo deshabilitar si es un festivo que cae en día laborable (no fin de semana)
              if (day.isHoliday && !day.isWeekend) {
                newSchedule[dayName].enabled = false
              }
            }
          })
        }
        
        // Para trabajadoras festivas, habilitar días festivos entre semana
        if (assignmentType === 'festivos') {
          blockedDays.forEach(day => {
            const dayName = getDayNameFromDate(day.date)
            if (dayName && newSchedule[dayName]) {
              // Solo habilitar si es un festivo (no fin de semana)
              if (day.isHoliday && !day.isWeekend) {
                newSchedule[dayName].enabled = true
              }
            }
          })
        }
        
        return { ...prev, schedule: newSchedule }
      })
    } catch (error) {
      console.error('Error al ajustar horario para festivos:', error)
    }
  }

  const getDayNameFromDate = (dateString: string): keyof WeeklySchedule | null => {
    const date = new Date(dateString)
    const dayOfWeek = date.getDay()
    
    const dayMap: { [key: number]: keyof WeeklySchedule } = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    }
    
    return dayMap[dayOfWeek] || null
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
      errors.push('Debes seleccionar una trabajadora')
    }

    if (!formData.user_id) {
      errors.push('Debes seleccionar un usuario')
    }

    if (!formData.start_date) {
      errors.push('Debes especificar una fecha de inicio')
    }

    if (formData.weekly_hours <= 0) {
      errors.push('Debes configurar al menos un horario con horas válidas')
    }

    if (formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      errors.push('La fecha de fin debe ser posterior a la fecha de inicio')
    }

    // Validar que al menos un día esté habilitado
    const hasEnabledDays = Object.values(formData.schedule).some(day => day.enabled)
    if (!hasEnabledDays) {
      errors.push('Debes habilitar al menos un día de la semana')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      setToast({
        message: errors.join(', '),
        type: 'error',
        isVisible: true
      })
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

      setToast({
        message: 'Asignación creada correctamente',
        type: 'success',
        isVisible: true
      })

      // Redirect to assignments list
      setTimeout(() => {
        router.push('/admin/assignments')
      }, 1500)

    } catch (error) {
      console.error('Error completo:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setToast({
        message: `Error al crear asignación: ${errorMessage}`,
        type: 'error',
        isVisible: true
      })
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

              {/* Assignment Type */}
              <div className="space-y-2">
                <label htmlFor="assignment_type" className="text-sm font-medium text-slate-700">
                  Tipo de Asignación *
                </label>
                <select
                  id="assignment_type"
                  value={formData.assignment_type}
                  onChange={(e) => handleAssignmentTypeChange(e.target.value as 'laborables' | 'festivos' | 'flexible')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="laborables">Días Laborables (L-V, excluyendo festivos)</option>
                  <option value="festivos">Días Festivos (S-D + festivos entre semana)</option>
                  <option value="flexible">Asignación Flexible (Todos los días)</option>
                </select>
              </div>

              {/* Holiday Calendar Preview */}
              <div className="col-span-1 md:col-span-2">
                <AssignmentCalendar
                  schedule={formData.schedule}
                  assignmentType={formData.assignment_type}
                  startDate={formData.start_date || new Date().toISOString().split('T')[0]}
                  year={new Date().getFullYear()}
                  month={new Date().getMonth() + 1}
                  className="mt-4"
                />
              </div>

              {/* Weekly Hours (Read-only) */}
              <div className="space-y-2">
                <label htmlFor="weekly_hours" className="text-sm font-medium text-slate-700">
                  Horas Semanales (Calculadas automáticamente)
                </label>
                <Input
                  id="weekly_hours"
                  type="number"
                  value={isNaN(formData.weekly_hours) ? 0 : formData.weekly_hours}
                  className="border-slate-300 bg-slate-50 cursor-not-allowed"
                  readOnly
                />
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label htmlFor="start_date" className="text-sm font-medium text-slate-700">
                  Fecha de Inicio *
                </label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label htmlFor="end_date" className="text-sm font-medium text-slate-700">
                  Fecha de Fin (Opcional)
                </label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
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
              {formData.assignment_type === 'festivos' && (
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

      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  )
} 