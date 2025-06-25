import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Worker, WorkerStats } from '@/lib/types'

export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [workerStats, setWorkerStats] = useState<WorkerStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch workers
      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .order('name', { ascending: true })

      if (workersError) {
        throw workersError
      }

      // Fetch worker stats
      const { data: statsData, error: statsError } = await supabase
        .from('worker_stats')
        .select('*')
        .order('name', { ascending: true })

      if (statsError) {
        console.warn('Error fetching worker stats:', statsError)
        // Don't throw, stats are optional
      }

      setWorkers(workersData || [])
      setWorkerStats(statsData || [])
    } catch (err) {
      console.error('Error fetching workers:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const createWorker = async (workerData: Omit<Worker, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .insert([workerData])
        .select()
        .single()

      if (error) throw error

      // Refresh the list
      await fetchWorkers()
      return { data, error: null }
    } catch (err) {
      console.error('Error creating worker:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Error al crear trabajadora' }
    }
  }

  const updateWorker = async (id: string, updates: Partial<Worker>) => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Refresh the list
      await fetchWorkers()
      return { data, error: null }
    } catch (err) {
      console.error('Error updating worker:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Error al actualizar trabajadora' }
    }
  }

  const deleteWorker = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh the list
      await fetchWorkers()
      return { error: null }
    } catch (err) {
      console.error('Error deleting worker:', err)
      return { error: err instanceof Error ? err.message : 'Error al eliminar trabajadora' }
    }
  }

  const getWorkerById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('Error fetching worker:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Error al obtener trabajadora' }
    }
  }

  const getAvailableWorkers = () => {
    return workers.filter(worker => worker.is_active)
  }

  const getWorkersBySpecialization = (specialization: string) => {
    return workers.filter(worker => 
      worker.is_active && worker.specializations.includes(specialization as any)
    )
  }

  useEffect(() => {
    fetchWorkers()
  }, [])

  return {
    workers,
    workerStats,
    isLoading,
    error,
    createWorker,
    updateWorker,
    deleteWorker,
    getWorkerById,
    getAvailableWorkers,
    getWorkersBySpecialization,
    refetch: fetchWorkers
  }
} 