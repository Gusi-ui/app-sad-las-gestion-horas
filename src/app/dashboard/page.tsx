'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUsers } from '@/hooks/useUsers'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Plus, User, Phone, Clock, Settings, LogOut } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const { data: users, isLoading, error } = useUsers()
  const router = useRouter()

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
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600">Bienvenida, {user.user_metadata?.full_name || user.email}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="secondary" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </Button>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                                 <div className="p-2 bg-sky-100 rounded-lg">
                   <User className="w-6 h-6 text-sky-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoading ? '...' : users?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Clock className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoading ? '...' : users?.filter(u => u.is_active)?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Phone className="w-6 h-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Servicios del Mes</p>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Mis Usuarios</h2>
          <Link href="/dashboard/users/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
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
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {user.name} {user.surname}
                        </h3>
                        <p className="text-slate-600 flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {user.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <Link href={`/dashboard/users/${user.id}`}>
                        <Button variant="secondary" size="sm">
                          Ver detalles
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
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