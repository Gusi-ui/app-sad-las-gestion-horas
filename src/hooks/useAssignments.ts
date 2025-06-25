import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Assignment, Worker, User } from '@/lib/types'

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = async () => {
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
  }

  const createAssignment = async (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'worker' | 'user'>) => {
    try {
      // Check for conflicts before creating
      const conflicts = await checkAssignmentConflicts(assignmentData)
      if (conflicts.length > 0) {
        return { 
          data: null, 
          error: `Conflicto detectado: La trabajadora ya tiene asignaciones en horarios similares`,
          conflicts 
        }
      }

      const { data, error } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select(`
          *,
          worker:workers(*),
          user:users(*)
        `)
        .single()

      if (error) throw error

      // Refresh the list
      await fetchAssignments()
      return { data, error: null, conflicts: [] }
    } catch (err) {
      console.error('Error creating assignment:', err)
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error al crear asignación',
        conflicts: []
      }
    }
  }

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
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
      return { data: null, error: err instanceof Error ? err.message : 'Error al actualizar asignación' }
    }
  }

  const deleteAssignment = async (id: string) => {
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
      return { error: err instanceof Error ? err.message : 'Error al eliminar asignación' }
    }
  }

  const getAssignmentById = async (id: string) => {
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
      console.error('Error fetching assignment:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Error al obtener asignación' }
    }
  }

  const getAssignmentsByWorker = (workerId: string) => {
    return assignments.filter(assignment => assignment.worker_id === workerId)
  }

  const getAssignmentsByUser = (userId: string) => {
    return assignments.filter(assignment => assignment.user_id === userId)
  }

  const getActiveAssignments = () => {
    return assignments.filter(assignment => assignment.status === 'active')
  }

  const checkAssignmentConflicts = async (newAssignment: Partial<Assignment>) => {
    try {
      // Get existing assignments for the same worker
      const { data: existingAssignments, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('worker_id', newAssignment.worker_id)
        .eq('status', 'active')

      if (error) throw error

      const conflicts: Assignment[] = []

      // Check for schedule conflicts
      if (newAssignment.specific_schedule && existingAssignments) {
        for (const existing of existingAssignments) {
          if (existing.specific_schedule) {
            // Compare schedules for overlapping times
            const hasConflict = checkScheduleOverlap(
              newAssignment.specific_schedule,
              existing.specific_schedule
            )
            if (hasConflict) {
              conflicts.push(existing)
            }
          }
        }
      }

      return conflicts
    } catch (err) {
      console.error('Error checking conflicts:', err)
      return []
    }
  }

  const checkScheduleOverlap = (schedule1: any, schedule2: any): boolean => {
    // Compare schedules to detect time overlaps
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    for (const day of days) {
      if (schedule1[day] && schedule2[day]) {
        const times1 = schedule1[day] as string[]
        const times2 = schedule2[day] as string[]
        
        if (times1.length >= 2 && times2.length >= 2) {
          const start1 = times1[0]
          const end1 = times1[1]
          const start2 = times2[0]
          const end2 = times2[1]
          
          // Check for time overlap
          if (start1 < end2 && start2 < end1) {
            return true
          }
        }
      }
    }
    
    return false
  }

  const getWorkerWorkload = (workerId: string) => {
    const workerAssignments = getAssignmentsByWorker(workerId)
    const activeAssignments = workerAssignments.filter(a => a.status === 'active')
    const totalHours = activeAssignments.reduce((sum, a) => sum + a.assigned_hours_per_week, 0)
    
    return {
      totalAssignments: workerAssignments.length,
      activeAssignments: activeAssignments.length,
      totalHoursPerWeek: totalHours,
      assignments: activeAssignments
    }
  }

  const getUserAssignments = (userId: string) => {
    const userAssignments = getAssignmentsByUser(userId)
    const activeAssignments = userAssignments.filter(a => a.status === 'active')
    const totalHours = activeAssignments.reduce((sum, a) => sum + a.assigned_hours_per_week, 0)
    
    return {
      totalAssignments: userAssignments.length,
      activeAssignments: activeAssignments.length,
      totalHoursPerWeek: totalHours,
      assignments: activeAssignments
    }
  }

  const getAssignmentStats = () => {
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
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

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
    checkAssignmentConflicts,
    getWorkerWorkload,
    getUserAssignments,
    getAssignmentStats,
    refetch: fetchAssignments
  }
} 