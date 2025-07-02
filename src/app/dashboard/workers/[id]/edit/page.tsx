'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkers } from '@/hooks/useWorkers'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Save, X, AlertTriangle, Users, User, Clock, Calendar, Settings } from 'lucide-react'
import { Worker, WorkerSpecialization, WeekDay } from '@/lib/types'
import { supabase } from '@/lib/supabase'

const specializationOptions: { value: WorkerSpecialization; label: string }[] = [
  { value: 'elderly_care', label: '👴 Cuidado Personas Mayores' },
  { value: 'disability_care', label: '♿ Cuidado Discapacidad' },
  { value: 'medical_assistance', label: '🏥 Asistencia Médica' },
  { value: 'companionship', label: '🤝 Acompañamiento' }
]

const weekDayOptions: { value: WeekDay; label: string }[] = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
]

export default function EditWorkerPage() {
  const params = useParams()
  const router = useRouter()
  const workerId = params.id as string
  const { updateWorker, getWorkerById } = useWorkers()
  const { showToast, ToastComponent } = useToast()

  const [worker, setWorker] = useState<Worker | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    email: '',
    address: '',
    dni: '',
    social_security_number: '',
    hire_date: '',
    hourly_rate: 15.00,
    max_weekly_hours: 40,
    specializations: [] as WorkerSpecialization[],
    availability_days: [] as WeekDay[],
    notes: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)
        
        const { data, error } = await getWorkerById(workerId)
        
        if (error) {
          throw new Error(error)
        }
        
        if (data) {
          setWorker(data)
          setFormData({
            name: data.name,
            surname: data.surname,
            phone: data.phone,
            email: data.email || '',
            address: data.address || '',
            dni: data.dni || '',
            social_security_number: data.social_security_number || '',
            hire_date: data.hire_date,
            hourly_rate: data.hourly_rate,
            max_weekly_hours: data.max_weekly_hours,
            specializations: [...data.specializations],
            availability_days: [...data.availability_days],
            notes: data.notes || '',
            emergency_contact_name: data.emergency_contact_name || '',
            emergency_contact_phone: data.emergency_contact_phone || '',
            is_active: data.is_active
          })
        }
      } catch (err) {
        console.error('Error fetching worker:', err)
        setLoadError(err instanceof Error ? err.message : 'Error al cargar trabajadora')
      } finally {
        setIsLoading(false)
      }
    }

    if (workerId) {
      fetchWorker()
    }
  }, [workerId, getWorkerById])

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\s/g, '')
    const phoneRegex = /^[679]\d{8}$/
    return phoneRegex.test(cleanPhone)
  }

  const formatPhone = (phone: string): string => {
    const clean = phone.replace(/\D/g, '')
    if (clean.length <= 3) return clean
    if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`
  }

  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/
    return name.length >= 2 && name.length <= 50 && nameRegex.test(name) && !name.includes('  ')
  }

  const validateDNI = (dni: string): boolean => {
    if (!dni) return true // DNI is optional
    const dniRegex = /^\d{8}[A-Za-z]$/
    return dniRegex.test(dni)
  }

  const validateEmail = (email: string): boolean => {
    if (!email) return true // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio'
    } else if (!validateName(formData.name)) {
      newErrors.name = 'Nombre inválido (solo letras, 2-50 caracteres, sin dobles espacios)'
    }

    if (!formData.surname.trim()) {
      newErrors.surname = 'Los apellidos son obligatorios'
    } else if (!validateName(formData.surname)) {
      newErrors.surname = 'Apellidos inválidos (solo letras, 2-100 caracteres, sin dobles espacios)'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Teléfono inválido (9 dígitos, debe empezar por 6, 7 o 9)'
    }

    // Optional but validated fields
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (formData.dni && !validateDNI(formData.dni)) {
      newErrors.dni = 'DNI inválido (formato: 12345678A)'
    }

    if (formData.hourly_rate < 10 || formData.hourly_rate > 50) {
      newErrors.hourly_rate = 'Tarifa debe estar entre 10€ y 50€'
    }

    if (formData.max_weekly_hours < 1 || formData.max_weekly_hours > 40) {
      newErrors.max_weekly_hours = 'Horas semanales deben estar entre 1 y 40'
    }

    if (formData.specializations.length === 0) {
      newErrors.specializations = 'Debe seleccionar al menos una especialización'
    }

    if (formData.availability_days.length === 0) {
      newErrors.availability_days = 'Debe seleccionar al menos un día de disponibilidad'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    if (formatted.replace(/\s/g, '').length <= 9) {
      handleInputChange('phone', formatted)
    }
  }

  const handleSpecializationToggle = (spec: WorkerSpecialization) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }))
  }

  const handleAvailabilityToggle = (day: WeekDay) => {
    setFormData(prev => ({
      ...prev,
      availability_days: prev.availability_days.includes(day)
        ? prev.availability_days.filter(d => d !== day)
        : [...prev.availability_days, day]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showToast('Por favor, corrige los errores del formulario', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await updateWorker(workerId, {
        ...formData,
        phone: formData.phone.replace(/\s/g, ''), // Remove spaces for storage
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        dni: formData.dni.trim() || undefined,
        social_security_number: formData.social_security_number.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        emergency_contact_name: formData.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || undefined
      })

      if (error) {
        showToast(`Error al actualizar trabajadora: ${error}`, 'error')
      } else {
        showToast(`${formData.name} ${formData.surname} actualizada correctamente`, 'success')
        router.push(`/dashboard/workers/${workerId}`)
      }
    } catch {
      showToast('Error inesperado al actualizar trabajadora', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // const handleLogout = async () => {
  //   await supabase.auth.signOut()
  //   router.push('/')
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando datos de la trabajadora...</p>
        </div>
      </div>
    )
  }

  if (loadError || !worker) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">
              {loadError || 'No se pudo cargar la información de la trabajadora'}
            </p>
            <Link href="/dashboard/workers">
              <Button>Volver a Trabajadoras</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center py-4">
            <Button variant="secondary" size="sm" onClick={() => router.back()} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
            <h1 className="text-xl font-bold text-slate-900 truncate flex-1">Editar Trabajadora</h1>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Estado de la Trabajadora</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium">
                  {formData.is_active ? '✅ Trabajadora Activa' : '❌ Trabajadora Inactiva'}
                </span>
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Las trabajadoras inactivas no aparecerán en las asignaciones nuevas
              </p>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="María"
                    className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : ''}`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={formData.surname}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    placeholder="García López"
                    className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.surname ? 'border-red-500' : ''}`}
                  />
                  {errors.surname && (
                    <p className="text-red-500 text-xs mt-1">{errors.surname}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="654 321 987"
                    className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="maria.garcia@email.com"
                    className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Calle Principal 123, 28001 Madrid"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    DNI
                  </label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value.toUpperCase())}
                    placeholder="12345678A"
                    className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.dni ? 'border-red-500' : ''}`}
                  />
                  {errors.dni && (
                    <p className="text-red-500 text-xs mt-1">{errors.dni}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha de Contratación *
                  </label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => handleInputChange('hire_date', e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>💼 Configuración Laboral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tarifa por Hora (€) *
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="10"
                    max="50"
                    value={formData.hourly_rate}
                    onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value) || 0)}
                    className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.hourly_rate ? 'border-red-500' : ''}`}
                  />
                  {errors.hourly_rate && (
                    <p className="text-red-500 text-xs mt-1">{errors.hourly_rate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Máximo Horas/Semana *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={formData.max_weekly_hours}
                    onChange={(e) => handleInputChange('max_weekly_hours', parseInt(e.target.value) || 0)}
                    className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.max_weekly_hours ? 'border-red-500' : ''}`}
                  />
                  {errors.max_weekly_hours && (
                    <p className="text-red-500 text-xs mt-1">{errors.max_weekly_hours}</p>
                  )}
                </div>
              </div>

              {/* Specializations */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Especializaciones *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {specializationOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.specializations.includes(option.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(option.value)}
                        onChange={() => handleSpecializationToggle(option.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.specializations && (
                  <p className="text-red-500 text-xs mt-1">{errors.specializations}</p>
                )}
              </div>

              {/* Availability Days */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Días Disponibles *
                </label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {weekDayOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                        formData.availability_days.includes(option.value)
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.availability_days.includes(option.value)}
                        onChange={() => handleAvailabilityToggle(option.value)}
                        className="sr-only"
                      />
                      <span className="font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.availability_days && (
                  <p className="text-red-500 text-xs mt-1">{errors.availability_days}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>🚨 Contacto de Emergencia y Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre Contacto de Emergencia
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    placeholder="Juan García"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Teléfono de Emergencia
                  </label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    placeholder="612 345 678"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notas y Observaciones
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Experiencia, certificaciones, observaciones importantes..."
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href={`/dashboard/workers/${workerId}`}>
              <Button type="button" variant="secondary">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
      {ToastComponent}
      {/* Footer de navegación fijo */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
        <nav className="flex justify-around py-3">
          <Link href="/dashboard/users" className="flex flex-col items-center text-xs text-slate-600 hover:text-blue-600 transition-colors">
            <User className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Usuarios</span>
          </Link>
          <Link href="/dashboard/workers" className="flex flex-col items-center text-xs text-slate-600 hover:text-green-600 transition-colors">
            <Users className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Trabajadoras</span>
          </Link>
          <Link href="/dashboard/assignments" className="flex flex-col items-center text-xs text-slate-600 hover:text-purple-600 transition-colors">
            <Clock className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Asignaciones</span>
          </Link>
          <Link href="/dashboard/planning" className="flex flex-col items-center text-xs text-blue-600 transition-colors">
            <Calendar className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Planning</span>
          </Link>
          <Link href="/dashboard/settings" className="flex flex-col items-center text-xs text-slate-600 hover:text-slate-800 transition-colors">
            <Settings className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Configuración</span>
          </Link>
        </nav>
      </footer>
      <div className="h-20"></div>
    </div>
  )
} 