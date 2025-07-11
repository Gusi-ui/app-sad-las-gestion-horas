'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Calendar, Plus } from 'lucide-react'

interface Assignment {
  id: string
  worker_id: string
  user_id: string
  assignment_type: string
  start_date: string
  end_date: string | null
  weekly_hours: number
  status: string
  priority: number
  worker_name: string
  worker_surname: string
  user_name: string
  user_surname: string
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')

  useEffect(() => {
    fetchAssignments()
  }, [])

  useEffect(() => {
    filterAssignments()
  }, [assignments, searchTerm, statusFilter])

  const fetchAssignments = async () => {
    if (!supabase) {
      console.error('Supabase client no disponible')
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
          priority,
          workers!inner(name, surname),
          users!inner(name, surname)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al cargar asignaciones:', error)
        alert('Error al cargar asignaciones: ' + JSON.stringify(error))
      } else {
        const formattedData = data?.map((assignment: any) => ({
          ...assignment,
          worker_name: assignment.workers?.name || '',
          worker_surname: assignment.workers?.surname || '',
          user_name: assignment.users?.name || '',
          user_surname: assignment.users?.surname || ''
        })) || []
        
        setAssignments(formattedData)
        setFilteredAssignments(formattedData)
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      alert('Error inesperado: ' + JSON.stringify(error))
    } finally {
      setLoading(false)
    }
  }

  const filterAssignments = () => {
    let filtered = assignments

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.worker_surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.user_surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.assignment_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter)
    }

    setFilteredAssignments(filtered)
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!supabase) return
    if (!confirm('¿Seguro que quieres eliminar esta asignación?')) return
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', assignmentId)
      if (error) throw error
      setAssignments(assignments.filter(a => a.id !== assignmentId))
      setFilteredAssignments(filteredAssignments.filter(a => a.id !== assignmentId))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert('Error al eliminar asignación: ' + errorMessage)
    }
  }

  const handleToggleStatus = async (assignmentId: string, currentStatus: string) => {
    if (!supabase) {
      alert('Error: Cliente Supabase no disponible')
      return
    }
    
    try {
      // Usar valores válidos: active, completed, cancelled
      let newStatus: string
      if (currentStatus === 'active') {
        newStatus = 'completed'
      } else if (currentStatus === 'completed') {
        newStatus = 'cancelled'
      } else {
        newStatus = 'active'
      }
      
      console.log(`Cambiando estado de asignación ${assignmentId} de ${currentStatus} a ${newStatus}`)
      
      const { data, error } = await supabase
        .from('assignments')
        .update({ status: newStatus })
        .eq('id', assignmentId)
        .select()

      if (error) {
        console.error('Error de Supabase:', error)
        throw new Error(`Error de base de datos: ${error.message} (${error.code})`)
      }

      if (!data || data.length === 0) {
        throw new Error('No se encontró la asignación para actualizar')
      }

      console.log('Asignación actualizada correctamente:', data[0])
      
      // Actualizar el estado local
      setAssignments(assignments.map(a => a.id === assignmentId ? { ...a, status: newStatus } : a))
      setFilteredAssignments(filteredAssignments.map(a => a.id === assignmentId ? { ...a, status: newStatus } : a))
      
      alert(`Estado cambiado correctamente a: ${newStatus}`)
    } catch (error) {
      console.error('Error completo:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`Error al actualizar estado: ${errorMessage}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando asignaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Gestión de Asignaciones
          </h1>
          <p className="text-slate-600">
            Administra las asignaciones de trabajadoras a usuarios
          </p>
        </div>
        <Link href="/admin/assignments/new">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Asignación
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar asignación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'completed' | 'cancelled')}
              className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            {/* Clear Filters */}
            <Button
              variant="default"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Activas</p>
                <p className="text-2xl font-bold text-slate-900">
                  {assignments.filter(a => a.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Completadas</p>
                <p className="text-2xl font-bold text-slate-900">
                  {assignments.filter(a => a.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-red-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Canceladas</p>
                <p className="text-2xl font-bold text-slate-900">
                  {assignments.filter(a => a.status === 'cancelled').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Horas Semanales</p>
                <p className="text-2xl font-bold text-slate-900">
                  {assignments.reduce((sum, a) => sum + a.weekly_hours, 0)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Asignaciones ({filteredAssignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No se encontraron asignaciones</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Trabajadora</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Fecha Inicio</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Fecha Fin</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Horas/Semana</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Prioridad</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 font-medium text-slate-900">
                        {assignment.worker_name} {assignment.worker_surname}
                      </td>
                      <td className="py-4 px-4 text-slate-900">
                        {assignment.user_name} {assignment.user_surname}
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                          {assignment.assignment_type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        {new Date(assignment.start_date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString('es-ES') : '-'}
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        {assignment.weekly_hours}h
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">
                          {assignment.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={
                          assignment.status === 'active' ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold' :
                          assignment.status === 'completed' ? 'bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold' :
                          'bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold'
                        }>
                          {assignment.status === 'active' ? 'Activa' : 
                           assignment.status === 'completed' ? 'Completada' : 
                           assignment.status === 'cancelled' ? 'Cancelada' : assignment.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 flex gap-2">
                        <Link href={`/admin/assignments/${assignment.id}`}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                          Ver
                        </Link>
                        <Link href={`/admin/assignments/${assignment.id}/edit`}
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                          Eliminar
                        </button>
                        <button
                          onClick={() => handleToggleStatus(assignment.id, assignment.status)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-semibold">
                          {assignment.status === 'active' ? 'Completar' : 
                           assignment.status === 'completed' ? 'Cancelar' : 
                           'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 