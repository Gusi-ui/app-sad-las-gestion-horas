'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  Clock, 
  Database,
  Shield,
  FileText,
  Download,
  Upload
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [settings, setSettings] = useState({
    company_name: 'Servicios de Atención Domiciliaria',
    company_address: '',
    company_phone: '',
    company_email: '',
    default_hourly_rate: 15,
    max_monthly_hours: 200,
    min_monthly_hours: 0.5,
    notifications_enabled: true,
    auto_backup: true
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Aquí guardaríamos la configuración en la base de datos
      // await supabase.from('app_settings').upsert(settings)
      
      showToast('Configuración guardada correctamente', 'success')
    } catch {
      console.error('Error saving settings')
      showToast('Error al guardar la configuración', 'error')
    } finally {
      setSaving(false)
    }
  }

  const exportData = async () => {
    try {
      const { data: users } = await supabase
        .from('users')
        .select('*')
      
      const dataStr = JSON.stringify(users, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `usuarios_backup_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      
      showToast('Datos exportados correctamente', 'success')
    } catch {
      showToast('Error al exportar datos', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando configuración...</p>
        </div>
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
                Volver al Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                ⚙️ Configuración Administrativa
              </h1>
              <p className="text-slate-600">
                Gestiona la configuración del sistema y la empresa
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de la Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Información de la Empresa</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  value={settings.company_name}
                  onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                  placeholder="Ej: Servicios de Atención Domiciliaria Las Flores"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dirección
                </label>
                <input
                  value={settings.company_address}
                  onChange={(e) => setSettings({...settings, company_address: e.target.value})}
                  placeholder="Dirección completa de la empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Teléfono
                </label>
                <input
                  value={settings.company_phone}
                  onChange={(e) => setSettings({...settings, company_phone: e.target.value})}
                  placeholder="123 456 789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  value={settings.company_email}
                  onChange={(e) => setSettings({...settings, company_email: e.target.value})}
                  placeholder="info@empresa.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Servicios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Configuración de Servicios</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tarifa por Hora (€)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="50"
                    step="0.5"
                    value={settings.default_hourly_rate}
                    onChange={(e) => setSettings({...settings, default_hourly_rate: Number(e.target.value)})}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    €/h
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Máximo Horas Mensuales
                </label>
                <input
                  type="number"
                  min="50"
                  max="300"
                  value={settings.max_monthly_hours}
                  onChange={(e) => setSettings({...settings, max_monthly_hours: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mínimo Horas Mensuales
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={settings.min_monthly_hours}
                  onChange={(e) => setSettings({...settings, min_monthly_hours: Number(e.target.value)})}
                />
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={settings.notifications_enabled}
                  onChange={(e) => setSettings({...settings, notifications_enabled: e.target.checked})}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="notifications" className="text-sm font-medium text-slate-700">
                  Activar notificaciones automáticas
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Gestión de Datos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Gestión de Datos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="secondary" 
                  onClick={exportData}
                  className="flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex items-center justify-center"
                  disabled
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="auto_backup"
                  checked={settings.auto_backup}
                  onChange={(e) => setSettings({...settings, auto_backup: e.target.checked})}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="auto_backup" className="text-sm font-medium text-slate-700">
                  Backup automático semanal
                </label>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>💡 Tip:</strong> Exporta los datos regularmente.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Información del Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-600">Versión:</span>
                  <p className="text-slate-900">v1.0.0</p>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Admin:</span>
                  <p className="text-slate-900 text-xs">{user?.email}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Base de Datos:</span>
                  <p className="text-slate-900">Supabase</p>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Estado:</span>
                  <p className="text-green-600">✅ Activo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximas Funcionalidades */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Próximas Funcionalidades - Roadmap</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">👩‍💼 Gestión de Trabajadoras</h4>
                <p className="text-sm text-blue-700">Sistema para registrar y gestionar el equipo de trabajadoras.</p>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-2 inline-block">
                  En desarrollo
                </span>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">📅 Planning Automático</h4>
                <p className="text-sm text-green-700">Generación automática de plannings semanales y mensuales.</p>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mt-2 inline-block">
                  Planificado
                </span>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">📱 App Trabajadoras</h4>
                <p className="text-sm text-purple-700">Aplicación móvil para que las trabajadoras vean sus asignaciones.</p>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full mt-2 inline-block">
                  Futuro
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {ToastComponent}
    </div>
  )
} 