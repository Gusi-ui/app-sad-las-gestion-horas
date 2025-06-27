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
  Save, 
  Clock, 
  AlertTriangle
} from 'lucide-react'
import { Assignment, WeekDay } from '@/lib/types'

const weekDays: { key: WeekDay; label: string }[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
]

export default function EditAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.id as string
  
  const { getAssignmentById, updateAssignment } = useAssignments()
  const { showToast, ToastComponent } = useToast()
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    selectedDay: 'monday' as WeekDay,
    startTime: '08:00',
    endTime: '09:00'
  })

  useEffect(() => {
    if (!assignmentId) {
      setError('ID de asignación inválido')
      setIsLoading(false)
      return
    }
    
    const fetchAssignment = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const { data, error } = await getAssignmentById(assignmentId)
        
        if (error) {
          setError(error)
        } else if (data) {
          setAssignment(data)
          // Extract current schedule
          if (data.specific_schedule && Object.keys(data.specific_schedule).length > 0) {
            const firstDay = Object.keys(data.specific_schedule)[0] as WeekDay
            const times = data.specific_schedule[firstDay]
            if (times && times.length >= 2) {
              setFormData({
                selectedDay: firstDay,
                startTime: times[0] || '08:00',
                endTime: times[1] || '09:00'
              })
            }
          }
        } else {
          setError('Asignación no encontrada')
        }
      } catch {
        setError('Error al cargar la asignación')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAssignment()
  }, [assignmentId, getAssignmentById])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!assignment) return

    if (formData.startTime >= formData.endTime) {
      showToast('La hora de inicio debe ser anterior a la hora de fin', 'error')
      return
    }

    setIsSaving(true)
    try {
      const newSchedule: Record<WeekDay, string[]> = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
        [formData.selectedDay]: [formData.startTime, formData.endTime]
      }

      const { error } = await updateAssignment(assignmentId, {
        specific_schedule: newSchedule
      })

      if (error) {
        showToast(`Error al actualizar: ${error}`, 'error')
      } else {
        showToast('Horario actualizado correctamente', 'success')
        router.push('/dashboard/planning')
      }
    } catch {
      showToast('Error inesperado al actualizar', 'error')
    } finally {
      setIsSaving(false)
    }
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
            <p className="text-red-600 mb-4">{error || 'Asignación no encontrada'}</p>
            <Link href="/dashboard/planning">
              <Button>Volver al Calendario</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/planning">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Planning
              </Button>
            </Link>
            <Link href="/dashboard/assignments">
              <Button variant="secondary" size="sm">
                Lista
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">✏️ Cambiar Horario</h1>
              <p className="text-slate-600">Modifica el día y horario de la asignación</p>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Trabajadora</h3>
                <p className="text-slate-600">{assignment.worker?.name} {assignment.worker?.surname}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Usuario</h3>
                <p className="text-slate-600">{assignment.user?.name} {assignment.user?.surname}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Nuevo Horario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="selectedDay" className="block text-sm font-medium text-slate-700 mb-2">
                  Día de la semana *
                </label>
                <select
                  id="selectedDay"
                  value={formData.selectedDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, selectedDay: e.target.value as WeekDay }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {weekDays.map((day) => (
                    <option key={day.key} value={day.key}>{day.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-2">
                    Hora de inicio *
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    value={formData.startTime || '08:00'}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-2">
                    Hora de fin *
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    value={formData.endTime || '09:00'}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4 mt-6">
            <Link href="/dashboard/planning">
              <Button variant="secondary" type="button">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      {ToastComponent}
    </div>
  )
} 