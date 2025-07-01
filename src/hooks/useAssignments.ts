import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Assignment } from '@/lib/types'

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch assignments with populated worker and user data
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          worker:workers(*),
          user:users(*)
        `)
        .order('created_at', { ascending: false })

      if (assignmentsError) {
        throw assignmentsError
      }

      setAssignments(assignmentsData || [])
    } catch (err) {
      console.error('Error fetching assignments:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'worker' | 'user'>) => {
    try {
      // Check for conflicts only if the assignment has a specific schedule
      // TODO: Implement checkAssignmentConflicts function
      // if (assignmentData.specific_schedule) {
      //   const conflicts = await checkAssignmentConflicts(assignmentData)
      //   if (conflicts.length > 0) {
      //     return { 
      //       data: null, 
      //       error: `Conflicto detectado: La trabajadora ya tiene asignaciones en horarios similares`,
      //       conflicts 
      //     }
      //   }
      // }

      const { data, error } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select(`
          *,
          worker:workers(*),
          user:users(*)
        `)
        .single()

      if (error) {
        console.error('Error creating assignment:', error)
        console.error('Error type:', typeof error)
        console.error('Error constructor:', error?.constructor?.name)
        console.error('Error keys:', error && typeof error === 'object' ? Object.keys(error) : 'N/A')
        console.error('Error stringified:', JSON.stringify(error, null, 2))
        
        let errorMsg = 'Error al crear asignación'
        
        // Handle specific error codes
        if (error && typeof error === 'object' && 'code' in error) {
          const errorObj = error as { code: string; message?: string; details?: string; hint?: string }
          
          switch (errorObj.code) {
            case '23505':
              if (typeof errorObj.message === 'string' && errorObj.message.includes('assignments_worker_id_user_id_start_date_key')) {
                errorMsg = 'Ya existe una asignación para esta trabajadora, usuario y fecha de inicio. Cambia la fecha de inicio o selecciona un usuario/trabajadora diferente.'
              } else {
                errorMsg = 'Ya existe un registro con los mismos datos. Verifica que no estés duplicando una asignación existente.'
              }
              break
            case '23503':
              if (typeof errorObj.message === 'string' && errorObj.message.includes('worker_id')) {
                errorMsg = 'La trabajadora seleccionada no existe o ha sido eliminada.'
              } else if (typeof errorObj.message === 'string' && errorObj.message.includes('user_id')) {
                errorMsg = 'El usuario seleccionado no existe o ha sido eliminado.'
              } else {
                errorMsg = 'Error de referencia: Uno de los datos seleccionados no existe.'
              }
              break
            case '23514':
              errorMsg = 'Los datos no cumplen con las restricciones. Verifica las horas (1-40) y fechas.'
              break
            default:
              // Mostrar todos los campos posibles del error de Supabase
              const fields = ['message', 'details', 'code', 'hint', 'description', 'error', 'error_description']
              let extra = ''
              for (const field of fields) {
                if (field in errorObj && (errorObj as Record<string, unknown>)[field]) {
                  extra += `\n${field}: ${(errorObj as Record<string, unknown>)[field]}`
                }
              }
              if (extra) {
                errorMsg += extra
              } else {
                // Si no hay campos específicos, mostrar todo el objeto
                errorMsg += '\n' + JSON.stringify(error, null, 2)
              }
          }
        } else if (typeof error === 'string') {
          errorMsg = error
        }
        
        return { 
          data: null, 
          error: errorMsg,
          conflicts: []
        }
      }

      // Refresh the list
      await fetchAssignments()
      return { data, error: null, conflicts: [] }
    } catch (err) {
      console.error('Error creating assignment:', err)
      console.error('Error type:', typeof err)
      console.error('Error constructor:', err?.constructor?.name)
      console.error('Error keys:', err && typeof err === 'object' ? Object.keys(err) : 'N/A')
      console.error('Error stringified:', JSON.stringify(err, null, 2))
      
      let errorMsg = 'Error al crear asignación'
      
      // Handle specific error codes
      if (err && typeof err === 'object' && 'code' in err) {
        const errorObj = err as { code: string; message?: string; details?: string; hint?: string }
        
        switch (errorObj.code) {
          case '23505':
            if (typeof errorObj.message === 'string' && errorObj.message.includes('assignments_worker_id_user_id_start_date_key')) {
              errorMsg = 'Ya existe una asignación para esta trabajadora, usuario y fecha de inicio. Cambia la fecha de inicio o selecciona un usuario/trabajadora diferente.'
            } else {
              errorMsg = 'Ya existe un registro con los mismos datos. Verifica que no estés duplicando una asignación existente.'
            }
            break
          case '23503':
            if (typeof errorObj.message === 'string' && errorObj.message.includes('worker_id')) {
              errorMsg = 'La trabajadora seleccionada no existe o ha sido eliminada.'
            } else if (typeof errorObj.message === 'string' && errorObj.message.includes('user_id')) {
              errorMsg = 'El usuario seleccionado no existe o ha sido eliminado.'
            } else {
              errorMsg = 'Error de referencia: Uno de los datos seleccionados no existe.'
            }
            break
          case '23514':
            errorMsg = 'Los datos no cumplen con las restricciones. Verifica las horas (1-40) y fechas.'
            break
          default:
            // Mostrar todos los campos posibles del error de Supabase
            const fields = ['message', 'details', 'code', 'hint', 'description', 'error', 'error_description']
            let extra = ''
            for (const field of fields) {
              if (field in errorObj && (errorObj as Record<string, unknown>)[field]) {
                extra += `\n${field}: ${(errorObj as Record<string, unknown>)[field]}`
              }
            }
            if (extra) {
              errorMsg += extra
            } else {
              // Si no hay campos específicos, mostrar todo el objeto
              errorMsg += '\n' + JSON.stringify(err, null, 2)
            }
        }
      } else if (typeof err === 'string') {
        errorMsg = err
      }
      
      return { 
        data: null, 
        error: errorMsg,
        conflicts: []
      }
    }
  }, [fetchAssignments])

  const updateAssignment = useCallback(async (id: string, updates: Partial<Assignment>) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          worker:workers(*),
          user:users(*)
        `)
        .single()

      if (error) throw error

      // Refresh the list
      await fetchAssignments()
      return { data, error: null }
    } catch (err) {
      console.error('Error updating assignment:', err)
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error al actualizar asignación' 
      }
    }
  }, [fetchAssignments])

  const deleteAssignment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh the list
      await fetchAssignments()
      return { error: null }
    } catch (err) {
      console.error('Error deleting assignment:', err)
      return { 
        error: err instanceof Error ? err.message : 'Error al eliminar asignación' 
      }
    }
  }, [fetchAssignments])

  const getAssignmentById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          worker:workers(*),
          user:users(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('Error fetching assignment by ID:', err)
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error al obtener asignación' 
      }
    }
  }, [])

  const getAssignmentsByWorker = useCallback((workerId: string) => {
    return assignments.filter(assignment => assignment.worker_id === workerId)
  }, [assignments])

  const getAssignmentsByUser = useCallback((userId: string) => {
    return assignments.filter(assignment => assignment.user_id === userId)
  }, [assignments])

  const getActiveAssignments = useCallback(() => {
    return assignments.filter(assignment => assignment.status === 'active')
  }, [assignments])

  const checkDuplicateAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    try {
      const { data: existingAssignment, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('worker_id', assignmentData.worker_id)
        .eq('user_id', assignmentData.user_id)
        .eq('start_date', assignmentData.start_date)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is what we want
        throw error
      }

      return existingAssignment || null
    } catch (err) {
      console.error('Error checking duplicate assignment:', err)
      return null
    }
  }, [])

  const suggestNewStartDate = useCallback((currentStartDate: string): string => {
    const currentDate = new Date(currentStartDate)
    const nextDate = new Date(currentDate)
    nextDate.setDate(currentDate.getDate() + 1)
    return nextDate.toISOString().split('T')[0]
  }, [])

  const getWorkerWorkload = useCallback((workerId: string) => {
    const workerAssignments = getAssignmentsByWorker(workerId)
    const activeAssignments = workerAssignments.filter(a => a.status === 'active')
    const totalHours = activeAssignments.reduce((sum, a) => sum + a.assigned_hours_per_week, 0)
    
    return {
      totalAssignments: workerAssignments.length,
      activeAssignments: activeAssignments.length,
      totalHoursPerWeek: totalHours,
      assignments: activeAssignments
    }
  }, [getAssignmentsByWorker])

  const getUserAssignments = useCallback((userId: string) => {
    const userAssignments = getAssignmentsByUser(userId)
    const activeAssignments = userAssignments.filter(a => a.status === 'active')
    const totalHours = activeAssignments.reduce((sum, a) => sum + a.assigned_hours_per_week, 0)
    
    return {
      totalAssignments: userAssignments.length,
      activeAssignments: activeAssignments.length,
      totalHoursPerWeek: totalHours,
      assignments: activeAssignments
    }
  }, [getAssignmentsByUser])

  const getAssignmentStats = useCallback(() => {
    const active = assignments.filter(a => a.status === 'active')
    const paused = assignments.filter(a => a.status === 'paused')
    const completed = assignments.filter(a => a.status === 'completed')
    const cancelled = assignments.filter(a => a.status === 'cancelled')
    
    const totalHours = active.reduce((sum, a) => sum + a.assigned_hours_per_week, 0)
    
    return {
      total: assignments.length,
      active: active.length,
      paused: paused.length,
      completed: completed.length,
      cancelled: cancelled.length,
      totalWeeklyHours: totalHours
    }
  }, [assignments])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  return {
    assignments,
    isLoading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentById,
    getAssignmentsByWorker,
    getAssignmentsByUser,
    getActiveAssignments,
    checkDuplicateAssignment,
    suggestNewStartDate,
    getWorkerWorkload,
    getUserAssignments,
    getAssignmentStats,
    refetch: fetchAssignments
  }
} 