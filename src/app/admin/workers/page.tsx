'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Users, Plus, ChevronDown, Filter } from 'lucide-react'
import ConfirmModal from '@/components/ui/confirm-modal'
import ToastNotification from '@/components/ui/toast-notification'

interface Worker {
  id: string
  name: string
  surname: string
  email: string
  phone: string
  worker_type: string
  hourly_rate: number
  is_active: boolean
  employee_code: string
  address?: string
  street_address?: string
  postal_code?: string
  city?: string
  province?: string
  specializations: string[]
  availability_days: string[]
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    isVisible: boolean
  }>({
    message: '',
    type: 'info',
    isVisible: false
  })

  useEffect(() => {
    fetchWorkers()
  }, [])

  useEffect(() => {
    filterWorkers()
  }, [workers, searchTerm, statusFilter, typeFilter])

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

  const fetchWorkers = async () => {
    if (!supabase) {
      console.error('Supabase client no disponible')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('workers')
        .select('id, name, surname, email, phone, worker_type, hourly_rate, is_active, employee_code, address, street_address, postal_code, city, province, specializations, availability_days')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al cargar trabajadoras:', error)
        alert('Error al cargar trabajadoras: ' + JSON.stringify(error))
      } else {
        setWorkers(data || [])
        setFilteredWorkers(data || [])
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      alert('Error inesperado: ' + JSON.stringify(error))
    } finally {
      setLoading(false)
    }
  }

  const filterWorkers = () => {
    let filtered = workers

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(worker =>
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(worker =>
        statusFilter === 'active' ? worker.is_active : !worker.is_active
      )
    }

    // Filtrar por tipo de trabajadora
    if (typeFilter !== 'all') {
      filtered = filtered.filter(worker => {
        switch (typeFilter) {
          case 'regular':
            return worker.worker_type === 'regular'
          case 'holidays':
            return worker.worker_type === 'holidays' || worker.worker_type === 'weekends'
          case 'flexible':
            return worker.worker_type === 'flexible'
          default:
            return true
        }
      })
    }

    setFilteredWorkers(filtered)
  }

  const handleDeleteWorker = async (workerId: string) => {
    setWorkerToDelete(workerId)
    setShowDeleteModal(true)
  }

  const confirmDeleteWorker = async () => {
    if (!supabase || !workerToDelete) return
    try {
      const { error } = await supabase.from('workers').delete().eq('id', workerToDelete)
      if (error) throw error
      setWorkers(workers.filter(w => w.id !== workerToDelete))
      setFilteredWorkers(filteredWorkers.filter(w => w.id !== workerToDelete))
      setToast({
        message: 'Trabajadora eliminada correctamente',
        type: 'success',
        isVisible: true
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setToast({
        message: 'Error al eliminar trabajadora: ' + errorMessage,
        type: 'error',
        isVisible: true
      })
    }
  }

  const handleToggleActive = async (workerId: string, isActive: boolean) => {
    if (!supabase) return
    try {
      const { error } = await supabase.from('workers').update({ is_active: !isActive }).eq('id', workerId)
      if (error) throw error
      setWorkers(workers.map(w => w.id === workerId ? { ...w, is_active: !isActive } : w))
      setFilteredWorkers(filteredWorkers.map(w => w.id === workerId ? { ...w, is_active: !isActive } : w))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert('Error al actualizar estado: ' + errorMessage)
    }
  }

  const getWorkerTypeLabel = (type: string) => {
    switch (type) {
      case 'regular':
        return 'Laborables'
      case 'holidays':
        return 'Festivos'
      case 'weekends':
        return 'Festivos'
      case 'flexible':
        return 'Flexible'
      default:
        return type
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'all':
        return 'Todos los estados'
      case 'active':
        return 'Activas'
      case 'inactive':
        return 'Inactivas'
      default:
        return status
    }
  }

  const formatAddress = (worker: Worker) => {
    if (worker.street_address && worker.city) {
      const parts = [worker.street_address]
      if (worker.postal_code) parts.push(worker.postal_code)
      parts.push(worker.city)
      if (worker.province && worker.province !== 'Barcelona') parts.push(worker.province)
      return parts.join(', ')
    }
    return worker.address || ''
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'all':
        return 'Todos los tipos'
      case 'regular':
        return 'Laborables'
      case 'holidays':
        return 'Festivos'
      case 'flexible':
        return 'Flexible'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando trabajadoras...</p>
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
            Gestión de Trabajadoras
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Administra el personal de cuidados y sus perfiles
          </p>
        </div>
        <Link href="/admin/workers/new">
          <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Trabajadora
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
                placeholder="Buscar trabajadora..."
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
                        setStatusFilter('inactive')
                        setShowStatusDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Inactivas
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
                      Laborables
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
                        setTypeFilter('flexible')
                        setShowTypeDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Flexible
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

      {/* Workers List */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-slate-600" />
            Trabajadoras ({filteredWorkers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredWorkers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No se encontraron trabajadoras</p>
              <p className="text-slate-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View - Two Rows Layout */}
              <div className="hidden md:block">
                <div className="space-y-4">
                  {filteredWorkers.slice(0, 15).map((worker, index) => (
                    <div key={worker.id} className={`bg-white border border-slate-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      {/* Primera línea: Nombre y código */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg">
                            {worker.name.charAt(0)}{worker.surname.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">
                              {worker.name} {worker.surname}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium">
                              {worker.employee_code}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                            {getWorkerTypeLabel(worker.worker_type)}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${worker.is_active ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-white'}`}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${worker.is_active ? 'bg-green-300' : 'bg-red-300'}`}></div>
                            {worker.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                      {/* Segunda línea: Contacto */}
                      <div className="flex items-center space-x-6 mb-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          <span className="text-slate-700 font-medium">{worker.email}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          <span className="text-slate-700 font-medium">{worker.phone.replace(/^\+34\s*/, '')}</span>
                        </div>
                      </div>
                      {/* Tercera línea: Dirección */}
                      <div className="flex items-center space-x-6 mb-4">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span className="text-slate-700 font-medium">{worker.city || 'Sin ciudad'}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" /></svg>
                          <span className="text-slate-700 font-medium max-w-xs truncate" title={formatAddress(worker)}>{formatAddress(worker) || 'Sin dirección'}</span>
                        </div>
                      </div>
                      {/* Acciones */}
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/workers/${worker.id}`}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </Link>
                        <Link href={`/admin/workers/${worker.id}/edit`}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </Link>
                        <button
                          onClick={() => handleToggleActive(worker.id, worker.is_active)}
                          className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                            worker.is_active
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                          }`}>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={worker.is_active ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                          </svg>
                          {worker.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteWorker(worker.id)}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                  {filteredWorkers.slice(0, 15).map((worker) => (
                    <div key={worker.id} className="bg-white border-0 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                      {/* Header con avatar y nombre */}
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg">
                          {worker.name.charAt(0)}{worker.surname.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">
                            {worker.name} {worker.surname}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {worker.employee_code}
                          </p>
                        </div>
                      </div>
                      
                      {/* Badges debajo del nombre */}
                      <div className="flex gap-2 mb-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                          {getWorkerTypeLabel(worker.worker_type)}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${worker.is_active ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-white'}`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${worker.is_active ? 'bg-green-300' : 'bg-red-300'}`}></div>
                          {worker.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      
                      {/* Información de contacto */}
                      <div className="space-y-3 mb-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          <p className="text-slate-700 font-medium">{worker.email}</p>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          <p className="text-slate-700 font-medium">{worker.phone.replace(/^\+34\s*/, '')}</p>
                        </div>
                      </div>
                      
                      {/* Dirección */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <p className="text-slate-700 font-medium">{worker.city || 'Sin ciudad'}</p>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" /></svg>
                          <p className="text-slate-700 font-medium text-sm leading-relaxed">{formatAddress(worker) || 'Sin dirección'}</p>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="grid grid-cols-2 gap-3">
                        <Link href={`/admin/workers/${worker.id}`}
                          className="inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </Link>
                        <Link href={`/admin/workers/${worker.id}/edit`}
                          className="inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </Link>
                        <button
                          onClick={() => handleToggleActive(worker.id, worker.is_active)}
                          className={`inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                            worker.is_active
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                          }`}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={worker.is_active ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                          </svg>
                          {worker.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteWorker(worker.id)}
                          className="inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {filteredWorkers.length > 15 && (
                <div className="text-center py-4 border-t border-slate-200">
                  <p className="text-slate-500 text-sm">
                    Mostrando 15 de {filteredWorkers.length} trabajadoras
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats - Moved to bottom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card 
          className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('all')
            setTypeFilter('all')
            setShowStatusDropdown(false)
            setShowTypeDropdown(false)
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-100 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold text-white mt-1">{workers.length}</p>
                <p className="text-blue-200 text-xs mt-1">Trabajadoras</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-green-600 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('active')
            setTypeFilter('all')
            setShowStatusDropdown(false)
            setShowTypeDropdown(false)
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-100 uppercase tracking-wide">Activas</p>
                <p className="text-2xl font-bold text-white mt-1">{workers.filter(w => w.is_active).length}</p>
                <p className="text-green-200 text-xs mt-1">Disponibles</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-red-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('inactive')
            setTypeFilter('all')
            setShowStatusDropdown(false)
            setShowTypeDropdown(false)
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-100 uppercase tracking-wide">Inactivas</p>
                <p className="text-2xl font-bold text-white mt-1">{workers.filter(w => !w.is_active).length}</p>
                <p className="text-orange-200 text-xs mt-1">No disponibles</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-indigo-600 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('all')
            setTypeFilter('regular')
            setShowStatusDropdown(false)
            setShowTypeDropdown(false)
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-100 uppercase tracking-wide">Laborables</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {workers.filter(w => w.worker_type === 'regular').length}
                </p>
                <p className="text-purple-200 text-xs mt-1">Días laborables</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-xl bg-gradient-to-br from-pink-500 to-rose-600 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('all')
            setTypeFilter('holidays')
            setShowStatusDropdown(false)
            setShowTypeDropdown(false)
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-pink-100 uppercase tracking-wide">Festivos</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {workers.filter(w => w.worker_type === 'holidays' || w.worker_type === 'weekends').length}
                </p>
                <p className="text-pink-200 text-xs mt-1">Fines de semana</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-xl bg-gradient-to-br from-teal-500 to-cyan-600 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('all')
            setTypeFilter('flexible')
            setShowStatusDropdown(false)
            setShowTypeDropdown(false)
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-teal-100 uppercase tracking-wide">Flexibles</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {workers.filter(w => w.worker_type === 'flexible').length}
                </p>
                <p className="text-teal-200 text-xs mt-1">Ambos horarios</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteWorker}
        title="Eliminar Trabajadora"
        message="¿Estás seguro de que quieres eliminar esta trabajadora? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Toast Notification */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  )
} 