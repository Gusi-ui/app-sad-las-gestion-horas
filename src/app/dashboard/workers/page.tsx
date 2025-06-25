'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkers } from '@/hooks/useWorkers'
import { useToast } from '@/components/ui/toast'
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Clock, 
  Phone, 
  Mail,
  Edit,
  Trash2,
  Star,
  UserCheck,
  UserX,
  CalendarDays,
  Euro
} from 'lucide-react'
import { Worker, WorkerSpecialization } from '@/lib/types'

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

export default function WorkersPage() {
  const { workers, workerStats, isLoading, error, deleteWorker } = useWorkers()
  const { showToast, ToastComponent } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (worker: Worker) => {
    if (!confirm(`¿Estás segura de que quieres eliminar a ${worker.name} ${worker.surname}?`)) {
      return
    }

    setDeletingId(worker.id)
    try {
      const { error } = await deleteWorker(worker.id)
      if (error) {
        showToast(`Error al eliminar: ${error}`, 'error')
      } else {
        showToast(`${worker.name} ${worker.surname} eliminada correctamente`, 'success')
      }
    } catch (err) {
      showToast('Error inesperado al eliminar', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const getWorkerStats = (workerId: string) => {
    return workerStats.find(stat => stat.id === workerId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando trabajadoras...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Error al cargar trabajadoras: {error}</p>
            <Link href="/dashboard">
              <Button>Volver al Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                👩‍💼 Gestión de Trabajadoras
              </h1>
              <p className="text-slate-600">
                Administra el equipo de profesionales del servicio
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  🏢 Sistema Administrativo
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  👥 Gestión de RRHH
                </span>
              </div>
            </div>
          </div>
          <Link href="/dashboard/workers/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Trabajadora
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Trabajadoras</p>
                  <p className="text-2xl font-bold text-slate-900">{workers.length}</p>
                  <p className="text-xs text-slate-500">En plantilla</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Activas</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {workers.filter(w => w.is_active).length}
                  </p>
                  <p className="text-xs text-slate-500">Disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Horas/Semana</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {workerStats.reduce((sum, stat) => sum + stat.total_weekly_hours, 0)}
                  </p>
                  <p className="text-xs text-slate-500">Asignadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Euro className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Tarifa Media</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {workers.length > 0 
                      ? (workers.reduce((sum, w) => sum + w.hourly_rate, 0) / workers.length).toFixed(1)
                      : '0'
                    }€
                  </p>
                  <p className="text-xs text-slate-500">Por hora</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workers List */}
        {workers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No hay trabajadoras registradas
              </h3>
              <p className="text-slate-600 mb-6">
                Comienza agregando las primeras trabajadoras a tu equipo
              </p>
              <Link href="/dashboard/workers/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Primera Trabajadora
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {workers.map((worker) => {
              const stats = getWorkerStats(worker.id)
              return (
                <Card key={worker.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Main Info */}
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 bg-slate-100 rounded-lg">
                          <Users className="w-6 h-6 text-slate-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {worker.name} {worker.surname}
                            </h3>
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
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="flex items-center text-sm text-slate-600">
                              <Phone className="w-4 h-4 mr-2" />
                              {worker.phone}
                            </div>
                            {worker.email && (
                              <div className="flex items-center text-sm text-slate-600">
                                <Mail className="w-4 h-4 mr-2" />
                                {worker.email}
                              </div>
                            )}
                            <div className="flex items-center text-sm text-slate-600">
                              <Euro className="w-4 h-4 mr-2" />
                              {worker.hourly_rate}€/h
                            </div>
                          </div>

                          {/* Especializations */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {worker.specializations.map((spec) => (
                              <span
                                key={spec}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${specializationColors[spec]}`}
                              >
                                {specializationLabels[spec]}
                              </span>
                            ))}
                          </div>

                          {/* Stats */}
                          {stats && (
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <div className="font-semibold text-blue-900">{stats.active_assignments}</div>
                                <div className="text-blue-600">Asignaciones</div>
                              </div>
                              <div className="bg-green-50 rounded-lg p-3 text-center">
                                <div className="font-semibold text-green-900">{stats.total_weekly_hours}h</div>
                                <div className="text-green-600">Trabajadas/sem</div>
                              </div>
                              <div className="bg-amber-50 rounded-lg p-3 text-center">
                                <div className="font-semibold text-amber-900">{stats.available_hours}h</div>
                                <div className="text-amber-600">Disponibles</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <Link href={`/dashboard/workers/${worker.id}`}>
                          <Button variant="secondary" size="sm">
                            Ver Detalles
                          </Button>
                        </Link>
                        <Link href={`/dashboard/workers/${worker.id}/edit`}>
                          <Button variant="secondary" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleDelete(worker)}
                          disabled={deletingId === worker.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {deletingId === worker.id ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      {ToastComponent}
    </div>
  )
} 