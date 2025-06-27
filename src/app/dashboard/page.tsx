'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUsers } from '@/hooks/useUsers'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Plus, User, Phone, Clock, Calendar, Settings, LogOut, Edit, Trash2, Menu } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const { data: users, isLoading, error } = useUsers()
  const router = useRouter()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }
    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                🏢 Panel Administrativo
              </h1>
              <p className="text-sm text-slate-600 truncate">
                Centro de control para planificación • Bienvenida, {user.user_metadata?.full_name || user.email}
              </p>
              <div className="flex items-center space-x-2 mt-2 overflow-x-auto">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                  👩‍💼 Administración
                </span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                  📊 Control Central
                </span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/dashboard/planning">
                <Button variant="secondary" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Planning
                </Button>
              </Link>
              <Link href="/dashboard/workers">
                <Button variant="secondary" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Trabajadoras
                </Button>
              </Link>
              <Link href="/dashboard/assignments">
                <Button variant="secondary" size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Asignaciones
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="secondary" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <div className="md:hidden py-4 border-t border-slate-200">
              <div className="flex flex-col space-y-2">
                <Link href="/dashboard/planning">
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Planning
                  </Button>
                </Link>
                <Link href="/dashboard/workers">
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Trabajadoras
                  </Button>
                </Link>
                <Link href="/dashboard/assignments">
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Clock className="w-4 h-4 mr-2" />
                    Asignaciones
                  </Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={handleLogout} className="w-full justify-start">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-sky-100 rounded-lg flex-shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Total Usuarios</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">
                    {isLoading ? '...' : users?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500">En base de datos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Usuarios Activos</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">
                    {isLoading ? '...' : users?.filter(u => u.is_active)?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500">Listos para asignar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Horas Totales/Mes</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">
                    {isLoading ? '...' : users?.reduce((sum, u) => sum + (u.monthly_hours || 0), 0) || 0}h
                  </p>
                  <p className="text-xs text-slate-500">Para distribuir</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              👥 Gestión de Usuarios
            </h2>
            <p className="text-sm text-slate-600">
              Administra usuarios para asignar a trabajadoras y generar plannings
            </p>
          </div>
          <Link href="/dashboard/users/new">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Nuevo Usuario
            </Button>
          </Link>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando usuarios...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600">Error al cargar usuarios. Inténtalo de nuevo.</p>
            </CardContent>
          </Card>
        ) : users && users.length > 0 ? (
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} hover className="cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {user.name} {user.surname}
                        </h3>
                        <p className="text-slate-600 flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{user.phone}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <div className="flex flex-col text-right text-sm">
                        <span className="font-medium text-slate-900">
                          {user.monthly_hours || 0}h/mes
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/users/${user.id}/edit`}>
                          <Button variant="secondary" size="sm" className="text-xs">
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        <Link href={`/dashboard/users/${user.id}`}>
                          <Button variant="secondary" size="sm" className="text-xs">
                            Ver detalles
                          </Button>
                        </Link>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={async (e) => {
                            e.preventDefault()
                            if (confirm(`¿Estás segura de que quieres eliminar a ${user.name} ${user.surname}?`)) {
                              try {
                                const { error } = await supabase
                                  .from('users')
                                  .delete()
                                  .eq('id', user.id)
                                
                                if (error) throw error
                                
                                // Recargar la página para actualizar la lista
                                window.location.reload()
                              } catch (error) {
                                console.error('Error al eliminar usuario:', error)
                                alert('Error al eliminar el usuario')
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <User className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Aún no tienes usuarios
              </h3>
              <p className="text-slate-600 mb-6">
                Empieza dando de alta a tu primer usuario para gestionar sus servicios.
              </p>
              <Link href="/dashboard/users/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer usuario
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
} 