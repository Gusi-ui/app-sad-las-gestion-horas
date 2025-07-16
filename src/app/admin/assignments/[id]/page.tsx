'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Calendar, RotateCcw, Trash2, Users, Mail, Phone, MapPin } from 'lucide-react'
import { useNotificationHelpers } from '@/components/ui/toast-notification'
import ConfirmModal from '@/components/ui/confirm-modal'

interface Assignment {
  id: string
  worker_id: string
  user_id: string
  assignment_type: string
  start_date: string
  end_date: string | null
  weekly_hours: number
  status: string
  worker_name: string
  worker_surname: string
  worker_email: string
  worker_phone: string
  worker_address: string
  user_name: string
  user_surname: string
  user_email: string
  user_phone: string
  user_address: string
}

export default function AssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.id as string
  const { success, error: showError } = useNotificationHelpers()
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment()
    }
  }, [assignmentId])

  const fetchAssignment = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          worker_id,
          user_id,
          assignment_type,
          start_date,
          end_date,
          weekly_hours,
          status,
          workers!inner(
            name,
            surname,
            email,
            phone,
            address
          ),
          users!inner(
            name,
            surname,
            email,
            phone,
            address
          )
        `)
        .eq('id', assignmentId)
        .single()

      if (error) {
        showError('Error al cargar asignación: ' + error.message)
      } else {
        type AssignmentDB = Omit<Assignment, 'worker_name' | 'worker_surname' | 'worker_email' | 'worker_phone' | 'worker_address' | 'user_name' | 'user_surname' | 'user_email' | 'user_phone' | 'user_address'> & {
          workers?: { name: string; surname: string; email: string; phone: string; address: string }[] | { name: string; surname: string; email: string; phone: string; address: string } | null;
          users?: { name: string; surname: string; email: string; phone: string; address: string }[] | { name: string; surname: string; email: string; phone: string; address: string } | null;
        };
        const worker = getFirst((data as AssignmentDB).workers);
        const user = getFirst((data as AssignmentDB).users);
        const formattedData: Assignment = {
          id: data.id,
          worker_id: data.worker_id,
          user_id: data.user_id,
          assignment_type: data.assignment_type,
          start_date: data.start_date,
          end_date: data.end_date,
          weekly_hours: data.weekly_hours,
          status: data.status,
          worker_name: worker?.name || '',
          worker_surname: worker?.surname || '',
          worker_email: worker?.email || '',
          worker_phone: worker?.phone || '',
          worker_address: worker?.address || '',
          user_name: user?.name || '',
          user_surname: user?.surname || '',
          user_email: user?.email || '',
          user_phone: user?.phone || '',
          user_address: user?.address || ''
        };
        
        setAssignment(formattedData)
      }
    } catch (error) {
      showError('Error inesperado al cargar asignación')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAssignment = async () => {
    if (!supabase || !assignment) return
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', assignment.id)
      if (error) throw error
      success('Asignación eliminada correctamente')
      router.push('/admin/assignments')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      showError('Error al eliminar asignación: ' + errorMessage)
    }
  }

  const handleToggleStatus = async () => {
    if (!supabase || !assignment) {
      showError('Error: Cliente Supabase no disponible')
      return
    }
    
    try {
      const newStatus = assignment.status === 'active' ? 'cancelled' : 'active'
      
      const { data, error } = await supabase
        .from('assignments')
        .update({ status: newStatus })
        .eq('id', assignment.id)
        .select()

      if (error) {
        throw new Error(`Error de base de datos: ${error.message} (${error.code})`)
      }

      if (!data || data.length === 0) {
        throw new Error('No se encontró la asignación para actualizar')
      }
      
      setAssignment({ ...assignment, status: newStatus })
      
      success(`Estado cambiado correctamente a: ${getStatusLabel(newStatus)}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      showError(`Error al actualizar estado: ${errorMessage}`)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
      case 'cancelled':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
    }
  }

  const getInitials = (name: string, surname: string) => {
    const nameInitial = name?.trim()?.charAt(0)?.toUpperCase() || 'A'
    const surnameInitial = surname?.trim()?.charAt(0)?.toUpperCase() || ''
    return nameInitial + surnameInitial
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  function getFirst<T>(value: T | T[] | null | undefined): T | undefined {
    if (Array.isArray(value)) return value[0];
    return value ?? undefined;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando asignación...</p>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600 text-lg">Asignación no encontrada</p>
          <Link href="/admin/assignments">
            <Button className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              Volver a Asignaciones
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/admin/assignments">
            <Button className="border border-slate-300 hover:bg-slate-50 bg-white text-slate-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Detalle de Asignación
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">
              Información completa de la asignación
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/assignments/${assignment.id}/edit`}>
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button
            onClick={handleToggleStatus}
            className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 shadow-lg"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {assignment.status === 'active' ? 'Cancelar' : 'Activar'}
          </Button>
          <Button
            onClick={() => setShowDeleteModal(true)}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Assignment Info */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-slate-600" />
            Información de la Asignación
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assignment Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Tipo de Asignación:</span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
                  {assignment.assignment_type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Estado:</span>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-md ${getStatusColor(assignment.status)}`}>
                  {getStatusLabel(assignment.status)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Fecha de Inicio:</span>
                <span className="text-slate-900 font-medium">{formatDate(assignment.start_date)}</span>
              </div>
              {assignment.end_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Fecha de Fin:</span>
                  <span className="text-slate-900 font-medium">{formatDate(assignment.end_date)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Horas Semanales:</span>
                <span className="text-slate-900 font-medium">{assignment.weekly_hours} horas</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumen</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Duración:</span>
                  <span className="text-slate-900 font-medium">
                    {assignment.end_date ? 
                      `${Math.ceil((new Date(assignment.end_date).getTime() - new Date(assignment.start_date).getTime()) / (1000 * 60 * 60 * 24 * 7))} semanas` : 
                      'Sin fecha de fin'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Horas:</span>
                  <span className="text-slate-900 font-medium">
                    {assignment.end_date ? 
                      `${Math.ceil((new Date(assignment.end_date).getTime() - new Date(assignment.start_date).getTime()) / (1000 * 60 * 60 * 24 * 7)) * assignment.weekly_hours} horas` : 
                      'Indefinido'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Worker and User Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Worker Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 border-b border-blue-200">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Trabajadora
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg">
                {getInitials(assignment.worker_name, assignment.worker_surname)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {assignment.worker_name} {assignment.worker_surname}
                </h3>
                <p className="text-slate-600">Trabajadora asignada</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-slate-400 mr-3" />
                <span className="text-slate-700">{assignment.worker_email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-slate-400 mr-3" />
                <span className="text-slate-700">{assignment.worker_phone}</span>
              </div>
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-slate-400 mr-3 mt-1" />
                <span className="text-slate-700">{assignment.worker_address}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100 border-b border-green-200">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-600" />
              Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg">
                {getInitials(assignment.user_name, assignment.user_surname)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {assignment.user_name} {assignment.user_surname}
                </h3>
                <p className="text-slate-600">Usuario asignado</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-slate-400 mr-3" />
                <span className="text-slate-700">{assignment.user_email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-slate-400 mr-3" />
                <span className="text-slate-700">{assignment.user_phone}</span>
              </div>
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-slate-400 mr-3 mt-1" />
                <span className="text-slate-700">{assignment.user_address}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAssignment}
        title="Eliminar Asignación"
        message="¿Estás seguro de que quieres eliminar esta asignación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  )
} 