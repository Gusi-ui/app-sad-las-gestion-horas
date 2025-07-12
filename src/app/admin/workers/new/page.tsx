'use client'

import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, User, Calendar, Settings } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  validateWorker,
  validateAddress, 
  isValidPostalCodeFormat, 
  isValidSpanishPostalCode, 
  isValidPostalCodeForProvince,
  getProvinceByPostalCode,
  getPostalCodeSuggestions,
  isValidDNI,
  isValidDNIFormat,
  getCorrectDNILetter,
  formatDNI,
  POSTAL_CODE_RANGES 
} from '@/lib/utils'

interface WorkerFormData {
  employee_code: string
  name: string
  surname: string
  email: string
  phone: string
  dni: string
  street_address: string
  postal_code: string
  city: string
  worker_type: 'laborables' | 'festivos' | 'flexible'
  hourly_rate: number
  hire_date: string
  availability_days: string[]
  notes: string
}

export default function NewWorkerPage() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    dni?: string
    street_address?: string
    postal_code?: string
    city?: string
  }>({})

  const [formData, setFormData] = useState<WorkerFormData>({
    employee_code: '',
    name: '',
    surname: '',
    email: '',
    phone: '',
    dni: '',
    street_address: '',
    postal_code: '',
    city: '',
    worker_type: 'laborables',
    hourly_rate: 12.50,
    hire_date: new Date().toISOString().split('T')[0],
    availability_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    notes: ''
  })

  // Generar código de empleado automáticamente
  useEffect(() => {
    generateEmployeeCode()
  }, [])

  const generateEmployeeCode = async () => {
    if (!supabase) {
      console.error('Supabase client no disponible')
      return
    }

    try {
      // Obtener el último código de empleado
      const { data, error } = await supabase
        .from('workers')
        .select('employee_code')
        .order('employee_code', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error al obtener códigos de empleado:', error)
        return
      }

      let nextCode = 'TR001'
      if (data && data.length > 0) {
        const lastCode = data[0].employee_code
        if (lastCode && lastCode.startsWith('TR')) {
          const number = parseInt(lastCode.substring(2))
          if (!isNaN(number)) {
            nextCode = `TR${(number + 1).toString().padStart(3, '0')}`
          }
        }
      }

      setFormData(prev => ({ ...prev, employee_code: nextCode }))
    } catch (error) {
      console.error('Error al generar código de empleado:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validar trabajadora antes de enviar
    const workerValidation = validateWorker({
      dni: formData.dni,
      street_address: formData.street_address,
      postal_code: formData.postal_code,
      city: formData.city,
    })

    if (!workerValidation.isValid) {
      setValidationErrors(workerValidation.errors)
      showToast('Por favor, corrige los errores en el formulario', 'error')
      setLoading(false)
      return
    }

    if (!supabase) {
      showToast('Error: Supabase client no disponible', 'error')
      setLoading(false)
      return
    }

    try {
      // Preparar datos para inserción
      const workerData = {
        employee_code: formData.employee_code,
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        phone: formData.phone,
        dni: formData.dni || null,
        street_address: formData.street_address || null,
        postal_code: formData.postal_code || null,
        city: formData.city || null,
        worker_type: formData.worker_type,
        hourly_rate: formData.hourly_rate,
        hire_date: formData.hire_date,
        availability_days: formData.availability_days,
        notes: formData.notes || null
      }

      const { data, error } = await supabase
        .from('workers')
        .insert([workerData])
        .select()
        .single()

      if (error) {
        console.error('Error al crear trabajadora:', error)
        console.error('Datos que se intentaron insertar:', workerData)
        showToast(`Error al crear trabajadora: ${error.message || 'Error desconocido'}`, 'error')
        return
      }

      showToast('Trabajadora creada correctamente', 'success')
      router.push('/admin/workers')
    } catch (error) {
      console.error('Error inesperado:', error)
      showToast('Error inesperado al crear trabajadora', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof WorkerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Validar en tiempo real para campos con validación
    if (['dni', 'street_address', 'postal_code', 'city'].includes(field)) {
      const newFormData = { ...formData, [field]: value }
      const validation = validateWorker({
        dni: newFormData.dni,
        street_address: newFormData.street_address,
        postal_code: newFormData.postal_code,
        city: newFormData.city,
      })
      setValidationErrors(validation.errors)
    }
    
    // Actualizar availability_days cuando cambie worker_type
    if (field === 'worker_type') {
      const newAvailabilityDays = getAvailabilityDays(value)
      setFormData(prev => ({ ...prev, availability_days: newAvailabilityDays }))
    }
  }

  // Añadir función para mapear worker_type a availability_days
  const getAvailabilityDays = (workerType: string): string[] => {
    switch (workerType) {
      case 'laborables':
        return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      case 'festivos':
        return ['saturday', 'sunday']
      case 'flexible':
        return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      default:
        return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin/workers">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Nueva Trabajadora
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Creando nuevo perfil de trabajadora
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Información Personal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Código de Empleado *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.employee_code}
                      onChange={(e) => handleInputChange('employee_code', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
                      placeholder="TR001"
                      readOnly
                    />
                    <p className="text-xs text-slate-500 mt-1">Generado automáticamente</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      DNI
                    </label>
                    <input
                      type="text"
                      value={formData.dni}
                      onChange={(e) => handleInputChange('dni', e.target.value.toUpperCase())}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors.dni 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-slate-300'
                      }`}
                      placeholder="12345678A"
                      maxLength={9}
                    />
                    {validationErrors.dni && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.dni}</p>
                    )}
                    {formData.dni && !validationErrors.dni && (
                      <p className="text-sm text-green-600 mt-1">
                        ✅ DNI válido
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Carmen"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.surname}
                      onChange={(e) => handleInputChange('surname', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fernández Ruiz"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="carmen.fernandez@sadlas.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="600 123 456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.street_address}
                    onChange={(e) => handleInputChange('street_address', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Calle Mayor 123"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors.postal_code 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-slate-300'
                      }`}
                      placeholder="08302"
                      maxLength={5}
                    />
                    {validationErrors.postal_code && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.postal_code}</p>
                    )}
                    {/* Validación visual: código postal y ciudad */}
                    {formData.postal_code && formData.city && !validationErrors.postal_code && (
                      <p className="text-xs text-green-600 mt-1">
                        {formData.city === 'Mataró' && formData.postal_code.startsWith('083') ? '✅ Código postal válido para Mataró' : '⚠️ Revisa que el código postal corresponda a la ciudad'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mataró"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información Laboral */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-green-600" />
                  <span>Información Laboral</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de Disponibilidad *
                  </label>
                  <select
                    required
                    value={formData.worker_type}
                    onChange={(e) => {
                      const newType = e.target.value as 'laborables' | 'festivos' | 'flexible'
                      handleInputChange('worker_type', newType)
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="laborables">Laborables (Lunes a Viernes)</option>
                    <option value="festivos">Festivos (Fines de semana y festivos)</option>
                    <option value="flexible">Flexible (Cualquier día)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.worker_type === 'laborables' && 'Disponible de lunes a viernes'}
                    {formData.worker_type === 'festivos' && 'Disponible fines de semana y festivos'}
                    {formData.worker_type === 'flexible' && 'Disponible todos los días de la semana'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha de Contratación *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.hire_date}
                    onChange={(e) => handleInputChange('hire_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tarifa por Hora (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.hourly_rate}
                    onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="12.50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Información adicional sobre la trabajadora..."
                  />
                </div>

                {/* Disponibilidad de Días */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">
                          {formData.worker_type === 'laborables' && '📅 Laborables'}
                          {formData.worker_type === 'festivos' && '🎉 Festivos'}
                          {formData.worker_type === 'flexible' && '⭐ Flexible'}
                        </h4>
                        <p className="text-sm text-blue-700">
                          {formData.worker_type === 'laborables' && 'Lunes, Martes, Miércoles, Jueves, Viernes'}
                          {formData.worker_type === 'festivos' && 'Sábados, Domingos y festivos'}
                          {formData.worker_type === 'flexible' && 'Todos los días de la semana'}
                        </p>
                      </div>
                      <div className="text-2xl">
                        {formData.worker_type === 'laborables' && '🏢'}
                        {formData.worker_type === 'festivos' && '🎊'}
                        {formData.worker_type === 'flexible' && '⭐'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500 text-center mt-2">
                    La disponibilidad se configura automáticamente según el tipo seleccionado
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-4">
            <Link href="/admin/workers">
              <Button variant="secondary" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Trabajadora'}
            </Button>
          </div>
        </form>

        {ToastComponent}
      </div>
    </div>
  )
} 