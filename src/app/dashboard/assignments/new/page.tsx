'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useAssignments } from '@/hooks/useAssignments'
import { useToast } from '@/components/ui/toast'
import { AssignmentForm, AssignmentFormData } from '@/components/AssignmentForm'
import type { Assignment } from '@/lib/types'
import { Plus, Users, User, Clock, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

// Configuración para evitar el prerender estático
export const dynamic = 'force-dynamic'
export const revalidate = 0

function NewAssignmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createAssignment, checkDuplicateAssignment, suggestNewStartDate } = useAssignments()
  const { showToast, ToastComponent } = useToast()

  // Leer user_id y worker_id de la URL
  const userId = searchParams.get('user_id') || undefined
  const workerId = searchParams.get('worker_id') || undefined

  const handleSubmit = async (formData: AssignmentFormData) => {
    try {
      // Check for duplicate assignment first
      const duplicate = await checkDuplicateAssignment({
        worker_id: formData.worker_id,
        user_id: formData.user_id,
        start_date: formData.start_date
      })

      if (duplicate) {
        const suggestedDate = suggestNewStartDate(formData.start_date)
        showToast(
          `Ya existe una asignación para esta trabajadora, usuario y fecha de inicio. Sugerencia: Cambia la fecha de inicio a ${suggestedDate}`,
          'warning'
        )
        return
      }

      // Convertir TimeSlot[] a string[] para la base de datos
      const convertedSchedule: Record<string, string[]> = {}
      Object.entries(formData.specific_schedule).forEach(([day, timeSlots]) => {
        convertedSchedule[day] = timeSlots.map(slot => [slot.start, slot.end]).flat()
      })
      
      const { error, conflicts } = await createAssignment({
        worker_id: formData.worker_id,
        user_id: formData.user_id,
        assigned_hours_per_week: formData.assigned_hours_per_week,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        priority: formData.priority,
        status: formData.status,
        notes: formData.notes?.trim() || undefined,
        specific_schedule: convertedSchedule
      })

      if (conflicts && conflicts.length > 0) {
        const conflictDetails = conflicts.map((conflict: Assignment) => {
          return `• Usuario: ${conflict.user?.name} ${conflict.user?.surname}`
        }).join('\n')
        
        showToast(
          `Se detectaron ${conflicts.length} conflicto(s) de horario:\n${conflictDetails}`, 
          'warning'
        )
        return
      }

      if (error) {
        showToast(`Error al crear asignación: ${error}`, 'error')
      } else {
        showToast('Asignación creada correctamente', 'success')
        router.push('/dashboard/assignments')
      }
    } catch {
      showToast('Error inesperado al crear asignación', 'error')
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/assignments')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header sticky mobile-first */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center py-4">
            <button onClick={() => router.back()} className="mr-2 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">
              <Plus className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 truncate flex-1">Nueva Asignación</h1>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AssignmentForm
          isEditing={false}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          userId={userId}
          workerId={workerId}
        />
        {ToastComponent}
      </div>
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

export default function NewAssignmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    }>
      <NewAssignmentContent />
    </Suspense>
  )
}
