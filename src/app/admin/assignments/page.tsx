'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Calendar, Plus, ChevronDown, Filter, Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import ConfirmModal from '@/components/ui/confirm-modal'
import { useNotificationHelpers } from '@/components/ui/toast-notification'

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
  user_name: string
  user_surname: string
}

export default function AssignmentsPage() {
  const { success, error: showError } = useNotificationHelpers()
  
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchAssignments()
  }, [])

  useEffect(() => {
    filterAssignments()
  }, [assignments, searchTerm, statusFilter, typeFilter])

  // Cerrar dropdowns cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.filter-dropdown')) {
        setShowStatusDropdown(false)
        setShowTypeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
          workers!inner(name, surname),
          users!inner(name, surname)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al cargar asignaciones:', error)
        showError('Error al cargar asignaciones: ' + error.message)
      } else {
        type AssignmentDB = Omit<Assignment, 'worker_name' | 'worker_surname' | 'user_name' | 'user_surname'> & {
          workers?: { name: string; surname: string }[] | { name: string; surname: string } | null;
          users?: { name: string; surname: string }[] | { name: string; surname: string } | null;
        };
        const formattedData = (data as AssignmentDB[] | null)?.map((assignment) => {
          const worker = Array.isArray(assignment.workers) ? assignment.workers[0] : assignment.workers;
          const user = Array.isArray(assignment.users) ? assignment.users[0] : assignment.users;
          return {
            ...assignment,
            worker_name: worker?.name || '',
            worker_surname: worker?.surname || '',
            user_name: user?.name || '',
            user_surname: user?.surname || ''
          };
        }) || [];
        
        setAssignments(formattedData)
        setFilteredAssignments(formattedData)
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      showError('Error inesperado al cargar asignaciones')
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

    // Filtrar por tipo de asignación
    if (typeFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.assignment_type === typeFilter)
    }

    setFilteredAssignments(filtered)
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    setAssignmentToDelete(assignmentId)
    setShowDeleteModal(true)
  }

  const confirmDeleteAssignment = async () => {
    if (!supabase || !assignmentToDelete) return
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', assignmentToDelete)
      if (error) throw error
      setAssignments(assignments.filter(a => a.id !== assignmentToDelete))
      setFilteredAssignments(filteredAssignments.filter(a => a.id !== assignmentToDelete))
      success('Asignación eliminada correctamente')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      showError('Error al eliminar asignación: ' + errorMessage)
    }
  }

  const handleToggleStatus = async (assignmentId: string, currentStatus: string) => {
    if (!supabase) {
      showError('Error: Cliente Supabase no disponible')
      return
    }
    
    try {
      // Solo alternar entre activa y cancelada
      const newStatus = currentStatus === 'active' ? 'cancelled' : 'active'
      
      const { data, error } = await supabase
        .from('assignments')
        .update({ status: newStatus })
        .eq('id', assignmentId)
        .select()

      if (error) {
        throw new Error(`Error de base de datos: ${error.message} (${error.code})`)
      }

      if (!data || data.length === 0) {
        throw new Error('No se encontró la asignación para actualizar')
      }
      
      // Actualizar el estado local
      setAssignments(assignments.map(a => a.id === assignmentId ? { ...a, status: newStatus } : a))
      setFilteredAssignments(filteredAssignments.map(a => a.id === assignmentId ? { ...a, status: newStatus } : a))
      
      success(`Estado cambiado correctamente a: ${getStatusLabel(newStatus)}`)
    } catch (error) {
      console.error('Error completo:', error)
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
      case 'all':
        return 'Todos los estados'
      default:
        return status
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'all':
        return 'Todos los tipos'
      case 'regular':
        return 'Regular'
      case 'holidays':
        return 'Festivos'
      case 'weekends':
        return 'Fines de semana'
      case 'temporary':
        return 'Temporal'
      default:
        return type
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

  // Stats calculations
  const totalAssignments = assignments.length
  const activeAssignments = assignments.filter(a => a.status === 'active').length
  const cancelledAssignments = assignments.filter(a => a.status === 'cancelled').length
  const totalWeeklyHours = assignments.reduce((sum, a) => sum + a.weekly_hours, 0)

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Gestión de Asignaciones
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Administra las asignaciones de trabajadoras a usuarios
          </p>
        </div>
        <Link href="/admin/assignments/new">
          <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Asignación
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar asignación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative filter-dropdown">
              <Button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown)
                  setShowTypeDropdown(false)
                }}
                className="w-full justify-between bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <span className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  {getStatusLabel(statusFilter)}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showStatusDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setStatusFilter('all')
                        setShowStatusDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Todos los estados
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('active')
                        setShowStatusDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Activas
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('cancelled')
                        setShowStatusDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Canceladas
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Type Filter */}
            <div className="relative filter-dropdown">
              <Button
                onClick={() => {
                  setShowTypeDropdown(!showTypeDropdown)
                  setShowStatusDropdown(false)
                }}
                className="w-full justify-between bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <span className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  {getTypeLabel(typeFilter)}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showTypeDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setTypeFilter('all')
                        setShowTypeDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Todos los tipos
                    </button>
                    <button
                      onClick={() => {
                        setTypeFilter('regular')
                        setShowTypeDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Regular
                    </button>
                    <button
                      onClick={() => {
                        setTypeFilter('holidays')
                        setShowTypeDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Festivos
                    </button>
                    <button
                      onClick={() => {
                        setTypeFilter('weekends')
                        setShowTypeDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Fines de semana
                    </button>
                    <button
                      onClick={() => {
                        setTypeFilter('temporary')
                        setShowTypeDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Temporal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filters */}
            <Button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setTypeFilter('all')
                setShowStatusDropdown(false)
                setShowTypeDropdown(false)
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 sm:col-span-2 lg:col-span-1"
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-slate-600" />
            Asignaciones ({filteredAssignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No se encontraron asignaciones</p>
              <p className="text-slate-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View - Card Layout */}
              <div className="hidden md:block">
                <div className="space-y-4 p-6">
                  {filteredAssignments.slice(0, 15).map((assignment, index) => (
                    <div key={assignment.id} className={`bg-white border border-slate-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      {/* Primera línea: Trabajadora y Usuario */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg">
                              {getInitials(assignment.worker_name, assignment.worker_surname)}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-lg">
                                {assignment.worker_name} {assignment.worker_surname}
                              </h3>
                              <p className="text-sm text-slate-500 font-medium">
                                Trabajadora
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg">
                              {getInitials(assignment.user_name, assignment.user_surname)}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-lg">
                                {assignment.user_name} {assignment.user_surname}
                              </h3>
                              <p className="text-sm text-slate-500 font-medium">
                                Usuario
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
                            {assignment.assignment_type}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${getStatusColor(assignment.status)}`}>
                            {getStatusLabel(assignment.status)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Segunda línea: Fecha de inicio y Horas */}
                      <div className="flex items-center space-x-6 mb-4">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-slate-700 font-medium">
                            Inicio: {formatDate(assignment.start_date)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-slate-400 mr-2" />
                          <span className="text-slate-700 font-medium">
                            {assignment.weekly_hours}h/semana
                          </span>
                        </div>
                      </div>
                      
                      {/* Acciones */}
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/assignments/${assignment.id}`}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </Link>
                        <Link href={`/admin/assignments/${assignment.id}/edit`}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(assignment.id, assignment.status)}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-slate-500 to-slate-600 text-white hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {assignment.status === 'active' ? 'Cancelar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden">
                <div className="space-y-4 p-4">
                  {filteredAssignments.slice(0, 15).map((assignment) => (
                    <div key={assignment.id} className="bg-white border-0 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                      {/* Header con avatares */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {getInitials(assignment.worker_name, assignment.worker_surname)}
                          </div>
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {getInitials(assignment.user_name, assignment.user_surname)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold shadow-md ${getStatusColor(assignment.status)}`}>
                            {getStatusLabel(assignment.status)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Información de trabajadora y usuario */}
                      <div className="space-y-3 mb-4">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">
                            {assignment.worker_name} {assignment.worker_surname}
                          </h3>
                          <p className="text-xs text-slate-500">Trabajadora</p>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">
                            {assignment.user_name} {assignment.user_surname}
                          </h3>
                          <p className="text-xs text-slate-500">Usuario</p>
                        </div>
                      </div>
                      
                      {/* Tipo de asignación */}
                      <div className="mb-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
                          {assignment.assignment_type}
                        </span>
                      </div>
                      
                      {/* Fecha de inicio y horas */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-slate-700 font-medium text-sm">
                            Inicio: {formatDate(assignment.start_date)}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-slate-400 mr-3" />
                          <p className="text-slate-700 font-medium text-sm">
                            {assignment.weekly_hours}h/semana
                          </p>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="grid grid-cols-2 gap-3">
                        <Link href={`/admin/assignments/${assignment.id}`}
                          className="inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </Link>
                        <Link href={`/admin/assignments/${assignment.id}/edit`}
                          className="inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(assignment.id, assignment.status)}
                          className="inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-slate-500 to-slate-600 text-white hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {assignment.status === 'active' ? 'Cancelar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats - Moved to bottom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900">{totalAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Activas</p>
                <p className="text-2xl font-bold text-slate-900">{activeAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Canceladas</p>
                <p className="text-2xl font-bold text-slate-900">{cancelledAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Horas/Semana</p>
                <p className="text-2xl font-bold text-slate-900">{totalWeeklyHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAssignment}
        title="Eliminar Asignación"
        message="¿Estás seguro de que quieres eliminar esta asignación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Toast Notification */}
      {/* The ToastNotification component was removed from imports, so this block is now empty */}
    </div>
  )
} 