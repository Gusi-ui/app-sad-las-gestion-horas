'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, User, Mail, Phone, MapPin, AlertTriangle, CheckCircle, XCircle, Calendar, Heart, Badge, X } from 'lucide-react'
import { Badge as UIBadge } from '@/components/ui/badge'
import { useNotificationHelpers } from '@/components/ui/toast-notification'

interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

interface User {
  id: string
  name: string
  surname: string
  email: string
  is_active: boolean
  client_code: string
  phone: string
  address: string
  city: string
  postal_code: string
  emergency_contacts?: EmergencyContact[]
  dni?: string
  monthly_hours?: number
  special_requirements?: string[]
  medical_conditions?: string[]
  allergies?: string[]
  medications?: string[]
  created_at?: string
}

const DAY_OPTIONS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

// Definir tipo explícito para el estado del formulario
interface UserFormData {
  name: string
  surname: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  is_active: boolean
  dni: string
  monthly_hours: number
  special_requirements: string[]
  medical_conditions: string[]
  allergies: string[]
  medications: string[]
  [key: string]: string | boolean | number | string[] // para acceso dinámico
}

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const { success, error: showError, warning, info } = useNotificationHelpers()
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // Usar el tipo UserFormData en el useState de formData
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    is_active: true,
    dni: '',
    monthly_hours: 0,
    special_requirements: [],
    medical_conditions: [],
    allergies: [],
    medications: [],
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [validationStates, setValidationStates] = useState<{[key: string]: 'valid' | 'invalid' | 'neutral'}>({})

  useEffect(() => {
    if (params.id) {
      fetchUser(params.id as string)
    }
  }, [params.id])

  const fetchUser = async (userId: string) => {
    if (!supabase) {
      console.error('Supabase client no disponible')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error al cargar usuario:', error)
        alert('Error al cargar usuario: ' + JSON.stringify(error))
      } else {
        setUser(data)
        setFormData({
          name: data.name || '',
          surname: data.surname || '',
          email: data.email || '',
          phone: data.phone?.replace('+34', '') || '',
          address: data.address || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          is_active: data.is_active,
          dni: data.dni || '',
          monthly_hours: data.monthly_hours || 0,
          special_requirements: data.special_requirements || [],
          medical_conditions: data.medical_conditions || [],
          allergies: data.allergies || [],
          medications: data.medications || [],
        })
        
        // Validar campos al cargar
        if (data.phone) validateField('phone', data.phone.replace('+34', ''))
        if (data.postal_code) validateField('postal_code', data.postal_code)
        if (data.dni) validateField('dni', data.dni)
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      alert('Error inesperado: ' + JSON.stringify(error))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Validar en tiempo real
    if (typeof value === 'string') {
      validateField(field, value)
    }
  }

  // Funciones de validación
  const validateDNI = (dni: string): { isValid: boolean; error?: string } => {
    if (!dni) return { isValid: true }
    
    // Formato básico: 8 dígitos + 1 letra
    const dniRegex = /^[0-9]{8}[A-Z]$/
    if (!dniRegex.test(dni)) {
      return { isValid: false, error: 'El DNI debe tener 8 dígitos seguidos de una letra mayúscula' }
    }
    
    // Validar letra de control
    const numbers = dni.substring(0, 8)
    const letter = dni.substring(8, 9)
    const validLetters = 'TRWAGMYFPDXBNJZSQVHLCKE'
    const expectedLetter = validLetters.charAt(parseInt(numbers) % 23)
    
    if (letter !== expectedLetter) {
      return { isValid: false, error: `La letra correcta para ${numbers} es ${expectedLetter}` }
    }
    
    return { isValid: true }
  }

  const validatePostalCode = (postalCode: string): { isValid: boolean; error?: string; province?: string } => {
    if (!postalCode) return { isValid: true }
    
    // Formato: 5 dígitos
    const postalCodeRegex = /^[0-9]{5}$/
    if (!postalCodeRegex.test(postalCode)) {
      return { isValid: false, error: 'El código postal debe tener 5 dígitos' }
    }
    
    const code = parseInt(postalCode)
    
    // Validar rangos por provincia
    const provinces: { [key: string]: { min: number; max: number } } = {
      'Álava': { min: 1000, max: 1999 },
      'Albacete': { min: 2000, max: 2999 },
      'Alicante': { min: 3000, max: 3999 },
      'Almería': { min: 4000, max: 4999 },
      'Asturias': { min: 33000, max: 33999 },
      'Ávila': { min: 5000, max: 5999 },
      'Badajoz': { min: 6000, max: 6999 },
      'Baleares': { min: 7000, max: 7999 },
      'Barcelona': { min: 8000, max: 8999 },
      'Burgos': { min: 9000, max: 9999 },
      'Cáceres': { min: 10000, max: 10999 },
      'Cádiz': { min: 11000, max: 11999 },
      'Cantabria': { min: 39000, max: 39999 },
      'Castellón': { min: 12000, max: 12999 },
      'Ciudad Real': { min: 13000, max: 13999 },
      'Córdoba': { min: 14000, max: 14999 },
      'La Coruña': { min: 15000, max: 15999 },
      'Cuenca': { min: 16000, max: 16999 },
      'Girona': { min: 17000, max: 17999 },
      'Granada': { min: 18000, max: 18999 },
      'Guadalajara': { min: 19000, max: 19999 },
      'Guipúzcoa': { min: 20000, max: 20999 },
      'Huelva': { min: 21000, max: 21999 },
      'Huesca': { min: 22000, max: 22999 },
      'Jaén': { min: 23000, max: 23999 },
      'León': { min: 24000, max: 24999 },
      'Lleida': { min: 25000, max: 25999 },
      'La Rioja': { min: 26000, max: 26999 },
      'Lugo': { min: 27000, max: 27999 },
      'Madrid': { min: 28000, max: 28999 },
      'Málaga': { min: 29000, max: 29999 },
      'Murcia': { min: 30000, max: 30999 },
      'Navarra': { min: 31000, max: 31999 },
      'Ourense': { min: 32000, max: 32999 },
      'Palencia': { min: 34000, max: 34999 },
      'Las Palmas': { min: 35000, max: 35999 },
      'Pontevedra': { min: 36000, max: 36999 },
      'Salamanca': { min: 37000, max: 37999 },
      'Santa Cruz de Tenerife': { min: 38000, max: 38999 },
      'Segovia': { min: 40000, max: 40999 },
      'Sevilla': { min: 41000, max: 41999 },
      'Soria': { min: 42000, max: 42999 },
      'Tarragona': { min: 43000, max: 43999 },
      'Teruel': { min: 44000, max: 44999 },
      'Toledo': { min: 45000, max: 45999 },
      'Valencia': { min: 46000, max: 46999 },
      'Valladolid': { min: 47000, max: 47999 },
      'Vizcaya': { min: 48000, max: 48999 },
      'Zamora': { min: 49000, max: 49999 },
      'Zaragoza': { min: 50000, max: 50999 },
      'Ceuta': { min: 51000, max: 51999 },
      'Melilla': { min: 52000, max: 52999 }
    }
    
    let province = ''
    for (const [prov, range] of Object.entries(provinces)) {
      if (code >= range.min && code <= range.max) {
        province = prov
        break
      }
    }
    
    if (!province) {
      return { isValid: false, error: 'Código postal no válido para España' }
    }
    
    return { isValid: true, province }
  }

  const validateField = (field: string, value: string) => {
    let isValid = true
    let error = ''
    let province = ''
    
    switch (field) {
      case 'phone':
        if (value && !/^[679][0-9]{8}$/.test(value.replace(/\s/g, ''))) {
          isValid = false
          error = 'El teléfono debe tener 9 dígitos y comenzar con 6, 7 o 9'
        }
        break
      case 'postal_code': {
        const postalValidation = validatePostalCode(value)
        isValid = postalValidation.isValid
        error = postalValidation.error || ''
        province = postalValidation.province || ''
        // Validación cruzada ciudad-código postal
        if (formData.city.trim().toLowerCase() === 'mataró' && !value.startsWith('0830')) {
          isValid = false
          error = 'El código postal de Mataró debe empezar por 0830'
        }
        break
      }
      case 'city': {
        // Si la ciudad es Mataró, validar el código postal
        if (value.trim().toLowerCase() === 'mataró' && formData.postal_code && !formData.postal_code.startsWith('0830')) {
          isValid = false
          error = 'El código postal de Mataró debe empezar por 0830'
        }
        break
      }
      case 'dni':
        const dniValidation = validateDNI(value)
        isValid = dniValidation.isValid
        error = dniValidation.error || ''
        break
    }
    
    setErrors(prev => ({
      ...prev,
      [field]: error
    }))
    
    setValidationStates(prev => ({
      ...prev,
      [field]: value ? (isValid ? 'valid' : 'invalid') : 'neutral'
    }))
    
    // Auto-detectar provincia si el código postal es válido
    if (field === 'postal_code' && province && !formData.city) {
      setFormData(prev => ({
        ...prev,
        city: province
      }))
    }
  }

  const getValidationIcon = (field: string) => {
    const state = validationStates[field]
    if (state === 'valid') {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else if (state === 'invalid') {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !supabase) return

    // Validar campos antes de enviar
    validateField('dni', formData.dni)
    validateField('postal_code', formData.postal_code)
    validateField('city', formData.city)
    const hasErrors = Object.values(errors).some(error => error !== '') || !!validateDNI(formData.dni).error
    if (hasErrors) {
      showError('Por favor, corrige los errores en el formulario antes de guardar.')
      return
    }

    setSaving(true)
    try {
      // Preparar datos para guardar (añadir +34 al teléfono)
      const dataToSave = {
        ...formData,
        phone: formData.phone ? `+34${formData.phone}` : '',
        monthly_hours: formData.monthly_hours || 0,
        special_requirements: formData.special_requirements || [],
        medical_conditions: formData.medical_conditions || [],
        allergies: formData.allergies || [],
        medications: formData.medications || [],
      }

      const { error } = await supabase
        .from('users')
        .update(dataToSave)
        .eq('id', user.id)

      if (error) {
        throw error
      }

      success('Usuario actualizado correctamente')
      setTimeout(() => {
        router.push('/admin/users')
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      showError('Error al actualizar usuario: ' + errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleArrayChange = (field: string, value: string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  const handleDayToggle = (day: string) => {
    setFormData(prev => {
      const days = prev.special_requirements.includes(day)
        ? prev.special_requirements.filter(d => d !== day)
        : [...prev.special_requirements, day]
      return { ...prev, special_requirements: days }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando usuario...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Usuario no encontrado</h1>
          <p className="text-slate-600 mb-6">El usuario que buscas no existe o ha sido eliminado.</p>
          <Link href="/admin/users">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Usuarios
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
          <Link href={`/admin/users/${user.id}`}>
            <Button variant="default" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Editar Usuario
            </h1>
            <p className="text-slate-600">Modificar información de {user.name} {user.surname}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="w-6 h-6 text-blue-600" />
              Servicio Asignado
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-8">
            <div className="flex flex-col items-center justify-center flex-1">
              <input
                type="number"
                step="0.25"
                min={0}
                className="text-5xl md:text-7xl font-extrabold text-blue-700 mb-2 bg-transparent border-none focus:ring-0 focus:outline-none text-center w-32"
                value={formData.monthly_hours}
                onChange={e => handleInputChange('monthly_hours', parseFloat(e.target.value) || 0)}
                style={{ outline: 'none', boxShadow: 'none' }}
              />
              <span className="text-base text-slate-600">Horas mensuales asignadas</span>
            </div>
            <div className="flex-1">
              <div className="mb-2 text-slate-700 font-semibold">Días de servicio:</div>
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map(day => (
                  <button
                    type="button"
                    key={day.key}
                    className={`px-4 py-2 rounded-full border font-semibold text-base transition-all ${formData.special_requirements.includes(day.key)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-slate-100 text-slate-500 border-slate-300'}`}
                    onClick={() => handleDayToggle(day.key)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Nombre *</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Apellidos *</label>
                  <Input
                    type="text"
                    value={formData.surname}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">DNI</label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={formData.dni}
                      onChange={e => handleInputChange('dni', e.target.value.toUpperCase())}
                      maxLength={9}
                      required
                      className={`pr-10 ${validationStates.dni === 'invalid' ? 'border-red-500 focus:border-red-500' : validationStates.dni === 'valid' ? 'border-green-500 focus:border-green-500' : ''}`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {getValidationIcon('dni')}
                    </div>
                  </div>
                  {errors.dni && (
                    <p className="text-red-500 text-xs mt-1">{errors.dni}</p>
                  )}
                  {!errors.dni && formData.dni && validationStates.dni === 'valid' && (
                    <p className="text-green-600 text-xs mt-1">DNI válido</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Código de Cliente</label>
                  <p className="text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded text-sm">
                    {user.client_code}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">El código de cliente no se puede modificar</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Fecha de Registro</label>
                <p className="text-slate-900">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Estado</label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-sm text-slate-700">
                    Usuario activo
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Teléfono *</label>
                <div className="relative">
                  <Input
                    type="tel"
                    value={formData.phone?.replace('+34', '') || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="612345678"
                    className={`pr-10 ${validationStates.phone === 'invalid' ? 'border-red-500 focus:border-red-500' : validationStates.phone === 'valid' ? 'border-green-500 focus:border-green-500' : ''}`}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {getValidationIcon('phone')}
                  </div>
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">Sin código de país (+34)</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Dirección</label>
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Ciudad</label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={e => handleInputChange('city', e.target.value)}
                    onBlur={e => validateField('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Código Postal</label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={formData.postal_code}
                      onChange={e => handleInputChange('postal_code', e.target.value)}
                      placeholder="28001"
                      maxLength={5}
                      className={`pr-10 ${validationStates.postal_code === 'invalid' ? 'border-red-500 focus:border-red-500' : validationStates.postal_code === 'valid' ? 'border-green-500 focus:border-green-500' : ''}`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {getValidationIcon('postal_code')}
                    </div>
                  </div>
                  {errors.postal_code && (
                    <p className="text-red-500 text-xs mt-1">{errors.postal_code}</p>
                  )}
                  {!errors.postal_code && formData.postal_code && validationStates.postal_code === 'valid' && (
                    <p className="text-green-600 text-xs mt-1">Código postal válido</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">5 dígitos (ej: 28001 para Madrid, 0830X para Mataró)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href={`/admin/users/${user.id}`}>
            <Button variant="default" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>

      {/* Añadir tarjeta de Información Médica editable */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="w-5 h-5 mr-2 text-red-500" />
            Información Médica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {['medical_conditions','allergies','medications'].map(field => (
            <div key={field}>
              <label className="text-sm font-medium text-slate-600">
                {field === 'medical_conditions' ? 'Condiciones Médicas' : field === 'allergies' ? 'Alergias' : 'Medicamentos'}
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(formData[field] as string[]).length > 0 && (formData[field] as string[]).map((item: string, idx: number) => (
                  <UIBadge key={idx} className="bg-blue-100 text-blue-800 border border-blue-300 font-semibold px-3 py-1 flex items-center">
                    {item}
                    <button type="button" className="ml-2 text-red-500" onClick={() => handleArrayChange(field, (formData[field] as string[]).filter((_: string, i: number) => i !== idx))}><X className="w-3 h-3" /></button>
                  </UIBadge>
                ))}
                <input
                  type="text"
                  className="border rounded px-2 py-1 text-sm"
                  placeholder={`Añadir ${field === 'medical_conditions' ? 'condición' : field === 'allergies' ? 'alergia' : 'medicamento'}`}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      e.preventDefault()
                      handleArrayChange(field, [...(formData[field] as string[]), e.currentTarget.value.trim()])
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
} 