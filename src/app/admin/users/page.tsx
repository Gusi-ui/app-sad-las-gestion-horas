'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Users, Plus, User, UserCheck, UserX, Filter, ChevronDown } from 'lucide-react'

interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

interface User {
  id: string
  name: string
  surname: string
  email: string
  is_active: boolean
  client_code: string
  phone: string
  address: string
  city: string
  postal_code: string
  emergency_contacts?: EmergencyContact[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)


  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, statusFilter])

  const fetchUsers = async () => {
    if (!supabase) {
      console.error('Supabase client no disponible')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, surname, email, is_active, client_code, phone, address, city, postal_code, emergency_contacts')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al cargar usuarios:', error)
        alert('Error al cargar usuarios: ' + JSON.stringify(error))
      } else {
        setUsers(data || [])
        setFilteredUsers(data || [])
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      alert('Error inesperado: ' + JSON.stringify(error))
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.client_code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user =>
        statusFilter === 'active' ? user.is_active : !user.is_active
      )
    }

    setFilteredUsers(filtered)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!supabase) return
    if (!confirm('¿Seguro que quieres eliminar este usuario?')) return
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId)
      if (error) throw error
      setUsers(users.filter(u => u.id !== userId))
      setFilteredUsers(filteredUsers.filter(u => u.id !== userId))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert('Error al eliminar usuario: ' + errorMessage)
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    if (!supabase) return
    try {
      const { error } = await supabase.from('users').update({ is_active: !isActive }).eq('id', userId)
      if (error) throw error
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !isActive } : u))
      setFilteredUsers(filteredUsers.map(u => u.id === userId ? { ...u, is_active: !isActive } : u))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert('Error al actualizar estado: ' + errorMessage)
    }
  }



  // Stats calculations
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.is_active).length
  const inactiveUsers = users.filter(u => !u.is_active).length

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activos'
      case 'inactive': return 'Inactivos'
      default: return 'Todos los estados'
    }
  }

  const getInitials = (name: string, surname: string) => {
    const nameInitial = name?.trim()?.charAt(0)?.toUpperCase() || 'U'
    const surnameInitial = surname?.trim()?.charAt(0)?.toUpperCase() || ''
    return nameInitial + surnameInitial
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando usuarios...</p>
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
            Gestión de Usuarios
          </h1>
          <p className="text-slate-600">
            Administra clientes y sus servicios
          </p>
        </div>
        <Link href="/admin/users/new">
          <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
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
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative filter-dropdown">
              <Button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
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
                      Activos
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('inactive')
                        setShowStatusDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Inactivos
                    </button>
                  </div>
                </div>
              )}
            </div>

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

      {/* Users List */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <CardTitle className="text-blue-900">Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No se encontraron usuarios</p>
              <p className="text-slate-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View - Two Rows Layout */}
              <div className="hidden md:block">
                <div className="space-y-4">
                  {filteredUsers.slice(0, 15).map((user, index) => (
                    <div key={user.id} className={`bg-white border border-slate-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      {/* First Row - Main Info */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg min-w-[3rem] min-h-[3rem]">
                            {getInitials(user.name, user.surname)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">
                              {user.name} {user.surname}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium">
                              {user.client_code}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                            user.is_active 
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                              : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                          }`}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${user.is_active ? 'bg-green-300' : 'bg-red-300'}`}></div>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Second Row - Contact Info */}
                      <div className="space-y-3 mb-4">
                        {/* Contact Info - Email and Phone */}
                        <div className="flex items-center space-x-6">
                          {user.email && user.email.trim() !== '' && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="text-slate-700 font-medium">{user.email}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-slate-700 font-medium">{user.phone?.replace('+34', '') || 'Sin teléfono'}</span>
                          </div>
                        </div>
                        
                        {/* Location Info - City and Address */}
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-slate-700 font-medium">{user.city || 'Sin ciudad'}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                            </svg>
                            <span className="text-slate-700 font-medium max-w-xs truncate" title={user.address}>
                              {user.address || 'Sin dirección'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Third Row - Actions */}
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/users/${user.id}`}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </Link>
                        <Link href={`/admin/users/${user.id}/edit`}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </Link>
                        <button
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                            user.is_active
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                          }`}>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={user.is_active ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                          </svg>
                          {user.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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
                  {filteredUsers.slice(0, 15).map((user) => (
                    <div key={user.id} className="bg-white border-0 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                      {/* Header con avatar y nombre */}
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg min-w-[3rem] min-h-[3rem]">
                          {getInitials(user.name, user.surname)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">
                            {user.name} {user.surname}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {user.client_code}
                          </p>
                        </div>
                      </div>
                      
                      {/* Badge de estado debajo del nombre */}
                      <div className="flex gap-2 mb-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                          user.is_active 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                            : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${user.is_active ? 'bg-green-300' : 'bg-red-300'}`}></div>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      
                      {/* Información de contacto */}
                      <div className="space-y-3 mb-6">
                        {user.email && user.email.trim() !== '' && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-slate-700 font-medium">{user.email}</p>
                          </div>
                        )}
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <p className="text-slate-700 font-medium">{user.phone?.replace('+34', '') || 'Sin teléfono'}</p>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-slate-700 font-medium">{user.city || 'Sin ciudad'}</p>
                        </div>
                        <div className="flex items-start">
                          <svg className="w-4 h-4 text-slate-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                          </svg>
                          <p className="text-slate-700 font-medium text-sm leading-relaxed">{user.address || 'Sin dirección'}</p>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="grid grid-cols-2 gap-3">
                        <Link href={`/admin/users/${user.id}`}
                          className="inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </Link>
                        <Link href={`/admin/users/${user.id}/edit`}
                          className="inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </Link>
                        <button
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          className={`inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                            user.is_active
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                          }`}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={user.is_active ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                          </svg>
                          {user.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards - Modern Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-12">
        <Card 
          className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('all')
            setShowStatusDropdown(false)
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-100 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold text-white mt-1">{totalUsers}</p>
                <p className="text-blue-200 text-xs mt-1">Usuarios</p>
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
            setShowStatusDropdown(false)
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-100 uppercase tracking-wide">Activos</p>
                <p className="text-2xl font-bold text-white mt-1">{activeUsers}</p>
                <p className="text-green-200 text-xs mt-1">Con servicio</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-red-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('inactive')
            setShowStatusDropdown(false)
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-100 uppercase tracking-wide">Inactivos</p>
                <p className="text-2xl font-bold text-white mt-1">{inactiveUsers}</p>
                <p className="text-orange-200 text-xs mt-1">Sin servicio</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <UserX className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-indigo-600 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('all')
            setShowStatusDropdown(false)
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-100 uppercase tracking-wide">Con Email</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {users.filter(u => u.email && u.email.trim() !== '').length}
                </p>
                <p className="text-purple-200 text-xs mt-1">Contacto digital</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
            setShowStatusDropdown(false)
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-teal-100 uppercase tracking-wide">Con Dirección</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {users.filter(u => u.address && u.address.trim() !== '').length}
                </p>
                <p className="text-teal-200 text-xs mt-1">Datos completos</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

 