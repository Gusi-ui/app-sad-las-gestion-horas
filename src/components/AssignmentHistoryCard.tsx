'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  History,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  UserCheck
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AssignmentHistory {
  id: string
  assignment_id: string
  previous_worker_id?: string
  new_worker_id: string
  changed_by: string
  change_reason?: string
  created_at: string
  previous_worker?: {
    name: string
    surname: string
  } | null
  new_worker?: {
    name: string
    surname: string
  } | null
}

interface AssignmentHistoryCardProps {
  assignmentId: string
  className?: string
}

export default function AssignmentHistoryCard({ assignmentId, className = '' }: AssignmentHistoryCardProps) {
  const [history, setHistory] = useState<AssignmentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const loadHistory = useCallback(async () => {
    try {
      // assignmentId para depuración
      if (!supabase) {
        setLoading(false)
        return
      }

      // Primero obtener el historial básico
      const { data: historyData, error: historyError } = await supabase
        .from('assignment_history')
        .select(`
          id,
          assignment_id,
          previous_worker_id,
          new_worker_id,
          changed_by,
          change_reason,
          created_at
        `)
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: false })

      if (historyError) {
        // No mostrar error al usuario, simplemente mostrar historial vacío
        setHistory([])
        setLoading(false)
        return
      }

      if (!historyData || historyData.length === 0) {
        setHistory([])
        setLoading(false)
        return
      }

      // Obtener información de trabajadores por separado
      const workerIds = new Set<string>()
      historyData.forEach(item => {
        if (item.previous_worker_id) workerIds.add(item.previous_worker_id)
        if (item.new_worker_id) workerIds.add(item.new_worker_id)
      })

      if (workerIds.size === 0) {
        // Si no hay IDs de trabajadores, mostrar historial sin datos de trabajadores
        const enrichedHistory = historyData.map(item => ({
          ...item,
          previous_worker: null,
          new_worker: null
        }))
        setHistory(enrichedHistory)
        setLoading(false)
        return
      }

      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('id, name, surname')
        .in('id', Array.from(workerIds))

      if (workersError) {
        // Mostrar historial sin datos de trabajadores
        const enrichedHistory = historyData.map(item => ({
          ...item,
          previous_worker: null,
          new_worker: null
        }))
        setHistory(enrichedHistory)
        setLoading(false)
        return
      }

      // Crear un mapa de trabajadores para acceso rápido
      const workersMap = new Map()
      workersData?.forEach(worker => {
        workersMap.set(worker.id, worker)
      })

      // Combinar los datos
      const enrichedHistory = historyData.map(item => ({
        ...item,
        previous_worker: item.previous_worker_id ? workersMap.get(item.previous_worker_id) : null,
        new_worker: item.new_worker_id ? workersMap.get(item.new_worker_id) : null
      }))

      setHistory(enrichedHistory)
    } catch {
      // En caso de error, mostrar historial vacío
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    // assignmentId para depuración
    if (assignmentId) {
      loadHistory();
    }
  }, [assignmentId, loadHistory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2 text-blue-600" />
            Historial de Cambios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2 text-blue-600" />
            Historial de Cambios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay cambios registrados</p>
            <p className="text-sm text-gray-400">Esta asignación no ha sido modificada</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayedHistory = expanded ? history : history.slice(0, 3)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2 text-blue-600" />
            Historial de Cambios
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({history.length} cambios)
            </span>
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Menos
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Ver más
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedHistory.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 border rounded-lg ${
                index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {item.previous_worker ? (
                        <>
                          {item.previous_worker.name} {item.previous_worker.surname}
                        </>
                      ) : (
                        <span className="text-gray-500 italic">Sin asignar</span>
                      )}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-blue-600">
                      {item.new_worker?.name} {item.new_worker?.surname}
                    </span>
                  </div>

                  {item.change_reason && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Motivo:</strong> {item.change_reason}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(item.created_at)}
                    </div>
                    {index === 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Último cambio
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {history.length > 3 && !expanded && (
            <div className="text-center pt-2">
              <p className="text-sm text-gray-500">
                Y {history.length - 3} cambios más...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}