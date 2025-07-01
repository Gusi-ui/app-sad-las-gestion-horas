'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkers } from '@/hooks/useWorkers'
import { useToast } from '@/components/ui/toast'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  Euro,
  User,
  Shield,
  Star,
  UserCheck,
  UserX,
  AlertTriangle,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
  LogOut,
  Menu
} from 'lucide-react'
import { Worker, WorkerSpecialization, WeekDay } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const specializationLabels: Record<WorkerSpecialization, string> = {
  elderly_care: '👴 Personas Mayores',
  disability_care: '♿ Discapacidad',
  medical_assistance: '🏥 Asistencia Médica',
  companionship: '🤝 Acompañamiento'
}

const specializationColors: Record<WorkerSpecialization, string> = {
  elderly_care: 'bg-blue-100 text-blue-800',
  disability_care: 'bg-purple-100 text-purple-800',
  medical_assistance: 'bg-red-100 text-red-800',
  companionship: 'bg-green-100 text-green-800'
}

const dayLabels: Record<WeekDay, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

export default function WorkerDetailsPage() {
  const params = useParams()
  const workerId = params.id as string
  const { workerStats, getWorkerById } = useWorkers()
  const { showToast, ToastComponent } = useToast()
  const router = useRouter()
  
  const [worker, setWorker] = useState<Worker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const { data, error } = await getWorkerById(workerId)
        
        if (error) {
          throw new Error(error)
        }
        
        setWorker(data)
      } catch (err) {
        console.error('Error fetching worker:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar trabajadora')
      } finally {
        setIsLoading(false)
      }
    }

    if (workerId) {
      fetchWorker()
    }
  }, [workerId, getWorkerById])

  const handleDelete = async () => {
    if (!workerId) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('workers')
        .update({ is_active: false })
        .eq('id', workerId)

      if (error) {
        showToast('Error al eliminar el trabajador', 'error')
        return
      }

      showToast('Trabajador eliminado correctamente', 'success')
      router.push('/dashboard/workers')
    } catch {
      showToast('Error al eliminar el trabajador', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const getWorkerStats = () => {
    return workerStats.find(stat => stat.id === workerId)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando información de la trabajadora...</p>
        </div>
      </div>
    )
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">
              {error || 'No se pudo encontrar la trabajadora'}
            </p>
            <Link href="/dashboard/workers">
              <Button>Volver a Trabajadoras</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = getWorkerStats()

  console.log('Worker details page rendering:', { worker, isLoading, error })

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-red-100 shadow-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center py-4">
            <Button variant="secondary" size="sm" onClick={() => router.back()} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
            <h1 className="text-xl font-bold text-slate-900 truncate flex-1">Detalle de Trabajadora</h1>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Worker Info Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                👩‍💼 {worker.name} {worker.surname}
              </h1>
              <p className="text-slate-600">
                Información detallada y estadísticas de rendimiento
              </p>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  worker.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {worker.is_active ? (
                    <>
                      <UserCheck className="w-3 h-3 mr-1" />
                      Activa
                    </>
                  ) : (
                    <>
                      <UserX className="w-3 h-3 mr-1" />
                      Inactiva
                    </>
                  )}
                </span>
                <span className="text-xs text-slate-500">
                  ID: {worker.id.slice(0, 8)}...
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link href={`/dashboard/workers/${worker.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </Link>
              {worker.is_active && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-600">Teléfono</p>
                      <p className="font-medium">{worker.phone}</p>
                    </div>
                  </div>
                  {worker.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-600">Email</p>
                        <p className="font-medium">{worker.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {worker.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-slate-500 mt-1" />
                    <div>
                      <p className="text-sm text-slate-600">Dirección</p>
                      <p className="font-medium">{worker.address}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {worker.dni && (
                    <div>
                      <p className="text-sm text-slate-600">DNI</p>
                      <p className="font-medium">{worker.dni}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-600">Fecha de Contratación</p>
                    <p className="font-medium">
                      {new Date(worker.hire_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Configuración Laboral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <Euro className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Tarifa por Hora</p>
                    <p className="text-xl font-bold text-emerald-900">{worker.hourly_rate}€</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Máx. Horas/Semana</p>
                    <p className="text-xl font-bold text-blue-900">{worker.max_weekly_hours}h</p>
                  </div>
                  {stats && (
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <Star className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Horas Disponibles</p>
                      <p className="text-xl font-bold text-amber-900">{stats.available_hours}h</p>
                    </div>
                  )}
                </div>

                {/* Specializations */}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">Especializaciones</p>
                  <div className="flex flex-wrap gap-2">
                    {worker.specializations.map((spec) => (
                      <span
                        key={spec}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${specializationColors[spec]}`}
                      >
                        {specializationLabels[spec]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">Días Disponibles</p>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {Object.entries(dayLabels).map(([day, label]) => {
                      const isAvailable = worker.availability_days.includes(day as WeekDay)
                      return (
                        <div
                          key={day}
                          className={`text-center p-2 rounded-lg text-sm font-medium ${
                            isAvailable
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isAvailable ? (
                            <CheckCircle className="w-4 h-4 mx-auto mb-1" />
                          ) : (
                            <XCircle className="w-4 h-4 mx-auto mb-1" />
                          )}
                          {label}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {(worker.emergency_contact_name || worker.emergency_contact_phone) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Contacto de Emergencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {worker.emergency_contact_name && (
                      <div>
                        <p className="text-sm text-slate-600">Nombre</p>
                        <p className="font-medium">{worker.emergency_contact_name}</p>
                      </div>
                    )}
                    {worker.emergency_contact_phone && (
                      <div>
                        <p className="text-sm text-slate-600">Teléfono</p>
                        <p className="font-medium">{worker.emergency_contact_phone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {worker.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>📝 Notas y Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{worker.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Statistics */}
          <div className="space-y-6">
            {/* Work Statistics */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Estadísticas de Trabajo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-slate-600">Asignaciones Activas</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.active_assignments}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-slate-600">Horas Trabajadas/Semana</p>
                    <p className="text-3xl font-bold text-green-900">{stats.total_weekly_hours}h</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-slate-600">Total Asignaciones</p>
                    <p className="text-3xl font-bold text-purple-900">{stats.total_assignments}</p>
                  </div>

                  {/* Workload Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span>Carga de Trabajo</span>
                      <span>{Math.round((stats.total_weekly_hours / stats.max_weekly_hours) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((stats.total_weekly_hours / stats.max_weekly_hours) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>🚀 Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/assignments">
                  <Button variant="secondary" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Ver Todas las Asignaciones
                  </Button>
                </Link>
                <Link href={`/dashboard/assignments/new?worker_id=${worker.id}`}>
                  <Button variant="secondary" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Asignación
                  </Button>
                </Link>
                <Link href="/dashboard/planning">
                  <Button variant="secondary" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver Planning
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle>ℹ️ Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Creado:</span>
                  <span className="font-medium">
                    {new Date(worker.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Actualizado:</span>
                  <span className="font-medium">
                    {new Date(worker.updated_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ID:</span>
                  <span className="font-mono text-xs">{worker.id}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {ToastComponent}
      {/* Footer de navegación fijo */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
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