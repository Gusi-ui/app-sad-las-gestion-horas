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
  province: string
  worker_type: 'regular' | 'holidays' | 'weekends' | 'flexible'
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
    province?: string
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
    city: 'Mataró',
    province: 'Barcelona',
    worker_type: 'regular',
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
      province: formData.province
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
      const { data, error } = await supabase
        .from('workers')
        .insert([formData])
        .select()
        .single()

      if (error) {
        console.error('Error al crear trabajadora:', error)
        showToast(`Error al crear trabajadora: ${error.message}`, 'error')
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
    if (['dni', 'street_address', 'postal_code', 'city', 'province'].includes(field)) {
      const newFormData = { ...formData, [field]: value }
      const validation = validateWorker({
        dni: newFormData.dni,
        street_address: newFormData.street_address,
        postal_code: newFormData.postal_code,
        city: newFormData.city,
        province: newFormData.province
      })
      setValidationErrors(validation.errors)
    }
  }

  // Auto-detectar provincia por código postal
  const handlePostalCodeChange = (postalCode: string) => {
    handleInputChange('postal_code', postalCode)
    
    if (postalCode && isValidPostalCodeFormat(postalCode)) {
      const detectedProvince = getProvinceByPostalCode(postalCode)
      if (detectedProvince && detectedProvince !== formData.province) {
        handleInputChange('province', detectedProvince)
      }
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
                    Calle y Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.street_address}
                    onChange={(e) => handleInputChange('street_address', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.street_address 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-slate-300'
                    }`}
                    placeholder="Calle Mayor 123"
                  />
                  {validationErrors.street_address && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.street_address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => handlePostalCodeChange(e.target.value)}
                                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.postal_code 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-slate-300'
                    }`}
                    placeholder="08301"
                    pattern="[0-9]{5}"
                    title="Código postal de 5 dígitos"
                    maxLength={5}
                  />
                  {validationErrors.postal_code && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.postal_code}</p>
                  )}
                  {formData.postal_code && !validationErrors.postal_code && (
                    <p className="text-sm text-green-600 mt-1">
                      ✅ Código postal válido para {getProvinceByPostalCode(formData.postal_code) || 'España'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.city 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-slate-300'
                    }`}
                    placeholder="Mataró"
                  />
                  {validationErrors.city && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.city}</p>
                  )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Provincia
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.province 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-slate-300'
                    }`}
                  >
                    {Object.keys(POSTAL_CODE_RANGES).map(province => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  {validationErrors.province && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.province}</p>
                  )}
                  {formData.province && !validationErrors.province && formData.postal_code && (
                    <p className="text-sm text-blue-600 mt-1">
                      💡 Sugerencias: {getPostalCodeSuggestions(formData.province).join(', ')}
                    </p>
                  )}
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
                    Tipo de Trabajadora *
                  </label>
                  <select
                    required
                    value={formData.worker_type}
                    onChange={(e) => handleInputChange('worker_type', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="regular">Laborables</option>
                    <option value="holidays">Festivos</option>
                    <option value="weekends">Fines de semana</option>
                    <option value="flexible">Flexible</option>
                  </select>
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
              </CardContent>
            </Card>

            {/* Disponibilidad de Días */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span>Disponibilidad de Días</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Selecciona los días en los que esta trabajadora estará disponible:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'monday', label: 'Lunes', color: 'from-red-50 to-red-100' },
                    { key: 'tuesday', label: 'Martes', color: 'from-orange-50 to-orange-100' },
                    { key: 'wednesday', label: 'Miércoles', color: 'from-yellow-50 to-yellow-100' },
                    { key: 'thursday', label: 'Jueves', color: 'from-green-50 to-green-100' },
                    { key: 'friday', label: 'Viernes', color: 'from-blue-50 to-blue-100' },
                    { key: 'saturday', label: 'Sábado', color: 'from-purple-50 to-purple-100' },
                    { key: 'sunday', label: 'Domingo', color: 'from-pink-50 to-pink-100' }
                  ].map((day) => (
                    <label
                      key={day.key}
                      className={`relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        formData.availability_days.includes(day.key)
                          ? `bg-gradient-to-r ${day.color} border-slate-300 shadow-md`
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.availability_days.includes(day.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange('availability_days', [...formData.availability_days, day.key])
                          } else {
                            handleInputChange('availability_days', formData.availability_days.filter(d => d !== day.key))
                          }
                        }}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        formData.availability_days.includes(day.key)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-slate-300'
                      }`}>
                        {formData.availability_days.includes(day.key) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`font-medium ${
                        formData.availability_days.includes(day.key) ? 'text-slate-900' : 'text-slate-700'
                      }`}>
                        {day.label}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <strong>Días seleccionados:</strong> {formData.availability_days.length > 0 
                      ? formData.availability_days.map(day => {
                          const dayNames = {
                            monday: 'Lunes',
                            tuesday: 'Martes', 
                            wednesday: 'Miércoles',
                            thursday: 'Jueves',
                            friday: 'Viernes',
                            saturday: 'Sábado',
                            sunday: 'Domingo'
                          }
                          return dayNames[day as keyof typeof dayNames] || day
                        }).join(', ')
                      : 'Ningún día seleccionado'
                    }
                  </p>
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