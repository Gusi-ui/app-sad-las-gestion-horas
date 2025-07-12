'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Home, 
  Users, 
  UserCheck, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Building2,
  Bell,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { name: 'Trabajadoras', href: '/admin/workers', icon: UserCheck },
  { name: 'Usuarios', href: '/admin/users', icon: Users },
  { name: 'Asignaciones', href: '/admin/assignments', icon: Calendar },
  { name: 'Planificación', href: '/admin/planning', icon: BarChart3 },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  
  // Si estamos en la página de login, no usar el contexto de autenticación
  const isLoginPage = pathname === '/admin/login'

  // Redirigir si no está autenticado o no es admin (solo si no estamos en login)
  useEffect(() => {
    if (!isLoginPage && !isLoading && (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/admin/login')
    }
  }, [isLoginPage, isLoading, isAuthenticated, user, router])

  const handleLogout = async () => {
    if (logout) {
      await logout()
      router.push('/admin/login')
    }
  }

  // Si estamos en la página de login, solo renderizar los children
  if (isLoginPage) {
    return <>{children}</>
  }

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center overflow-x-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // No mostrar nada si no está autenticado
  if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="relative p-2 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-xl flex-shrink-0 shadow-lg">
              {/* Casa con corazón - Logo principal */}
              <div className="relative w-6 h-6">
                {/* Casa */}
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z"/>
                </svg>
                {/* Corazón superpuesto - más visible */}
                <svg className="absolute inset-0 w-4 h-4 text-red-500 transform translate-x-1 translate-y-1 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"/>
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">App SAD</h1>
              <p className="text-xs text-slate-500">Servicios de Ayuda a Domicilio</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile sidebar footer */}
        <div className="p-4 border-t border-slate-200">
          <Button
            onClick={handleLogout}
            className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-transparent border-0"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="w-full">
        {/* Top navigation bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="flex flex-col h-20 lg:h-24 px-4 sm:px-6 lg:px-8 max-w-full">
            {/* First row - Logo and navigation icons */}
            <div className="flex items-center justify-between h-12 lg:h-14">
              {/* Left side - Logo */}
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative p-2 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-xl flex-shrink-0 shadow-lg">
                  {/* Casa con corazón - Logo principal */}
                  <div className="relative w-6 h-6">
                    {/* Casa */}
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z"/>
                    </svg>
                                    {/* Corazón superpuesto - más visible */}
                <svg className="absolute inset-0 w-4 h-4 text-red-500 transform translate-x-1 translate-y-1 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"/>
                </svg>
                  </div>
                </div>
                <div className="hidden sm:block min-w-0">
                  <h1 className="text-lg font-bold text-slate-900 truncate">App SAD</h1>
                  <p className="text-xs text-slate-500 truncate">Servicios de Ayuda a Domicilio</p>
                </div>
                {/* Mobile page title */}
                <div className="sm:hidden min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900 truncate">
                    {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                  </h2>
                </div>
              </div>

              {/* Center - Desktop navigation with icons and names */}
              <nav className="hidden lg:flex items-center space-x-2 flex-shrink-0">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative flex-shrink-0
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }
                      `}
                    >
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Right side - Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex-shrink-0"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Second row - Search, notifications, user */}
            <div className="flex items-center justify-between h-8 lg:h-10">
              {/* Left side - Search (larger) */}
              <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar trabajadoras, usuarios, asignaciones..."
                    className="pl-10 w-64 lg:w-80 xl:w-96 h-8 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Right side - Notifications and user */}
              <div className="flex items-center space-x-3 min-w-0 ml-auto">
                {/* Notifications */}
                <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 relative flex-shrink-0">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                </button>

                {/* User menu */}
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-600 min-w-0">
                    <span className="truncate">{user?.full_name || user?.email}</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                    <span className="text-xs text-slate-500 flex-shrink-0">({user?.role === 'super_admin' ? 'Super Admin' : 'Admin'})</span>
                  </div>
                  <Button
                    onClick={handleLogout}
                    className="hidden sm:flex items-center space-x-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-transparent border-0 flex-shrink-0 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 max-w-full overflow-x-hidden">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 