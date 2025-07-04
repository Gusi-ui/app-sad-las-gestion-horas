import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Worker, WorkerStats, WorkerSpecialization } from '@/lib/types'

export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [workerStats, setWorkerStats] = useState<WorkerStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkers = useCallback(async () => {
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

      // Asegurar que los arrays nulos se conviertan en arrays vacíos
      const processedWorkers = (workersData || []).map(worker => ({
        ...worker,
        specializations: worker.specializations || [],
        availability_days: worker.availability_days || []
      }))
      setWorkers(processedWorkers)
      setWorkerStats(statsData || [])
    } catch (err) {
      console.error('Error fetching workers:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createWorker = useCallback(async (workerData: Omit<Worker, 'id' | 'created_at' | 'updated_at'>) => {
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
  }, [fetchWorkers])

  const updateWorker = useCallback(async (id: string, updates: Partial<Worker>) => {
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
  }, [fetchWorkers])

  const deleteWorker = useCallback(async (id: string) => {
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
  }, [fetchWorkers])

  const getWorkerById = useCallback(async (id: string) => {
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
  }, [])

  const getAvailableWorkers = useCallback(() => {
    return workers.filter(worker => worker.is_active)
  }, [workers])

  const getWorkersBySpecialization = useCallback((specialization: string) => {
    return workers.filter(worker => 
      worker.is_active && worker.specializations.includes(specialization as WorkerSpecialization)
    )
  }, [workers])

  useEffect(() => {
    fetchWorkers()
  }, [fetchWorkers])

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