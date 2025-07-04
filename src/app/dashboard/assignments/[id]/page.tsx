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
  Users, 
  Clock, 
  Calendar,
  Phone,
  AlertTriangle,
  CheckCircle,
  Pause,
  XCircle,
  Euro,
  FileText
} from 'lucide-react'
import { Assignment, AssignmentStatus } from '@/lib/types'

const statusColors: Record<AssignmentStatus, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
}

const statusIcons: Record<AssignmentStatus, React.ComponentType<{ className?: string }>> = {
  active: CheckCircle,
  paused: Pause,
  completed: CheckCircle,
  cancelled: XCircle
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
  // const [isDeleting, setIsDeleting] = useState(false)

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
      } catch {
        setError('Error al cargar la asignación')
      } finally {
        setIsLoading(false)
      }
    }

    if (assignmentId) {
      fetchAssignment()
    }
  }, [assignmentId, getAssignmentById])

  // const handleDelete = async () => {
  //   if (!assignment) return
    
  //   if (!confirm(`¿Estás segura de que quieres eliminar esta asignación?\n\nEsta acción no se puede deshacer.`)) {
  //     return
  //   }

  //   setIsDeleting(true)
  //   try {
  //     const { error } = await deleteAssignment(assignment.id)
  //     if (error) {
  //         showToast(`Error al eliminar: ${error}`, 'error')
  //     } else {
  //         showToast('Asignación eliminada correctamente', 'success')
  //         router.push('/dashboard/assignments')
  //     }
  //   } catch {
  //     showToast('Error inesperado al eliminar', 'error')
  //   } finally {
  //     setIsDeleting(false)
  //   }
  // }

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

  const formatSchedule = (schedule: Record<string, any[]> | undefined) => {
    if (!schedule) return 'No configurado'
    const dayNames: Record<string, string> = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    }
    return Object.entries(schedule)
      .filter(([, slots]) => slots && slots.length > 0)
      .map(([day, slots]) => {
        // slots puede ser string[] (antiguo) o TimeSlot[] (nuevo)
        if (slots.length === 2 && typeof slots[0] === 'string' && typeof slots[1] === 'string') {
          // Formato antiguo
          return `${dayNames[day]}: ${slots[0]} - ${slots[1]}`
        } else if (typeof slots[0] === 'object' && slots[0] !== null && 'start' in slots[0] && 'end' in slots[0]) {
          // Formato nuevo
          return `${dayNames[day]}: ` + slots.map((slot: any) => `${slot.start} - ${slot.end}`).join(', ')
        } else {
          return null
        }
      })
      .filter(Boolean)
      .join(', ')
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
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header sticky mobile-first */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center py-4">
            <Button variant="secondary" size="sm" onClick={() => router.back()} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
            <h1 className="text-xl font-bold text-slate-900 truncate flex-1">Detalle de Asignación</h1>
            <Link href={`/dashboard/assignments/${assignment.id}/edit`}>
              <Button variant="secondary" size="sm" className="ml-2">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
      {/* Footer de navegación fijo */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
        <nav className="flex justify-around py-3">
          <Link href="/dashboard/users" className="flex flex-col items-center text-xs text-slate-600 hover:text-blue-600 transition-colors">
            <Users className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Usuarios</span>
          </Link>
          <Link href="/dashboard/workers" className="flex flex-col items-center text-xs text-slate-600 hover:text-green-600 transition-colors">
            <Users className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Trabajadoras</span>
          </Link>
          <Link href="/dashboard/assignments" className="flex flex-col items-center text-xs text-blue-600 transition-colors">
            <Clock className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Asignaciones</span>
          </Link>
          <Link href="/dashboard/planning" className="flex flex-col items-center text-xs text-slate-600 hover:text-blue-600 transition-colors">
            <Calendar className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Planning</span>
          </Link>
          <Link href="/dashboard/settings" className="flex flex-col items-center text-xs text-slate-600 hover:text-slate-800 transition-colors">
            <FileText className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Configuración</span>
          </Link>
        </nav>
      </footer>
      <div className="h-20"></div>
    </div>
  )
} 