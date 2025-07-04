'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useWorkers } from '@/hooks/useWorkers'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Eye, Phone, MapPin, Clock, Trash2, ArrowLeft, Settings, LogOut, Menu, Filter, Users, UserX, UserCheck, User, Calendar, AlertTriangle, Mail, Award, Search } from 'lucide-react'
import { Worker } from '@/lib/types'

// Configuración para evitar el prerender estático
export const dynamic = 'force-dynamic'


interface ModalState {
  isOpen: boolean
  type: 'deactivate' | 'delete' | 'restore'
  worker: Worker | null
}

export default function WorkersPage() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const { workers, isLoading, error, deleteWorker } = useWorkers()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showInactiveWorkers, setShowInactiveWorkers] = useState(false)
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: 'deactivate',
    worker: null
  })
  const [searchValue, setSearchValue] = useState('');

  // Cerrar menú móvil cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showMobileMenu && !target.closest('.mobile-menu-container')) {
        setShowMobileMenu(false)
      }
    }

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMobileMenu])

  const openModal = (type: 'deactivate' | 'delete' | 'restore', worker: Worker) => {
    setModalState({ isOpen: true, type, worker })
  }

  const closeModal = () => {
    setModalState({ isOpen: false, type: 'deactivate', worker: null })
  }

  const handleDeactivateWorker = async () => {
    if (!modalState.worker) return

    try {
      const { error } = await deleteWorker(modalState.worker.id)

      if (error) {
        showToast('Error al desactivar trabajadora', 'error')
        return
      }

      showToast('Trabajadora desactivada correctamente', 'success')
    } catch (error) {
      console.error('Error deactivating worker:', error)
      showToast('Error inesperado al desactivar trabajadora', 'error')
    }
  }

  const handleDeleteWorker = async () => {
    if (!modalState.worker) return

    try {
      const { error } = await deleteWorker(modalState.worker.id)

      if (error) {
        showToast('Error al eliminar trabajadora', 'error')
        return
      }

      showToast('Trabajadora eliminada definitivamente', 'success')
    } catch (error) {
      console.error('Error deleting worker:', error)
      showToast('Error inesperado al eliminar trabajadora', 'error')
    }
  }

  const handleRestoreWorker = async () => {
    if (!modalState.worker) return

    try {
      // Implementar reactivación de trabajadora
      showToast('Trabajadora reactivada correctamente', 'success')
    } catch (error) {
      console.error('Error restoring worker:', error)
      showToast('Error inesperado al reactivar trabajadora', 'error')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    }
    return phone
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Filtrar trabajadoras según el estado del filtro
  const filteredWorkers = (showInactiveWorkers ? workers : workers.filter(worker => worker.is_active))
    .filter(worker => {
      const q = searchValue.toLowerCase();
      return (
        worker.name.toLowerCase().includes(q) ||
        worker.surname.toLowerCase().includes(q) ||
        worker.email?.toLowerCase().includes(q) ||
        worker.phone?.toLowerCase().includes(q)
      );
    });

  const activeWorkers = workers.filter(worker => worker.is_active)
  const inactiveWorkers = workers.filter(worker => !worker.is_active)

  // Configuración del modal según el tipo
  const getModalConfig = () => {
    if (!modalState.worker) return null

    const workerName = `${modalState.worker.name} ${modalState.worker.surname}`

    switch (modalState.type) {
      case 'deactivate':
        return {
          title: 'Desactivar Trabajadora',
          message: `¿Estás seguro de que quieres desactivar a ${workerName}? La trabajadora permanecerá en la base de datos pero no podrá recibir asignaciones.`,
          type: 'warning' as const,
          confirmText: 'Desactivar',
          cancelText: 'Cancelar',
          onConfirm: handleDeactivateWorker,
          icon: <UserX className="w-6 h-6 text-amber-600" />
        }
      case 'delete':
        return {
          title: 'Eliminar Trabajadora Definitivamente',
          message: `¿Estás seguro de que quieres eliminar definitivamente a ${workerName}? Esta acción no se puede deshacer y se perderán todos los datos de la trabajadora.`,
          type: 'danger' as const,
          confirmText: 'Eliminar Definitivamente',
          cancelText: 'Cancelar',
          onConfirm: handleDeleteWorker,
          icon: <Trash2 className="w-6 h-6 text-red-600" />
        }
      case 'restore':
        return {
          title: 'Reactivar Trabajadora',
          message: `¿Estás seguro de que quieres reactivar a ${workerName}? La trabajadora podrá volver a recibir asignaciones.`,
          type: 'info' as const,
          confirmText: 'Reactivar',
          cancelText: 'Cancelar',
          onConfirm: handleRestoreWorker,
          icon: <UserCheck className="w-6 h-6 text-green-600" />
        }
      default:
        return null
    }
  }

  const modalConfig = getModalConfig()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando trabajadoras...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error al cargar trabajadoras: {error}</p>
            <Link href="/dashboard">
              <Button>Volver al Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 mobile-menu-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                Gestión de Trabajadoras
              </h1>
              <p className="text-sm text-slate-600 truncate">
                Administra el personal de atención domiciliaria
              </p>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/planning">
                <Button variant="secondary" size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Planning
                </Button>
              </Link>
              <Link href="/dashboard/users">
                <Button variant="secondary" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Usuarios
                </Button>
              </Link>
              <Link href="/dashboard/assignments">
                <Button variant="secondary" size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Asignaciones
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden relative">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Abrir menú de navegación"
                aria-expanded={showMobileMenu}
                className="relative z-10"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out ${
            showMobileMenu 
              ? 'max-h-96 opacity-100 visible' 
              : 'max-h-0 opacity-0 invisible'
          }`}>
            <div className="py-4 border-t border-slate-200 bg-white shadow-lg">
              <div className="flex flex-col space-y-2 px-4">
                <Link href="/dashboard" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/planning" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Clock className="w-4 h-4 mr-2" />
                    Planning
                  </Button>
                </Link>
                <Link href="/dashboard/users" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Usuarios
                  </Button>
                </Link>
                <Link href="/dashboard/assignments" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Clock className="w-4 h-4 mr-2" />
                    Asignaciones
                  </Button>
                </Link>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    handleLogout()
                    setShowMobileMenu(false)
                  }} 
                  className="w-full justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8">
        
        {/* ACCIONES RÁPIDAS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Link href="/dashboard/workers/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto">
              <div className="p-2 bg-green-100 rounded-lg mb-2">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-900 text-center whitespace-normal break-words leading-snug">
                Nueva Trabajadora
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 text-center whitespace-normal break-words leading-snug">
                Agregar trabajadora
              </p>
            </Card>
          </Link>

          <Link href="/dashboard/planning">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto">
              <div className="p-2 bg-orange-100 rounded-lg mb-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-900 text-center whitespace-normal break-words leading-snug">
                Planning
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 text-center whitespace-normal break-words leading-snug">
                Ver calendario
              </p>
            </Card>
          </Link>

          <Link href="/dashboard/assignments">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto">
              <div className="p-2 bg-purple-100 rounded-lg mb-2">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-900 text-center whitespace-normal break-words leading-snug">
                Asignaciones
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 text-center whitespace-normal break-words leading-snug">
                Gestionar asignaciones
              </p>
            </Card>
          </Link>

          <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto p-0">
            <div className="p-2 bg-sky-100 rounded-lg mb-1 mt-1">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base text-slate-900 text-center whitespace-normal break-words leading-snug">
              Buscar trabajadora
            </h3>
            <div className="w-full flex-1 flex items-center">
              <input type="text" placeholder="Nombre, email o teléfono" className="mt-0 py-1 text-xs sm:text-sm rounded border border-slate-300 w-full focus:outline-none" value={searchValue} onChange={e => setSearchValue(e.target.value)} />
            </div>
          </Card>
        </div>

        {/* LISTADO DE TRABAJADORAS */}
        <Card className="mx-0 sm:mx-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Lista de Trabajadoras</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {filteredWorkers.length} trabajadora{filteredWorkers.length !== 1 ? 's' : ''} mostrada{filteredWorkers.length !== 1 ? 's' : ''}
                  {!showInactiveWorkers && inactiveWorkers.length > 0 && (
                    <span className="text-amber-600 ml-2">
                      ({inactiveWorkers.length} inactivas ocultas)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setShowInactiveWorkers(!showInactiveWorkers)}
                  className="flex items-center"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showInactiveWorkers ? 'Ocultar Inactivas' : 'Mostrar Todas'}
                </Button>
              </div>
            </div>

            {/* Workers Table */}
            {filteredWorkers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">
                  <Users className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {showInactiveWorkers ? 'No hay trabajadoras' : 'No hay trabajadoras activas'}
                </h3>
                <p className="text-slate-600 mb-4">
                  {showInactiveWorkers 
                    ? 'Comienza creando tu primera trabajadora'
                    : 'Todas las trabajadoras están inactivas o no hay trabajadoras registradas'
                  }
                </p>
                <Link href="/dashboard/workers/new">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Trabajadora
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Trabajadora</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Contacto</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Estado</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Contratada</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.map((worker) => (
                        <tr key={worker.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-slate-900">
                                {worker.name} {worker.surname}
                              </div>
                              {worker.address && (
                                <div className="text-sm text-slate-600 flex items-center mt-1">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {worker.address.length > 50 
                                    ? `${worker.address.substring(0, 50)}...` 
                                    : worker.address
                                  }
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-slate-600">
                                <Phone className="w-3 h-3 mr-1" />
                                {formatPhone(worker.phone)}
                              </div>
                              {worker.email && (
                                <div className="flex items-center text-sm text-slate-600">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {worker.email.length > 30 
                                    ? `${worker.email.substring(0, 30)}...` 
                                    : worker.email
                                  }
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              worker.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {worker.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600">
                            {formatDate(worker.hire_date)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <Link href={`/dashboard/workers/${worker.id}`}>
                                <Button variant="secondary" size="sm">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ver
                                </Button>
                              </Link>
                              <Link href={`/dashboard/workers/${worker.id}/edit`}>
                                <Button variant="secondary" size="sm">
                                  <Edit className="w-3 h-3 mr-1" />
                                  Editar
                                </Button>
                              </Link>
                              {worker.is_active ? (
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => openModal('deactivate', worker)}
                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  >
                                    <UserX className="w-3 h-3 mr-1" />
                                    Desactivar
                                  </Button>
                                  <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => openModal('delete', worker)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Eliminar
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => openModal('restore', worker)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Reactivar
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3 sm:space-y-4">
                  {filteredWorkers.map((worker) => (
                    <div key={worker.id} className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-sm mx-0 sm:mx-0">
                      {/* Worker Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-lg">
                            {worker.name} {worker.surname}
                          </h3>
                          <div className="flex items-center mt-1">
                            <Phone className="w-3 h-3 mr-1 text-slate-500" />
                            <span className="text-sm text-slate-600">
                              {formatPhone(worker.phone)}
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          worker.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {worker.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>

                      {/* Worker Details */}
                      <div className="space-y-2 mb-4">
                        {worker.address && (
                          <div className="flex items-start text-sm text-slate-600">
                            <MapPin className="w-3 h-3 mr-2 mt-0.5 text-slate-500" />
                            <span className="flex-1">
                              {worker.address.length > 60 
                                ? `${worker.address.substring(0, 60)}...` 
                                : worker.address
                              }
                            </span>
                          </div>
                        )}
                        {worker.email && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Mail className="w-3 h-3 mr-2 text-slate-500" />
                            <span className="truncate">
                              {worker.email.length > 40 
                                ? `${worker.email.substring(0, 40)}...` 
                                : worker.email
                              }
                            </span>
                          </div>
                        )}
                        <div className="text-sm text-slate-600">
                          Contratada: {formatDate(worker.hire_date)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/workers/${worker.id}`}>
                          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                        </Link>
                        <Link href={`/dashboard/workers/${worker.id}/edit`}>
                          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        {worker.is_active ? (
                          <>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => openModal('deactivate', worker)}
                              className="flex-1 sm:flex-none text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              Desactivar
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => openModal('delete', worker)}
                              className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Eliminar
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => openModal('restore', worker)}
                            className="flex-1 sm:flex-none text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            Reactivar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* RESUMEN GENERAL - SOLO UNA VEZ */}
        <Card className="mt-6 sm:mt-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Resumen de Trabajadoras</h2>
            </div>
            
            {/* Desktop: 4 columnas */}
            <div className="hidden lg:grid grid-cols-4 gap-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Total Trabajadoras</p>
                  <p className="text-2xl font-bold text-slate-900">{workers.length}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Trabajadoras Activas</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {activeWorkers.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Especializaciones</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {workers.reduce((sum, worker) => sum + (worker.specializations?.length || 0), 0)}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Horas Disponibles</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {activeWorkers.reduce((sum, worker) => sum + worker.max_weekly_hours, 0)}h/sem
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile: 2x2 grid */}
            <div className="lg:hidden grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Total</p>
                  <p className="text-xl font-bold text-slate-900">{workers.length}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Activas</p>
                  <p className="text-xl font-bold text-slate-900">
                    {activeWorkers.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Especializ.</p>
                  <p className="text-xl font-bold text-slate-900">
                    {workers.reduce((sum, worker) => sum + (worker.specializations?.length || 0), 0)}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Horas</p>
                  <p className="text-xl font-bold text-slate-900">
                    {activeWorkers.reduce((sum, worker) => sum + worker.max_weekly_hours, 0)}h/sem
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer de navegación fijo */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
        <nav className="flex justify-around py-3">
          <Link href="/dashboard/users" className="flex flex-col items-center text-xs text-slate-600 hover:text-blue-600 transition-colors">
            <User className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Usuarios</span>
          </Link>
          <Link href="/dashboard/workers" className="flex flex-col items-center text-xs text-slate-600 hover:text-green-600 transition-colors">
            <Users className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Trabajadoras</span>
          </Link>
          <Link href="/dashboard/assignments" className="flex flex-col items-center text-xs text-slate-600 hover:text-purple-600 transition-colors">
            <Clock className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Asignaciones</span>
          </Link>
          <Link href="/dashboard/planning" className="flex flex-col items-center text-xs text-slate-600 hover:text-orange-600 transition-colors">
            <Calendar className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Planning</span>
          </Link>
          <Link href="/dashboard/settings" className="flex flex-col items-center text-xs text-slate-600 hover:text-slate-800 transition-colors">
            <Settings className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Configuración</span>
          </Link>
        </nav>
      </footer>

      {/* Espacio para el footer fijo */}
      <div className="h-20"></div>

      {/* Modal de Confirmación */}
      {modalConfig && (
        <Modal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          confirmText={modalConfig.confirmText}
          cancelText={modalConfig.cancelText}
          onConfirm={modalConfig.onConfirm}
          icon={modalConfig.icon}
        />
      )}

      {ToastComponent}
    </div>
  )
} 