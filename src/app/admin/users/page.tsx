'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Phone,
  Mail
} from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  client_code: string
  full_name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  is_active: boolean
  created_at: string
  medical_conditions: string | null
  emergency_contact: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      const mockUsers: User[] = [
        {
          id: '1',
          client_code: 'CLI001',
          full_name: 'Juan Pérez García',
          email: 'juan.perez@email.com',
          phone: '612345678',
          address: 'Calle Mayor 123',
          city: 'Madrid',
          postal_code: '28001',
          is_active: true,
          created_at: '2024-01-10',
          medical_conditions: 'Diabetes tipo 2',
          emergency_contact: 'María Pérez - 623456789'
        },
        {
          id: '2',
          client_code: 'CLI002',
          full_name: 'Carmen López Martín',
          email: 'carmen.lopez@email.com',
          phone: '623456789',
          address: 'Avenida de la Paz 45',
          city: 'Barcelona',
          postal_code: '08001',
          is_active: true,
          created_at: '2024-01-15',
          medical_conditions: null,
          emergency_contact: 'Pedro López - 634567890'
        },
        {
          id: '3',
          client_code: 'CLI003',
          full_name: 'Antonio Rodríguez Silva',
          email: 'antonio.rodriguez@email.com',
          phone: '634567890',
          address: 'Plaza España 7',
          city: 'Valencia',
          postal_code: '46001',
          is_active: false,
          created_at: '2024-01-20',
          medical_conditions: 'Hipertensión, Artritis',
          emergency_contact: 'Ana Rodríguez - 645678901'
        },
        {
          id: '4',
          client_code: 'CLI004',
          full_name: 'Isabel Fernández Moreno',
          email: 'isabel.fernandez@email.com',
          phone: '645678901',
          address: 'Calle Real 89',
          city: 'Sevilla',
          postal_code: '41001',
          is_active: true,
          created_at: '2024-02-01',
          medical_conditions: 'Alzheimer leve',
          emergency_contact: 'Carlos Fernández - 656789012'
        },
        {
          id: '5',
          client_code: 'CLI005',
          full_name: 'Manuel Jiménez Torres',
          email: 'manuel.jimenez@email.com',
          phone: '656789012',
          address: 'Gran Vía 156',
          city: 'Bilbao',
          postal_code: '48001',
          is_active: true,
          created_at: '2024-02-10',
          medical_conditions: null,
          emergency_contact: 'Rosa Jiménez - 667890123'
        },
        {
          id: '6',
          client_code: 'CLI006',
          full_name: 'Dolores Sánchez Ruiz',
          email: 'dolores.sanchez@email.com',
          phone: '667890123',
          address: 'Calle Nueva 23',
          city: 'Málaga',
          postal_code: '29001',
          is_active: true,
          created_at: '2024-02-15',
          medical_conditions: 'Parkinson',
          emergency_contact: 'José Sánchez - 678901234'
        }
      ]
      setUsers(mockUsers)
      setFilteredUsers(mockUsers)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, statusFilter])

  const filterUsers = () => {
    let filtered = users

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm) ||
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Gestión de Usuarios
          </h1>
          <p className="text-slate-600">
            Administra clientes y sus servicios
          </p>
        </div>
        <Link href="/admin/users/new">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
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
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Activos</p>
                <p className="text-2xl font-bold text-slate-900">
                  {users.filter(u => u.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-yellow-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Con Condiciones</p>
                <p className="text-2xl font-bold text-slate-900">
                  {users.filter(u => u.medical_conditions).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Nuevos este mes</p>
                <p className="text-2xl font-bold text-slate-900">
                  {users.filter(u => {
                    const createdDate = new Date(u.created_at)
                    const now = new Date()
                    return createdDate.getMonth() === now.getMonth() && 
                           createdDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Código</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Contacto</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Ubicación</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <Badge variant="secondary" className="font-mono">
                          {user.client_code}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{user.full_name}</p>
                          <p className="text-sm text-slate-500">ID: {user.id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="w-4 h-4 text-slate-400 mr-2" />
                            <span className="text-slate-900">{user.email}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="w-4 h-4 text-slate-400 mr-2" />
                            <span className="text-slate-900">{user.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-slate-900">{user.city}</p>
                          <p className="text-sm text-slate-500">{user.postal_code}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button size="sm" variant="default">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/users/${user.id}/edit`}>
                            <Button size="sm" variant="default">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
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