'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUsers, useActiveUsers } from '@/hooks/useUsers'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Plus, User, Phone, Clock, Calendar, Settings, LogOut, Edit, Menu, Users } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const { data: allUsers, isLoading: allUsersLoading } = useUsers()
  const { data: activeUsers, isLoading: activeUsersLoading } = useActiveUsers()
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
      {/* HEADER */}
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

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* ACCIONES RÁPIDAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link href="/dashboard/users/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="p-2 bg-blue-100 rounded-lg w-fit mx-auto mb-3">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Nuevo Usuario</h3>
                <p className="text-sm text-slate-600">Crear usuario del servicio</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/workers/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="p-2 bg-green-100 rounded-lg w-fit mx-auto mb-3">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Nueva Trabajadora</h3>
                <p className="text-sm text-slate-600">Agregar trabajadora</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/assignments/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="p-2 bg-purple-100 rounded-lg w-fit mx-auto mb-3">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Nueva Asignación</h3>
                <p className="text-sm text-slate-600">Crear asignación</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/planning">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="p-2 bg-orange-100 rounded-lg w-fit mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Planning</h3>
                <p className="text-sm text-slate-600">Ver calendario</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* USUARIOS RECIENTES */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Usuarios Recientes</h2>
              <Link href="/dashboard/users">
                <Button variant="secondary" size="sm">
                  Ver Todos
                </Button>
              </Link>
            </div>
            
            {allUsersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-slate-600">Cargando usuarios...</p>
              </div>
            ) : allUsers && allUsers.length > 0 ? (
              <div className="space-y-3">
                {allUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {user.name} {user.surname}
                        </p>
                        <p className="text-sm text-slate-600">
                          {user.phone} • {user.monthly_hours}h/mes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <Link href={`/dashboard/users/${user.id}/edit`}>
                        <Button variant="secondary" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">
                  <User className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No hay usuarios</h3>
                <p className="text-slate-600 mb-4">
                  Comienza creando tu primer usuario del servicio
                </p>
                <Link href="/dashboard/users/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Usuario
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RESUMEN GENERAL - SOLO UNA VEZ */}
        <Card className="mt-6 sm:mt-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Resumen General</h2>
            </div>
            
            {/* Desktop: 3 columnas */}
            <div className="hidden lg:grid grid-cols-3 gap-6">
              <div className="flex items-center">
                <div className="p-2 bg-sky-100 rounded-lg flex-shrink-0">
                  <User className="w-6 h-6 text-sky-600" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {allUsersLoading ? '...' : allUsers?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500">En base de datos</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                  <Clock className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {activeUsersLoading ? '...' : activeUsers?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500">Listos para asignar</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <Phone className="w-6 h-6 text-amber-600" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Horas Totales/Mes</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {activeUsersLoading ? '...' : activeUsers?.reduce((sum, u) => sum + (u.monthly_hours || 0), 0) || 0}h
                  </p>
                  <p className="text-xs text-slate-500">Para distribuir</p>
                </div>
              </div>
            </div>

            {/* Mobile: 1 columna */}
            <div className="lg:hidden grid grid-cols-1 gap-4">
              <div className="flex items-center">
                <div className="p-2 bg-sky-100 rounded-lg flex-shrink-0">
                  <User className="w-5 h-5 text-sky-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Total Usuarios</p>
                  <p className="text-xl font-bold text-slate-900">
                    {allUsersLoading ? '...' : allUsers?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500">En base de datos</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Usuarios Activos</p>
                  <p className="text-xl font-bold text-slate-900">
                    {activeUsersLoading ? '...' : activeUsers?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500">Listos para asignar</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <Phone className="w-5 h-5 text-amber-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-600">Horas Totales/Mes</p>
                  <p className="text-xl font-bold text-slate-900">
                    {activeUsersLoading ? '...' : activeUsers?.reduce((sum, u) => sum + (u.monthly_hours || 0), 0) || 0}h
                  </p>
                  <p className="text-xs text-slate-500">Para distribuir</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* FOOTER */}
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
    </div>
  )
} 