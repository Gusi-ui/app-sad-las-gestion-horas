'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAssignments } from '@/hooks/useAssignments'
import { useToast } from '@/components/ui/toast'
import { AssignmentForm, AssignmentFormData } from '@/components/AssignmentForm'
import { Assignment } from '@/lib/types'
import { ArrowLeft, User, Users, Clock, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'

export default function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { getAssignmentById, updateAssignment } = useAssignments()
  const { showToast, ToastComponent } = useToast()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const resolvedParams = await params
        const result = await getAssignmentById(resolvedParams.id)
        if (result.data) {
          setAssignment(result.data)
        } else {
          console.error('No se encontró la asignación')
          router.push('/dashboard/assignments')
        }
      } catch (error) {
        console.error('Error al cargar la asignación:', error)
        router.push('/dashboard/assignments')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignment()
  }, [params, getAssignmentById, router])

  const handleSubmit = async (formData: AssignmentFormData) => {
    try {
      const resolvedParams = await params
      const result = await updateAssignment(resolvedParams.id, {
        specific_schedule: formData.specific_schedule,
        priority: formData.priority,
        status: formData.status,
        notes: formData.notes?.trim() || undefined,
        end_date: formData.end_date || undefined
      })
      
      if (result && !result.error) {
        showToast('Asignación actualizada correctamente', 'success')
        router.push('/dashboard/assignments')
      } else {
        showToast('Error al actualizar la asignación', 'error')
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      showToast('Error al guardar los cambios', 'error')
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/assignments')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Asignación no encontrada</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header sticky mobile-first */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center py-4">
            <button onClick={() => router.back()} className="mr-2 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 truncate flex-1">Editar Asignación</h1>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AssignmentForm
          assignment={assignment}
          isEditing={true}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
        {ToastComponent}
      </div>
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