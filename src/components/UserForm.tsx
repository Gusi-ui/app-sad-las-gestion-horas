'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, X } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  surname: string
  phone: string
  address: string | null
  notes: string | null
  is_active: boolean
  monthly_hours: number
}

interface UserFormProps {
  user?: User | null
  isEditing?: boolean
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export interface UserFormData {
  name: string
  surname: string
  phone: string
  address: string
  notes: string
  is_active: boolean
  monthly_hours: number
}

export function UserForm({ 
  user, 
  isEditing = false, 
  onSubmit, 
  onCancel, 
  loading = false 
}: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
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

  // Cargar datos del usuario solo una vez cuando se monta el componente
  useEffect(() => {
    if (isEditing && user) {
      setFormData({
        name: user.name || '',
        surname: user.surname || '',
        phone: user.phone || '',
        address: user.address || '',
        notes: user.notes || '',
        monthly_hours: user.monthly_hours || 0,
        is_active: user.is_active ?? true
      })
    }
  }, [isEditing, user])

  // Validaciones simplificadas para debug
  const validateForm = () => {
    const newErrors = {
      name: '',
      surname: '',
      phone: '',
      address: '',
      notes: '',
      monthly_hours: ''
    }

    // Solo validaciones básicas
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio'
    }

    if (!formData.surname.trim()) {
      newErrors.surname = 'Los apellidos son obligatorios'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio'
    }

    if (formData.monthly_hours <= 0) {
      newErrors.monthly_hours = 'Las horas deben ser mayor que 0'
    }

    // console.log('🔍 Validation result:', { 
    //   hasErrors: Object.values(newErrors).some(e => e !== ''),
    //   errors: newErrors 
    // })

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
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
  }

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
  }

  const handleSurnameChange = (value: string) => {
    setFormData(prev => ({ ...prev, surname: value }));
    if (errors.surname) setErrors(prev => ({ ...prev, surname: '' }));
  }

  const handleAddressChange = (value: string) => {
    setFormData(prev => ({ ...prev, address: value }));
    if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
  }

  const handleNotesChange = (value: string) => {
    setFormData(prev => ({ ...prev, notes: value }));
    if (errors.notes) setErrors(prev => ({ ...prev, notes: '' }));
  }

  const handleMonthlyHoursChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, monthly_hours: numValue }));
    if (errors.monthly_hours) setErrors(prev => ({ ...prev, monthly_hours: '' }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // console.log('🔍 Form submission started')
    // console.log('📝 Form data:', formData)
    
    if (!validateForm()) {
      // console.log('❌ Form validation failed')
      // console.log('🚨 Errors:', errors)
      return
    }

    // console.log('✅ Form validation passed, calling onSubmit')
    await onSubmit(formData)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          {/* Top row - Navigation and title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {isEditing ? 'Editar' : 'Nuevo'} Usuario
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  {isEditing 
                    ? `Configurando datos de ${user?.name} ${user?.surname}`
                    : 'Creando nuevo usuario'
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Bottom row - Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              variant="secondary" 
              onClick={onCancel}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Usuario')}
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
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
                    maxLength={11}
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
                    Horas Mensuales Asignadas *
                  </label>
                  
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

                  <div className="text-center mb-4">
                    <div className="text-sm font-medium text-blue-600 mb-1">Vista Previa:</div>
                    <div className="text-5xl font-bold text-blue-900">
                      {formData.monthly_hours || 0}
                      <span className="text-3xl text-blue-700">h</span>
                    </div>
                    <div className="text-sm text-blue-600">
                      por mes
                    </div>
                  </div>

                  {errors.monthly_hours && (
                    <div className="text-center">
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                        {errors.monthly_hours}
                      </p>
                    </div>
                  )}

                  <div className="text-center text-xs text-blue-700 space-y-1">
                    <p>• Mínimo: 0.5 horas</p>
                    <p>• Máximo: 200 horas</p>
                    <p>• Incrementos de 0.5 horas</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div>
                      <div className="font-bold text-green-800">Usuario Activo</div>
                      <div className="text-sm text-green-700">
                        {formData.is_active 
                          ? 'El usuario puede recibir asignaciones' 
                          : 'El usuario está inactivo y no recibirá asignaciones'
                        }
                      </div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notas */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notas y Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={formData.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Información adicional sobre el usuario, preferencias especiales, instrucciones para las trabajadoras, etc..."
                className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.notes ? 'border-red-500' : ''}`}
                rows={4}
                maxLength={1000}
              />
              {errors.notes && (
                <p className="text-sm text-red-600 mt-1">{errors.notes}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Opcional. Máximo 1000 caracteres. Si se especifica, debe tener al menos 10 caracteres.
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
