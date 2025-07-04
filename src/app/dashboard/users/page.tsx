'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Eye, Phone, MapPin, Clock, Trash2, ArrowLeft, Settings, LogOut, Menu, Filter, Users, UserX, UserCheck, User, Calendar, Search } from 'lucide-react'

interface User {
  id: string
  name: string
  surname: string
  phone: string
  address: string | null
  notes: string | null
  is_active: boolean
  monthly_hours: number
  created_at: string
  updated_at: string
}

// Configuración para evitar el prerender estático
export const dynamic = 'force-dynamic'


interface ModalState {
  isOpen: boolean
  type: 'deactivate' | 'delete' | 'restore'
  user: User | null
}

export default function UsersPage() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showInactiveUsers, setShowInactiveUsers] = useState(false)
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: 'deactivate',
    user: null
  })
  const [searchValue, setSearchValue] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        showToast('Error al cargar usuarios', 'error')
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      showToast('Error inesperado al cargar usuarios', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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

  const openModal = (type: 'deactivate' | 'delete' | 'restore', user: User) => {
    setModalState({ isOpen: true, type, user })
  }

  const closeModal = () => {
    setModalState({ isOpen: false, type: 'deactivate', user: null })
  }

  const handleDeactivateUser = async () => {
    if (!modalState.user) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', modalState.user.id)

      if (error) {
        console.error('Error deactivating user:', error)
        showToast('Error al desactivar usuario', 'error')
        return
      }

      showToast('Usuario desactivado correctamente', 'success')
      fetchUsers()
    } catch (error) {
      console.error('Error deactivating user:', error)
      showToast('Error inesperado al desactivar usuario', 'error')
    }
  }

  const handleDeleteUser = async () => {
    if (!modalState.user) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', modalState.user.id)

      if (error) {
        console.error('Error deleting user:', error)
        showToast('Error al eliminar usuario', 'error')
        return
      }

      showToast('Usuario eliminado definitivamente', 'success')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      showToast('Error inesperado al eliminar usuario', 'error')
    }
  }

  const handleRestoreUser = async () => {
    if (!modalState.user) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', modalState.user.id)

      if (error) {
        console.error('Error restoring user:', error)
        showToast('Error al reactivar usuario', 'error')
        return
      }

      showToast('Usuario reactivado correctamente', 'success')
      fetchUsers()
    } catch (error) {
      console.error('Error restoring user:', error)
      showToast('Error inesperado al reactivar usuario', 'error')
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

  // Filtrar usuarios según el estado del filtro
  const filteredUsers = (showInactiveUsers ? users : users.filter(user => user.is_active))
    .filter(user => {
      const q = searchValue.toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        user.surname.toLowerCase().includes(q) ||
        user.phone?.toLowerCase().includes(q) ||
        user.address?.toLowerCase().includes(q)
      );
    });

  const activeUsers = users.filter(user => user.is_active)
  const inactiveUsers = users.filter(user => !user.is_active)

  // Configuración del modal según el tipo
  const getModalConfig = () => {
    if (!modalState.user) return null

    const userName = `${modalState.user.name} ${modalState.user.surname}`

    switch (modalState.type) {
      case 'deactivate':
        return {
          title: 'Desactivar Usuario',
          message: `¿Estás seguro de que quieres desactivar a ${userName}? El usuario permanecerá en la base de datos pero no podrá recibir asignaciones.`,
          type: 'warning' as const,
          confirmText: 'Desactivar',
          cancelText: 'Cancelar',
          onConfirm: handleDeactivateUser,
          icon: <UserX className="w-6 h-6 text-amber-600" />
        }
      case 'delete':
        return {
          title: 'Eliminar Usuario Definitivamente',
          message: `¿Estás seguro de que quieres eliminar definitivamente a ${userName}? Esta acción no se puede deshacer y se perderán todos los datos del usuario.`,
          type: 'danger' as const,
          confirmText: 'Eliminar Definitivamente',
          cancelText: 'Cancelar',
          onConfirm: handleDeleteUser,
          icon: <Trash2 className="w-6 h-6 text-red-600" />
        }
      case 'restore':
        return {
          title: 'Reactivar Usuario',
          message: `¿Estás seguro de que quieres reactivar a ${userName}? El usuario podrá volver a recibir asignaciones.`,
          type: 'info' as const,
          confirmText: 'Reactivar',
          cancelText: 'Cancelar',
          onConfirm: handleRestoreUser,
          icon: <UserCheck className="w-6 h-6 text-green-600" />
        }
      default:
        return null
    }
  }

  const modalConfig = getModalConfig()

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary mobile-menu-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-secondary truncate">
                Gestión de Usuarios
              </h1>
              <p className="text-sm text-slate-600 truncate">
                Administra los usuarios del servicio de atención domiciliaria
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
              <Link href="/dashboard/workers">
                <Button variant="secondary" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Trabajadoras
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
            <div className="py-4 border-t border-secondary bg-white shadow-lg">
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
                <Link href="/dashboard/workers" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Trabajadoras
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
          <Link href="/dashboard/users/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto">
              <div className="p-2 bg-primary/10 rounded-lg mb-2">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-secondary text-center whitespace-normal break-words leading-snug">
                Nuevo Usuario
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 text-center whitespace-normal break-words leading-snug">
                Crear usuario
              </p>
            </Card>
          </Link>

          <Link href="/dashboard/planning">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto">
              <div className="p-2 bg-warning/10 rounded-lg mb-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-secondary text-center whitespace-normal break-words leading-snug">
                Planning
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 text-center whitespace-normal break-words leading-snug">
                Ver calendario
              </p>
            </Card>
          </Link>

          <Link href="/dashboard/workers">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto">
              <div className="p-2 bg-success/10 rounded-lg mb-2">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-secondary text-center whitespace-normal break-words leading-snug">
                Trabajadoras
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 text-center whitespace-normal break-words leading-snug">
                Gestionar trabajadoras
              </p>
            </Card>
          </Link>

          {/* Tarjeta de búsqueda inteligente */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto p-0">
            <div className="p-2 bg-accent/10 rounded-lg mb-1 mt-1">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base text-secondary text-center whitespace-normal break-words leading-snug">
              Buscar usuario
            </h3>
            <div className="w-full flex-1 flex items-center">
              <input
                type="text"
                placeholder="Nombre, email o teléfono"
                className="mt-0 py-1 text-xs sm:text-sm rounded border border-secondary w-full focus:outline-none focus:border-primary"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
              />
            </div>
          </Card>
        </div>

        {/* LISTADO DE USUARIOS */}
        <Card className="mx-0 sm:mx-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-secondary">Lista de Usuarios</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} mostrados
                  {!showInactiveUsers && inactiveUsers.length > 0 && (
                    <span className="text-warning ml-2">
                      ({inactiveUsers.length} inactivos ocultos)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setShowInactiveUsers(!showInactiveUsers)}
                  className="flex items-center"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showInactiveUsers ? 'Ocultar Inactivos' : 'Mostrar Todos'}
                </Button>
              </div>
            </div>

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">
                  <Users className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-secondary mb-2">
                  {showInactiveUsers ? 'No hay usuarios' : 'No hay usuarios activos'}
                </h3>
                <p className="text-slate-600 mb-4">
                  {showInactiveUsers 
                    ? 'Comienza creando tu primer usuario del servicio'
                    : 'Todos los usuarios están inactivos o no hay usuarios registrados'
                  }
                </p>
                <Link href="/dashboard/users/new">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Usuario
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary">
                        <th className="text-left py-3 px-4 font-medium text-secondary">Usuario</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary">Contacto</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary">Horas/Mes</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary">Estado</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary">Creado</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-secondary hover:bg-secondary">
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-secondary">
                                {user.name} {user.surname}
                              </div>
                              {user.address && (
                                <div className="text-sm text-slate-600 flex items-center mt-1">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {user.address.length > 50 
                                    ? `${user.address.substring(0, 50)}...` 
                                    : user.address
                                  }
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center text-sm text-slate-600">
                              <Phone className="w-3 h-3 mr-1" />
                              {formatPhone(user.phone)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-primary mr-1" />
                              <span className="font-medium text-secondary">
                                {user.monthly_hours}h
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_active 
                                ? 'bg-success/10 text-success' 
                                : 'bg-danger/10 text-danger'
                            }`}>
                              {user.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <Link href={`/dashboard/users/${user.id}`}>
                                <Button variant="secondary" size="sm">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ver
                                </Button>
                              </Link>
                              <Link href={`/dashboard/users/${user.id}/edit`}>
                                <Button variant="secondary" size="sm">
                                  <Edit className="w-3 h-3 mr-1" />
                                  Editar
                                </Button>
                              </Link>
                              {user.is_active ? (
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => openModal('deactivate', user)}
                                    className="text-warning hover:text-warning/80 hover:bg-warning/10"
                                  >
                                    <UserX className="w-3 h-3 mr-1" />
                                    Desactivar
                                  </Button>
                                  <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => openModal('delete', user)}
                                    className="text-danger hover:text-danger/80 hover:bg-danger/10"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Eliminar
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => openModal('restore', user)}
                                  className="text-success hover:text-success/80 hover:bg-success/10"
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
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-white border border-secondary rounded-lg p-3 sm:p-4 shadow-sm mx-0 sm:mx-0">
                      {/* User Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-secondary text-lg">
                            {user.name} {user.surname}
                          </h3>
                          <div className="flex items-center mt-1">
                            <Phone className="w-3 h-3 mr-1 text-slate-500" />
                            <span className="text-sm text-slate-600">
                              {formatPhone(user.phone)}
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-success/10 text-success' 
                            : 'bg-danger/10 text-danger'
                        }`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      {/* User Details */}
                      <div className="space-y-2 mb-4">
                        {user.address && (
                          <div className="flex items-start text-sm text-slate-600">
                            <MapPin className="w-3 h-3 mr-2 mt-0.5 text-slate-500" />
                            <span className="flex-1">
                              {user.address.length > 60 
                                ? `${user.address.substring(0, 60)}...` 
                                : user.address
                              }
                            </span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-slate-600">
                          <Clock className="w-3 h-3 mr-2 text-slate-500" />
                          <span className="font-medium text-secondary">
                            {user.monthly_hours}h/mes
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          Creado: {formatDate(user.created_at)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/users/${user.id}`}>
                          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                        </Link>
                        <Link href={`/dashboard/users/${user.id}/edit`}>
                          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        {user.is_active ? (
                          <>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => openModal('deactivate', user)}
                              className="flex-1 sm:flex-none text-warning hover:text-warning/80 hover:bg-warning/10"
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              Desactivar
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => openModal('delete', user)}
                              className="flex-1 sm:flex-none text-danger hover:text-danger/80 hover:bg-danger/10"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Eliminar
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => openModal('restore', user)}
                            className="flex-1 sm:flex-none text-success hover:text-success/80 hover:bg-success/10"
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
              <h2 className="text-lg font-semibold text-secondary">Resumen de Usuarios</h2>
            </div>
            
            {/* Desktop: 4 columnas */}
            <div className="hidden lg:grid grid-cols-4 gap-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-secondary">{users.length}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-success/10 rounded-lg flex-shrink-0">
                  <Clock className="w-6 h-6 text-success" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-secondary">
                    {activeUsers.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-warning/10 rounded-lg flex-shrink-0">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Horas Totales</p>
                  <p className="text-2xl font-bold text-secondary">
                    {activeUsers.reduce((sum, user) => sum + user.monthly_hours, 0).toFixed(1)}h
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-accent/10 rounded-lg flex-shrink-0">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Con Dirección</p>
                  <p className="text-2xl font-bold text-secondary">
                    {activeUsers.filter(u => u.address).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile: 2x2 grid */}
            <div className="lg:hidden grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Total</p>
                  <p className="text-xl font-bold text-secondary">{users.length}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-success/10 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-success" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Activos</p>
                  <p className="text-xl font-bold text-secondary">
                    {activeUsers.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-warning/10 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Horas</p>
                  <p className="text-xl font-bold text-secondary">
                    {activeUsers.reduce((sum, user) => sum + user.monthly_hours, 0).toFixed(1)}h
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-accent/10 rounded-lg flex-shrink-0">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Con Dir.</p>
                  <p className="text-xl font-bold text-secondary">
                    {activeUsers.filter(u => u.address).length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer de navegación fijo */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-secondary shadow-lg">
        <nav className="flex justify-around py-3">
          <Link href="/dashboard/users" className="flex flex-col items-center text-xs text-slate-600 hover:text-primary transition-colors">
            <User className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Usuarios</span>
          </Link>
          <Link href="/dashboard/workers" className="flex flex-col items-center text-xs text-slate-600 hover:text-success transition-colors">
            <Users className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Trabajadoras</span>
          </Link>
          <Link href="/dashboard/assignments" className="flex flex-col items-center text-xs text-slate-600 hover:text-accent transition-colors">
            <Clock className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Asignaciones</span>
          </Link>
          <Link href="/dashboard/planning" className="flex flex-col items-center text-xs text-slate-600 hover:text-warning transition-colors">
            <Calendar className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Planning</span>
          </Link>
          <Link href="/dashboard/settings" className="flex flex-col items-center text-xs text-slate-600 hover:text-secondary transition-colors">
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
