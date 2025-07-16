'use client'

import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Calendar, Heart, CheckCircle, XCircle } from 'lucide-react'
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

interface UserFormData {
  client_code: string
  name: string
  surname: string
  email: string
  phone: string
  dni: string
  address: string
  postal_code: string
  city: string
  province: string
  monthly_hours: number
  service_type: string
  special_requirements: string[]
  medical_conditions: string[]
  allergies: string[]
  medications: string[]
  emergency_contacts: any[]
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  notes: string
}

export default function NewUserPage() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    dni?: string
    address?: string
    postal_code?: string
    city?: string
    province?: string
  }>({})

  const [formData, setFormData] = useState<UserFormData>({
    client_code: '',
    name: '',
    surname: '',
    email: '',
    phone: '',
    dni: '',
    address: '',
    postal_code: '',
    city: 'Mataró',
    province: 'Barcelona',
    monthly_hours: 0,
    service_type: '',
    special_requirements: [],
    medical_conditions: [],
    allergies: [],
    medications: [],
    emergency_contacts: [],
    status: 'active',
    notes: ''
  })

  // Generar código de cliente automáticamente
  useEffect(() => {
    generateClientCode()
  }, [])

  const generateClientCode = async () => {
    if (!supabase) {
      console.error('Supabase client no disponible')
      return
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('client_code')
        .order('client_code', { ascending: false })
        .limit(1)
      let nextCode = 'US001'
      if (data && data.length > 0) {
        const lastCode = data[0].client_code
        if (lastCode && lastCode.startsWith('US')) {
          const number = parseInt(lastCode.substring(2))
          if (!isNaN(number)) {
            nextCode = `US${(number + 1).toString().padStart(3, '0')}`
          }
        }
      }
      setFormData(prev => ({ ...prev, client_code: nextCode }))
    } catch (error) {
      console.error('Error al generar código de cliente:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validar usuario antes de enviar
    const userValidation = validateWorker({
      dni: formData.dni,
      street_address: formData.address,
      postal_code: formData.postal_code,
      city: formData.city,
      province: formData.province
    })

    if (!userValidation.isValid) {
      setValidationErrors(userValidation.errors)
      showToast('Por favor, corrige los errores en el formulario', 'error')
      setLoading(false)
      return
    }

    if (!supabase) {
      showToast('Error: Cliente de base de datos no disponible', 'error')
      setLoading(false)
      return
    }

    try {
      // Preparar datos para guardar (añadir +34 al teléfono)
      const dataToSave: any = {
        ...formData,
        phone: formData.phone ? `+34${formData.phone}` : '',
        is_active: formData.status === 'active'
      }
      // Eliminar campos que no existen en la tabla o arrays vacíos
      delete dataToSave.emergency_contacts
      if (Array.isArray(dataToSave.special_requirements) && dataToSave.special_requirements.length === 0) delete dataToSave.special_requirements
      if (Array.isArray(dataToSave.medical_conditions) && dataToSave.medical_conditions.length === 0) delete dataToSave.medical_conditions
      if (Array.isArray(dataToSave.allergies) && dataToSave.allergies.length === 0) delete dataToSave.allergies
      if (Array.isArray(dataToSave.medications) && dataToSave.medications.length === 0) delete dataToSave.medications
      // monthly_hours nunca debe ser NaN ni null
      if (!dataToSave.monthly_hours || isNaN(dataToSave.monthly_hours)) dataToSave.monthly_hours = 0
      // Log para depuración
      // const { data, error } = await supabase
        .from('users')
        .insert([dataToSave])
        .select()
        .single()

      if (error) {
        console.error('Error al crear usuario:', error)
        showToast(`Error al crear usuario: ${JSON.stringify(error)}`, 'error')
        return
      }

      showToast('Usuario creado correctamente', 'success')
      router.push('/admin/users')
    } catch (error) {
      console.error('Error inesperado:', error)
      showToast('Error inesperado al crear usuario: ' + JSON.stringify(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Validar en tiempo real para campos con validación
    if (['dni', 'address', 'postal_code', 'city', 'province'].includes(field)) {
      const newFormData = { ...formData, [field]: value }
      const validation = validateWorker({
        dni: newFormData.dni,
        street_address: newFormData.address,
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

  // Helper para mostrar el nombre del día
  const getDayName = (day: string) => {
    const dayNames: { [key: string]: string } = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
    }
    return dayNames[day] || day
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin/users">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Nuevo Usuario
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Creando nuevo perfil de usuario/cliente
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Código de Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.client_code}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
                      placeholder="US001"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      placeholder="José"
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
                      placeholder="Pérez García"
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
                    placeholder="jose.perez@email.com"
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
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.address
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-300'
                    }`}
                    placeholder="Calle Mayor 123"
                  />
                  {validationErrors.address && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.address}</p>
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

            {/* Información del Servicio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-green-600" />
                  <span>Información del Servicio</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center mb-4">
                  <label className="block text-base font-medium text-slate-700 mb-2 text-center">
                    Horas asignadas totales
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.monthly_hours}
                    onChange={(e) => handleInputChange('monthly_hours', parseFloat(e.target.value))}
                    className="text-7xl font-extrabold text-blue-700 text-center bg-transparent border-0 focus:ring-0 focus:border-0 outline-none w-full max-w-xs py-4"
                    style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Días de Servicio
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'monday', label: 'Lunes' },
                      { key: 'tuesday', label: 'Martes' },
                      { key: 'wednesday', label: 'Miércoles' },
                      { key: 'thursday', label: 'Jueves' },
                      { key: 'friday', label: 'Viernes' },
                      { key: 'saturday', label: 'Sábado' },
                      { key: 'sunday', label: 'Domingo' }
                    ].map((day) => (
                      <label key={day.key} className={`relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${formData.special_requirements.includes(day.key) ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-slate-300 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                        <input
                          type="checkbox"
                          checked={formData.special_requirements.includes(day.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('special_requirements', [...formData.special_requirements, day.key])
                            } else {
                              handleInputChange('special_requirements', formData.special_requirements.filter(d => d !== day.key))
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${formData.special_requirements.includes(day.key) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                          {formData.special_requirements.includes(day.key) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`font-medium ${formData.special_requirements.includes(day.key) ? 'text-slate-900' : 'text-slate-700'}`}>{day.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">
                      <strong>Días seleccionados:</strong> {formData.special_requirements.length > 0 ? formData.special_requirements.map(getDayName).join(', ') : 'Ningún día seleccionado'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de Servicio
                  </label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => handleInputChange('service_type', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="elderly_care">Cuidado de Ancianos</option>
                    <option value="disability_care">Cuidado de Discapacitados</option>
                    <option value="medical_assistance">Asistencia Médica</option>
                    <option value="domestic_help">Ayuda Doméstica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Activo</option>
                    <option value="paused">Pausado</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información Médica */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-600" />
                <span>Información Médica</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Condiciones Médicas
                </label>
                <textarea
                  value={formData.medical_conditions.join(', ')}
                  onChange={(e) => handleInputChange('medical_conditions', e.target.value.split(',').map(s => s.trim()))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Diabetes, Hipertensión (separar con comas)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Alergias
                </label>
                <textarea
                  value={formData.allergies.join(', ')}
                  onChange={(e) => handleInputChange('allergies', e.target.value.split(',').map(s => s.trim()))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Penicilina, Frutos secos (separar con comas)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Medicamentos
                </label>
                <textarea
                  value={formData.medications.join(', ')}
                  onChange={(e) => handleInputChange('medications', e.target.value.split(',').map(s => s.trim()))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Insulina, Metformina (separar con comas)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notas Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Información adicional sobre el usuario..."
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-4">
            <Link href="/admin/users">
              <Button variant="secondary" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>

        {ToastComponent}
      </div>
    </div>
  )
}