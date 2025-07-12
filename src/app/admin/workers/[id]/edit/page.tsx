'use client'

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
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, User, Mail, Clock, Calendar } from 'lucide-react'
import ToastNotification from '@/components/ui/toast-notification'

interface Worker {
  id: string
  name: string
  surname: string
  email: string
  phone: string
  dni?: string
  address?: string
  street_address?: string
  postal_code?: string
  city?: string
  province?: string
  worker_type: string
  hourly_rate: number
  is_active: boolean
  employee_code: string
  specializations: string[]
  availability_days: string[]
}

export default function EditWorkerPage() {
  const params = useParams()
  const router = useRouter()
  const [worker, setWorker] = useState<Worker | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    dni?: string
    street_address?: string
    postal_code?: string
    city?: string
    province?: string
  }>({})
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    isVisible: boolean
  }>({
    message: '',
    type: 'info',
    isVisible: false
  })
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    dni: '',
    address: '',
    street_address: '',
    postal_code: '',
    city: 'Mataró',
    province: 'Barcelona',
    worker_type: 'regular',
    hourly_rate: 0,
    is_active: true,
    specializations: [] as string[],
    availability_days: [] as string[]
  })

  useEffect(() => {
    if (params.id) {
      fetchWorker(params.id as string)
    }
  }, [params.id])

  const fetchWorker = async (workerId: string) => {
    if (!supabase) {
      console.error('Supabase client no disponible')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('id', workerId)
        .single()

      if (error) {
        console.error('Error al cargar trabajadora:', error)
        setToast({
          message: 'Error al cargar trabajadora: ' + error.message,
          type: 'error',
          isVisible: true
        })
      } else {
        setWorker(data)
        
        // Determinar el tipo de disponibilidad basado en los días existentes
        const existingDays = data.availability_days || []
        let availabilityDays: string[] = []
        
        // Detectar el patrón de días existentes
        if (existingDays.length === 2 && existingDays.includes('saturday') && existingDays.includes('sunday')) {
          // Solo fines de semana
          availabilityDays = ['saturday', 'sunday']
        } else if (existingDays.length === 7) {
          // Todos los días
          availabilityDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        } else if (existingDays.length === 5 && 
                   existingDays.includes('monday') && 
                   existingDays.includes('tuesday') && 
                   existingDays.includes('wednesday') && 
                   existingDays.includes('thursday') && 
                   existingDays.includes('friday')) {
          // Solo laborables
          availabilityDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        } else {
          // Si no coincide con ningún patrón, usar laborables por defecto
          availabilityDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }
        
        setFormData({
          name: data.name || '',
          surname: data.surname || '',
          email: data.email || '',
          phone: data.phone || '',
          dni: data.dni || '',
          address: data.address || '',
          street_address: data.street_address || '',
          postal_code: data.postal_code || '',
          city: data.city || 'Mataró',
          province: data.province || 'Barcelona',
          worker_type: data.worker_type || 'regular',
          hourly_rate: data.hourly_rate || 0,
          is_active: data.is_active,
          specializations: data.specializations || [],
          availability_days: availabilityDays
        })
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setToast({
        message: 'Error inesperado: ' + errorMessage,
        type: 'error',
        isVisible: true
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!worker || !supabase) return

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
      setToast({
        message: 'Por favor, corrige los errores en el formulario',
        type: 'error',
        isVisible: true
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('workers')
        .update(formData)
        .eq('id', worker.id)

      if (error) {
        throw error
      }

      setToast({
        message: 'Trabajadora actualizada correctamente',
        type: 'success',
        isVisible: true
      })
      setTimeout(() => {
        router.push('/admin/workers')
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setToast({
        message: 'Error al actualizar trabajadora: ' + errorMessage,
        type: 'error',
        isVisible: true
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando trabajadora...</p>
        </div>
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-16 h-16 text-red-500 mx-auto mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Trabajadora no encontrada</h1>
          <p className="text-slate-600 mb-6">La trabajadora que buscas no existe o ha sido eliminada.</p>
          <Link href="/admin/workers">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Trabajadoras
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Link href="/admin/workers">
            <Button variant="default" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Editar Trabajadora
            </h1>
            <p className="text-slate-600">Modificar información de {worker.name} {worker.surname}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Sección Destacada - Disponibilidad */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
            <CardTitle className="flex items-center text-indigo-900">
              <Calendar className="w-6 h-6 mr-2" />
              Disponibilidad de Días
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <p className="text-sm text-slate-600 mb-6">
                Selecciona el tipo de disponibilidad de esta trabajadora:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    key: 'laborables', 
                    label: 'Laborables', 
                    description: 'Lunes a Viernes',
                    color: 'from-blue-50 to-blue-100',
                    borderColor: 'border-blue-300',
                    icon: '🏢'
                  },
                  { 
                    key: 'festivos', 
                    label: 'Festivos', 
                    description: 'Fines de semana y días festivos',
                    color: 'from-green-50 to-green-100',
                    borderColor: 'border-green-300',
                    icon: '🎉'
                  },
                  { 
                    key: 'flexible', 
                    label: 'Flexible', 
                    description: 'Todos los días',
                    color: 'from-purple-50 to-purple-100',
                    borderColor: 'border-purple-300',
                    icon: '⭐'
                  }
                ].map((option) => (
                  <label
                    key={option.key}
                    className={`relative flex flex-col items-center p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      (option.key === 'laborables' && formData.availability_days.includes('monday') && formData.availability_days.includes('friday') && formData.availability_days.length === 5) ||
                      (option.key === 'festivos' && formData.availability_days.includes('saturday') && formData.availability_days.includes('sunday') && formData.availability_days.length === 2) ||
                      (option.key === 'flexible' && formData.availability_days.length === 7)
                        ? `bg-gradient-to-r ${option.color} ${option.borderColor} shadow-md`
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="availability_type"
                      checked={
                        (option.key === 'laborables' && formData.availability_days.includes('monday') && formData.availability_days.includes('friday') && formData.availability_days.length === 5) ||
                        (option.key === 'festivos' && formData.availability_days.includes('saturday') && formData.availability_days.includes('sunday') && formData.availability_days.length === 2) ||
                        (option.key === 'flexible' && formData.availability_days.length === 7)
                      }
                      onChange={() => {
                        // Convertir la selección a días específicos según el tipo
                        let days: string[] = []
                        switch (option.key) {
                          case 'laborables':
                            days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                            break
                          case 'festivos':
                            days = ['saturday', 'sunday']
                            break
                          case 'flexible':
                            days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                            break
                        }
                        handleInputChange('availability_days', days)
                      }}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-full border-2 mb-4 flex items-center justify-center ${
                      (option.key === 'laborables' && formData.availability_days.includes('monday') && formData.availability_days.includes('friday') && formData.availability_days.length === 5) ||
                      (option.key === 'festivos' && formData.availability_days.includes('saturday') && formData.availability_days.includes('sunday') && formData.availability_days.length === 2) ||
                      (option.key === 'flexible' && formData.availability_days.length === 7)
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-slate-300'
                    }`}>
                      {((option.key === 'laborables' && formData.availability_days.includes('monday') && formData.availability_days.includes('friday') && formData.availability_days.length === 5) ||
                        (option.key === 'festivos' && formData.availability_days.includes('saturday') && formData.availability_days.includes('sunday') && formData.availability_days.length === 2) ||
                        (option.key === 'flexible' && formData.availability_days.length === 7)) && (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="text-3xl mb-3">{option.icon}</div>
                    <div className="text-center">
                      <span className={`font-semibold text-lg block ${
                        (option.key === 'laborables' && formData.availability_days.includes('monday') && formData.availability_days.includes('friday') && formData.availability_days.length === 5) ||
                        (option.key === 'festivos' && formData.availability_days.includes('saturday') && formData.availability_days.includes('sunday') && formData.availability_days.length === 2) ||
                        (option.key === 'flexible' && formData.availability_days.length === 7) ? 'text-slate-900' : 'text-slate-700'
                      }`}>
                        {option.label}
                      </span>
                      <p className={`text-sm mt-1 ${
                        (option.key === 'laborables' && formData.availability_days.includes('monday') && formData.availability_days.includes('friday') && formData.availability_days.length === 5) ||
                        (option.key === 'festivos' && formData.availability_days.includes('saturday') && formData.availability_days.includes('sunday') && formData.availability_days.length === 2) ||
                        (option.key === 'flexible' && formData.availability_days.length === 7) ? 'text-slate-700' : 'text-slate-500'
                      }`}>
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>Disponibilidad actual:</strong> {
                    (formData.availability_days.includes('monday') && formData.availability_days.includes('friday') && formData.availability_days.length === 5) ? 'Laborables (Lunes a Viernes)' :
                    (formData.availability_days.includes('saturday') && formData.availability_days.includes('sunday') && formData.availability_days.length === 2) ? 'Festivos (Fines de semana)' :
                    (formData.availability_days.length === 7) ? 'Flexible (Todos los días)' :
                    formData.availability_days.length > 0 ? 
                      formData.availability_days.map(day => {
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
                    : 'No especificada'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Información Personal y Contacto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información Personal */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <CardTitle className="flex items-center text-blue-900">
                <User className="w-5 h-5 mr-2" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Nombre *</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Apellidos *</label>
                  <Input
                    type="text"
                    value={formData.surname}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    required
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">DNI</label>
                <Input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => handleInputChange('dni', e.target.value.toUpperCase())}
                  placeholder="12345678A"
                  maxLength={9}
                  className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-colors ${
                    validationErrors.dni 
                      ? 'border-red-300 bg-red-50' 
                      : ''
                  }`}
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

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Código de Empleada</label>
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 px-3 py-2 rounded-md">
                  <p className="text-slate-900 font-mono text-sm font-semibold">
                    {worker.employee_code}
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-2">El código de empleada no se puede modificar</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Estado</label>
                <div className="flex items-center space-x-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-sm font-medium text-slate-700">
                    {formData.is_active ? 'Trabajadora activa' : 'Trabajadora inactiva'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <CardTitle className="flex items-center text-green-900">
                <Mail className="w-5 h-5 mr-2" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="border-slate-300 focus:border-green-500 focus:ring-green-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Teléfono *</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                  className="border-slate-300 focus:border-green-500 focus:ring-green-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Calle y Número *</label>
                <Input
                  type="text"
                  required
                  value={formData.street_address}
                  onChange={(e) => handleInputChange('street_address', e.target.value)}
                  className={`border-slate-300 focus:border-green-500 focus:ring-green-500 transition-colors ${
                    validationErrors.street_address 
                      ? 'border-red-300 bg-red-50' 
                      : ''
                  }`}
                  placeholder="Calle Mayor 123"
                />
                {validationErrors.street_address && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.street_address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Código Postal</label>
                  <Input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handlePostalCodeChange(e.target.value)}
                    className={`border-slate-300 focus:border-green-500 focus:ring-green-500 transition-colors ${
                      validationErrors.postal_code 
                        ? 'border-red-300 bg-red-50' 
                        : ''
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
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Ciudad *</label>
                  <Input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`border-slate-300 focus:border-green-500 focus:ring-green-500 transition-colors ${
                      validationErrors.city 
                        ? 'border-red-300 bg-red-50' 
                        : ''
                    }`}
                    placeholder="Mataró"
                  />
                  {validationErrors.city && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.city}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Provincia</label>
                <select
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                                      className={`w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                      validationErrors.province 
                        ? 'border-red-300 bg-red-50' 
                        : ''
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
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href="/admin/workers">
            <Button variant="default" type="button" className="bg-slate-100 hover:bg-slate-200 text-slate-700">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>

      {/* Toast Notification */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  )
} 