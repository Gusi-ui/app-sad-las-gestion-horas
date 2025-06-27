'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAssignments } from '@/hooks/useAssignments'
import { useToast } from '@/components/ui/toast'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Users, 
  Clock, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Pause,
  XCircle,
  Euro,
  FileText,
  Play
} from 'lucide-react'
import { Assignment, AssignmentStatus } from '@/lib/types'

const statusLabels: Record<AssignmentStatus, string> = {
  active: 'Activa',
  paused: 'Pausada',
  completed: 'Completada',
  cancelled: 'Cancelada'
}

const statusColors: Record<AssignmentStatus, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
}

const statusIcons: Record<AssignmentStatus, any> = {
  active: CheckCircle,
  paused: Pause,
  completed: CheckCircle,
  cancelled: XCircle
}

const priorityLabels = {
  1: 'Alta',
  2: 'Media',
  3: 'Baja'
}

const priorityColors: Record<number, string> = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-yellow-100 text-yellow-800',
  3: 'bg-green-100 text-green-800'
}

export default function AssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.id as string
  
  const { getAssignmentById, deleteAssignment } = useAssignments()
  const { showToast, ToastComponent } = useToast()
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const { data, error } = await getAssignmentById(assignmentId)
        
        if (error) {
          setError(error)
        } else if (data) {
          setAssignment(data)
        } else {
          setError('Asignación no encontrada')
        }
      } catch (err) {
        setError('Error al cargar la asignación')
      } finally {
        setIsLoading(false)
      }
    }

    if (assignmentId) {
      fetchAssignment()
    }
  }, [assignmentId, getAssignmentById])

  const handleDelete = async () => {
    if (!assignment) return
    
    if (!confirm(`¿Estás segura de que quieres eliminar esta asignación?\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const { error } = await deleteAssignment(assignment.id)
      if (error) {
        showToast(`Error al eliminar: ${error}`, 'error')
      } else {
        showToast('Asignación eliminada correctamente', 'success')
        router.push('/dashboard/assignments')
      }
    } catch {
      showToast('Error inesperado al eliminar', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusIcon = () => {
    switch (assignment?.status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'paused':
        return <Pause className="w-4 h-4 text-amber-600" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (assignment?.status) {
      case 'active':
        return 'Activa'
      case 'paused':
        return 'Pausada'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Desconocido'
    }
  }

  const getPriorityText = () => {
    switch (assignment?.priority) {
      case 1:
        return 'Alta'
      case 2:
        return 'Media'
      case 3:
        return 'Baja'
      default:
        return 'No especificada'
    }
  }

  const formatSchedule = (schedule: Record<string, string[]> | undefined) => {
    if (!schedule) return 'No configurado'
    
    const days = Object.entries(schedule)
      .filter(([, times]) => times && times.length >= 2)
      .map(([day, times]) => {
        const dayNames: Record<string, string> = {
          monday: 'Lunes',
          tuesday: 'Martes',
          wednesday: 'Miércoles',
          thursday: 'Jueves',
          friday: 'Viernes',
          saturday: 'Sábado',
          sunday: 'Domingo'
        }
        return `${dayNames[day]}: ${times[0]} - ${times[1]}`
      })
    
    return days.length > 0 ? days.join(', ') : 'No configurado'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando asignación...</p>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">
              {error || 'Asignación no encontrada'}
            </p>
            <Link href="/dashboard/assignments">
              <Button>Volver a Asignaciones</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const StatusIcon = statusIcons[assignment.status]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/assignments">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Lista
              </Button>
            </Link>
            <Link href="/dashboard/planning">
              <Button variant="secondary" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Planning
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                📋 Detalle de Asignación
              </h1>
              <p className="text-slate-600">
                Información completa de la asignación trabajadora-usuario
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/dashboard/assignments/${assignment.id}/edit`}>
              <Button variant="secondary">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Status and Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Estado y Prioridad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[assignment.status]}`}>
                  <StatusIcon className="w-4 h-4 mr-2" />
                  {getStatusText()}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[assignment.priority]}`}>
                  Prioridad {getPriorityText()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Detalles de la Asignación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Información General</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-slate-500" />
                      <span className="text-slate-600">Horas por semana:</span>
                      <span className="ml-2 font-medium">{assignment.assigned_hours_per_week}h</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                      <span className="text-slate-600">Fecha de inicio:</span>
                      <span className="ml-2 font-medium">
                        {new Date(assignment.start_date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    {assignment.end_date && (
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                        <span className="text-slate-600">Fecha de fin:</span>
                        <span className="ml-2 font-medium">
                          {new Date(assignment.end_date).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <Euro className="w-4 h-4 mr-2 text-slate-500" />
                      <span className="text-slate-600">Tarifa por hora:</span>
                      <span className="ml-2 font-medium">{assignment.worker?.hourly_rate || 0}€</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Horario Específico</h4>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm text-slate-700">{formatSchedule(assignment.specific_schedule)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Worker Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Información de la Trabajadora
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignment.worker ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">
                      {assignment.worker.name} {assignment.worker.surname}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-2 text-slate-500" />
                        <span className="text-slate-600">{assignment.worker.phone}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Euro className="w-4 h-4 mr-2 text-slate-500" />
                        <span className="text-slate-600">Tarifa:</span>
                        <span className="ml-2 font-medium">{assignment.worker.hourly_rate}€/h</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Especializaciones</h4>
                    <div className="flex flex-wrap gap-2">
                      {assignment.worker.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">Información de trabajadora no disponible</p>
              )}
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Información del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignment.user ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">
                      {assignment.user.name} {assignment.user.surname}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-2 text-slate-500" />
                        <span className="text-slate-600">{assignment.user.phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Información Adicional</h4>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <span className="text-slate-600">Estado:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {assignment.user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">Información de usuario no disponible</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {assignment.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-slate-700 whitespace-pre-wrap">{assignment.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {ToastComponent}
    </div>
  )
} 