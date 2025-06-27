'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, X, FileText } from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'

interface User {
  id: string
  name: string
  surname: string
  phone: string
  address: string
  notes: string
  is_active: boolean
  monthly_hours: number
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { showToast, ToastComponent } = useToast()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    address: '',
    notes: '',
    is_active: true,
    monthly_hours: 0
  })
  const [errors, setErrors] = useState({
    name: '',
    surname: '',
    phone: '',
    address: '',
    notes: '',
    monthly_hours: ''
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('Fetching user with ID:', userId)
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        console.log('Fetch user response:', { data, error })

        if (error) {
          console.error('Error fetching user:', error)
          throw error
        }

        setUser(data)
        setFormData({
          name: data.name || '',
          surname: data.surname || '',
          phone: data.phone || '',
          address: data.address || '',
          notes: data.notes || '',
          is_active: data.is_active ?? true,
          monthly_hours: data.monthly_hours || 0
        })
      } catch (error) {
        console.error('Error fetching user:', error)
        alert('Error al cargar los datos del usuario')
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUser()
    }
  }, [userId, router])

  // Validaciones
  const validateForm = () => {
    const newErrors = {
      name: '',
      surname: '',
      phone: '',
      address: '',
      notes: '',
      monthly_hours: ''
    }

    // Validar nombre
    const nameRegex = /^[a-zA-ZáéíóúüñçÁÉÍÓÚÜÑÇ\s]+$/
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'El nombre no puede exceder 50 caracteres'
    } else if (!nameRegex.test(formData.name.trim())) {
      newErrors.name = 'El nombre solo puede contener letras y espacios'
    } else if (formData.name.trim().includes('  ')) {
      newErrors.name = 'El nombre no puede tener espacios dobles'
    }

    // Validar apellidos
    const surnameRegex = /^[a-zA-ZáéíóúüñçÁÉÍÓÚÜÑÇ\s]+$/
    if (!formData.surname.trim()) {
      newErrors.surname = 'Los apellidos son obligatorios'
    } else if (formData.surname.trim().length < 2) {
      newErrors.surname = 'Los apellidos deben tener al menos 2 caracteres'
    } else if (formData.surname.trim().length > 100) {
      newErrors.surname = 'Los apellidos no pueden exceder 100 caracteres'
    } else if (!surnameRegex.test(formData.surname.trim())) {
      newErrors.surname = 'Los apellidos solo pueden contener letras y espacios'
    } else if (formData.surname.trim().includes('  ')) {
      newErrors.surname = 'Los apellidos no pueden tener espacios dobles'
    }

    // Validar teléfono
    const phoneRegex = /^[679]\d{8}$/
    const cleanPhone = formData.phone.replace(/\s/g, '')
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio'
    } else if (cleanPhone.length !== 9) {
      newErrors.phone = 'El teléfono debe tener exactamente 9 dígitos'
    } else if (!/^\d+$/.test(cleanPhone)) {
      newErrors.phone = 'El teléfono solo puede contener números'
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = 'El teléfono debe empezar por 6, 7 o 9'
    }

    // Validar dirección
    if (formData.address.trim().length > 0) {
      if (formData.address.trim().length < 10) {
        newErrors.address = 'La dirección debe tener al menos 10 caracteres si se especifica'
      } else if (formData.address.trim().length > 200) {
        newErrors.address = 'La dirección no puede exceder 200 caracteres'
      } else if (!/^[a-zA-Z0-9áéíóúüñçÁÉÍÓÚÜÑÇ\s.,º-]+$/.test(formData.address.trim())) {
        newErrors.address = 'La dirección contiene caracteres no válidos'
      }
    }

    // Validar notas
    if (formData.notes.trim().length > 1000) {
      newErrors.notes = 'Las notas no pueden exceder 1000 caracteres'
    } else if (formData.notes.trim().length > 0 && formData.notes.trim().length < 10) {
      newErrors.notes = 'Las notas deben tener al menos 10 caracteres si se especifican'
    }
    // Validar contenido de las notas (evitar solo números o caracteres especiales)
    if (formData.notes.trim().length > 0) {
      const notesWithoutSpaces = formData.notes.trim().replace(/\s/g, '')
      if (/^[\d\W]+$/.test(notesWithoutSpaces)) {
        newErrors.notes = 'Las notas deben contener texto descriptivo, no solo números o símbolos'
      }
    }

    // Validar horas mensuales
    if (isNaN(formData.monthly_hours)) {
      newErrors.monthly_hours = 'Las horas deben ser un número válido'
    } else if (formData.monthly_hours < 0) {
      newErrors.monthly_hours = 'Las horas no pueden ser negativas'
    } else if (formData.monthly_hours > 200) {
      newErrors.monthly_hours = 'Las horas no pueden exceder 200 por mes'
    } else if (formData.monthly_hours % 0.5 !== 0) {
      newErrors.monthly_hours = 'Las horas deben ser múltiplos de 0.5 (ej: 1, 1.5, 2, 2.5...)'
    } else if (formData.monthly_hours === 0) {
      newErrors.monthly_hours = 'Las horas mensuales deben ser mayor que 0'
    }

    setErrors(newErrors)
    return Object.values(newErrors).every(error => error === '')
  }

  const formatPhoneNumber = (phone: string) => {
    // Remover espacios y caracteres no numéricos
    const cleaned = phone.replace(/\D/g, '')
    // Limitar a 9 dígitos
    const limited = cleaned.slice(0, 9)
    // Formatear como XXX XXX XXX
    if (limited.length <= 3) return limited
    if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`
    return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    setFormData({ ...formData, phone: formatted })
    
    // Limpiar error de teléfono si existe
    if (errors.phone) {
      setErrors({ ...errors, phone: '' })
    }
  }

  const handleNameChange = (value: string) => {
    // Evitar números y caracteres especiales en nombres
    const nameValue = value.replace(/[^a-zA-ZáéíóúüñçÁÉÍÓÚÜÑÇ\s]/g, '')
    setFormData({ ...formData, name: nameValue })
    
    if (errors.name) {
      setErrors({ ...errors, name: '' })
    }
  }

  const handleSurnameChange = (value: string) => {
    // Evitar números y caracteres especiales en apellidos
    const surnameValue = value.replace(/[^a-zA-ZáéíóúüñçÁÉÍÓÚÜÑÇ\s]/g, '')
    setFormData({ ...formData, surname: surnameValue })
    
    if (errors.surname) {
      setErrors({ ...errors, surname: '' })
    }
  }

  const handleAddressChange = (value: string) => {
    setFormData({ ...formData, address: value })
    
    if (errors.address) {
      setErrors({ ...errors, address: '' })
    }
  }

  const handleNotesChange = (value: string) => {
    setFormData({ ...formData, notes: value })
    
    if (errors.notes) {
      setErrors({ ...errors, notes: '' })
    }
  }

  const handleMonthlyHoursChange = (value: string) => {
    const numericValue = parseFloat(value)
    if (!isNaN(numericValue) || value === '') {
      setFormData({ ...formData, monthly_hours: value === '' ? 0 : numericValue })
      
      if (errors.monthly_hours) {
        setErrors({ ...errors, monthly_hours: '' })
      }
    }
  }

  const handleSave = async () => {
    if (!user) return

    // Validar formulario
    if (!validateForm()) {
      showToast('Por favor, corrige los errores en el formulario', 'error')
      return
    }

    setSaving(true)
    try {
      console.log('Datos a actualizar:', {
        name: formData.name,
        surname: formData.surname,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        is_active: formData.is_active,
        monthly_hours: formData.monthly_hours
      })

      const { data, error } = await supabase
        .from('users')
        .update({
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          phone: formData.phone.replace(/\s/g, ''), // Guardar sin espacios
          address: formData.address.trim(),
          notes: formData.notes.trim(),
          is_active: formData.is_active,
          monthly_hours: formData.monthly_hours
        })
        .eq('id', userId)
        .select()

      console.log('Respuesta de Supabase:', { data, error })

      if (error) {
        console.error('Error de Supabase:', error)
        throw new Error(`Error de base de datos: ${error.message || 'Error desconocido'}`)
      }

      console.log('Usuario actualizado exitosamente:', data)
      showToast('Usuario actualizado correctamente', 'success')
      
      // Redirigir después de un breve delay para que se vea la notificación
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Error updating user:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar los cambios'
      showToast(`Error al guardar: ${errorMessage}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Usuario no encontrado</p>
            <Link href="/dashboard">
              <Button className="mt-4">Volver al Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                🏢 Gestión Administrativa - Editar Usuario
              </h1>
              <p className="text-slate-600">
                Configurando datos de <span className="font-semibold">{user.name} {user.surname}</span> para planning de trabajadoras
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  👩‍💼 Administración
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  📋 Planning Management
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href="/dashboard">
              <Button variant="secondary">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </Link>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Datos Personales */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Personales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Nombre del usuario"
                  className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : ''}`}
                  maxLength={50}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  value={formData.surname}
                  onChange={(e) => handleSurnameChange(e.target.value)}
                  placeholder="Apellidos del usuario"
                  className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.surname ? 'border-red-500' : ''}`}
                  maxLength={100}
                />
                {errors.surname && (
                  <p className="text-sm text-red-600 mt-1">{errors.surname}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="123 456 789"
                  className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phone ? 'border-red-500' : ''}`}
                  maxLength={11} // Para permitir espacios en el formato
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Formato: 123 456 789 (debe empezar por 6, 7 o 9)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="Dirección completa (ej: Calle Mayor 123, 1º A, Madrid)"
                  className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.address ? 'border-red-500' : ''}`}
                  maxLength={200}
                />
                {errors.address && (
                  <p className="text-sm text-red-600 mt-1">{errors.address}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Opcional. Si se especifica, debe ser una dirección completa
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configuración del Servicio */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
                <label className="block text-lg font-bold text-blue-800 mb-3 text-center">
                  ⏰ Horas Mensuales Asignadas *
                </label>
                
                {/* Input prominente */}
                <div className="relative mb-4">
                  <input
                    type="number"
                    min="0.5"
                    max="200"
                    step="0.5"
                    value={formData.monthly_hours}
                    onChange={(e) => handleMonthlyHoursChange(e.target.value)}
                    placeholder="0.5"
                    className={`w-full text-center text-3xl font-bold py-4 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.monthly_hours 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-blue-300 bg-white'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-2xl font-bold">
                    h
                  </span>
                </div>

                {/* Vista previa en grande */}
                <div className="text-center mb-4">
                  <div className="text-sm font-medium text-blue-600 mb-1">Vista Previa:</div>
                  <div className="text-5xl font-bold text-blue-900">
                    {formData.monthly_hours || '0'}
                    <span className="text-3xl font-semibold text-blue-700">h</span>
                  </div>
                  <div className="text-sm text-blue-600 font-medium mt-1">
                    Por mes
                  </div>
                </div>

                {errors.monthly_hours && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-3">
                    <p className="text-sm text-red-800 font-medium text-center">
                      ⚠️ {errors.monthly_hours}
                    </p>
                  </div>
                )}
                
                <div className="bg-blue-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-700 font-medium mb-1">
                    📊 Rango válido: 0.5 - 200 horas
                  </p>
                  <p className="text-xs text-blue-600">
                    Debe ser múltiplo de 0.5 (ej: 1, 1.5, 2, 2.5...)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                  Usuario activo
                </label>
              </div>
              <p className="text-xs text-slate-500">
                Los usuarios inactivos no aparecerán en las listas de trabajo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Notas del Usuario */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Notas y Referencias</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notas para las compañeras
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Escribe aquí cualquier información importante para las compañeras que trabajen con este usuario: preferencias, necesidades especiales, horarios recomendados, etc."
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.notes ? 'border-red-500' : 'border-slate-300'
                }`}
                rows={4}
                maxLength={1000}
              />
              {errors.notes && (
                <p className="text-sm text-red-600 mt-1">{errors.notes}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {formData.notes.length}/1000 caracteres
                {formData.notes.length > 0 && formData.notes.length < 10 && ' (mínimo 10 caracteres)'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Resumen para Planning */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resumen para Planning Administrativo</span>
              <span className="text-sm font-normal text-slate-500">
                Para asignar a trabajadoras
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Horas Totales - Prominente */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 text-center">
                <div className="text-lg font-bold text-blue-600 mb-3">
                  📋 Horas Totales Asignadas
                </div>
                <div className="text-6xl font-bold text-blue-900 mb-2">
                  {formData.monthly_hours}
                  <span className="text-3xl font-semibold text-blue-700">h</span>
                </div>
                <div className="text-sm font-medium text-blue-600">
                  Por mes • Para distribuir entre trabajadoras
                </div>
                <div className="mt-3 text-xs text-blue-500 bg-blue-50 rounded-lg p-2">
                  💡 Esta es la cantidad total que se debe cubrir mensualmente
                </div>
              </div>

              {/* Información del Usuario */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-6">
                <div className="text-lg font-bold text-slate-700 mb-4">
                  👤 Información del Usuario
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="font-medium text-slate-600">Nombre:</span>
                    <span className="font-bold text-slate-800">
                      {formData.name} {formData.surname}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="font-medium text-slate-600">Teléfono:</span>
                    <span className="font-mono text-slate-800">{formData.phone}</span>
                  </div>
                  {formData.address && (
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="font-medium text-slate-600">Dirección:</span>
                      <span className="text-slate-800 text-sm">{formData.address}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="font-medium text-slate-600">Estado:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      formData.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formData.is_active ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notas importantes para trabajadoras */}
            {formData.notes && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-amber-800">
                    Notas Importantes para las Trabajadoras
                  </span>
                </div>
                <div className="bg-white rounded-lg p-3 text-slate-700">
                  {formData.notes}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-green-800 font-bold mb-2">
                🎯 Próximo Paso: Crear Planning
              </div>
              <div className="text-sm text-green-700 mb-3">
                Una vez guardados los cambios, podrás asignar este usuario a trabajadoras específicas y generar su planning mensual.
              </div>
              <div className="text-xs text-green-600 bg-green-100 rounded-lg p-2">
                💡 Las trabajadoras recibirán: datos del usuario, horas asignadas, y estas notas importantes
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {ToastComponent}
    </div>
  )
} 