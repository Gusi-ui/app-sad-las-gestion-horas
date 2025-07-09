'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'

interface Worker {
  id: string
  full_name: string
  email: string
  phone: string
  worker_type: 'regular' | 'holidays' | 'weekends' | 'flexible'
  is_active: boolean
  created_at: string
  hourly_rate: number
  availability_status: 'available' | 'busy' | 'unavailable'
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'regular' | 'holidays' | 'weekends' | 'flexible'>('all')

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      const mockWorkers: Worker[] = [
        {
          id: '1',
          full_name: 'María García López',
          email: 'maria.garcia@email.com',
          phone: '612345678',
          worker_type: 'regular',
          is_active: true,
          created_at: '2024-01-15',
          hourly_rate: 12.50,
          availability_status: 'available'
        },
        {
          id: '2',
          full_name: 'Ana Martínez Ruiz',
          email: 'ana.martinez@email.com',
          phone: '623456789',
          worker_type: 'holidays',
          is_active: true,
          created_at: '2024-01-20',
          hourly_rate: 15.00,
          availability_status: 'busy'
        },
        {
          id: '3',
          full_name: 'Carmen Rodríguez Sánchez',
          email: 'carmen.rodriguez@email.com',
          phone: '634567890',
          worker_type: 'weekends',
          is_active: false,
          created_at: '2024-02-01',
          hourly_rate: 14.00,
          availability_status: 'unavailable'
        },
        {
          id: '4',
          full_name: 'Isabel Fernández Moreno',
          email: 'isabel.fernandez@email.com',
          phone: '645678901',
          worker_type: 'flexible',
          is_active: true,
          created_at: '2024-02-10',
          hourly_rate: 13.50,
          availability_status: 'available'
        },
        {
          id: '5',
          full_name: 'Rosa Jiménez Torres',
          email: 'rosa.jimenez@email.com',
          phone: '656789012',
          worker_type: 'regular',
          is_active: true,
          created_at: '2024-02-15',
          hourly_rate: 12.00,
          availability_status: 'available'
        }
      ]
      setWorkers(mockWorkers)
      setFilteredWorkers(mockWorkers)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    filterWorkers()
  }, [workers, searchTerm, statusFilter, typeFilter])

  const filterWorkers = () => {
    let filtered = workers

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(worker =>
        worker.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.phone.includes(searchTerm)
      )
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(worker => 
        statusFilter === 'active' ? worker.is_active : !worker.is_active
      )
    }

    // Filtrar por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(worker => worker.worker_type === typeFilter)
    }

    setFilteredWorkers(filtered)
  }

  const getWorkerTypeLabel = (type: string) => {
    const labels = {
      regular: 'Regular',
      holidays: 'Fiestas',
      weekends: 'Fines de semana',
      flexible: 'Flexible'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getAvailabilityColor = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      busy: 'bg-yellow-100 text-yellow-800',
      unavailable: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getAvailabilityLabel = (status: string) => {
    const labels = {
      available: 'Disponible',
      busy: 'Ocupada',
      unavailable: 'No disponible'
    }
    return labels[status as keyof typeof labels] || status
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Gestión de Trabajadoras
          </h1>
          <p className="text-slate-600">
            Administra el personal y sus perfiles
          </p>
        </div>
        <Link href="/admin/workers/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Trabajadora
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar trabajadora..."
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
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="regular">Regular</option>
              <option value="holidays">Fiestas</option>
              <option value="weekends">Fines de semana</option>
              <option value="flexible">Flexible</option>
            </select>

            {/* Clear Filters */}
            <Button
              variant="default"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setTypeFilter('all')
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
              <UserCheck className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900">{workers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Activas</p>
                <p className="text-2xl font-bold text-slate-900">
                  {workers.filter(w => w.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-yellow-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Disponibles</p>
                <p className="text-2xl font-bold text-slate-900">
                  {workers.filter(w => w.availability_status === 'available').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-purple-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Promedio Tarifa</p>
                <p className="text-2xl font-bold text-slate-900">
                  {workers.length > 0 
                    ? (workers.reduce((sum, w) => sum + w.hourly_rate, 0) / workers.length).toFixed(1)
                    : '0'
                  }€/h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workers List */}
      <Card>
        <CardHeader>
          <CardTitle>Trabajadoras ({filteredWorkers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredWorkers.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No se encontraron trabajadoras</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Contacto</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Disponibilidad</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Tarifa</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{worker.full_name}</p>
                          <p className="text-sm text-slate-500">ID: {worker.id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-slate-900">{worker.email}</p>
                          <p className="text-sm text-slate-500">{worker.phone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary">
                          {getWorkerTypeLabel(worker.worker_type)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={worker.is_active ? "default" : "secondary"}>
                          {worker.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getAvailabilityColor(worker.availability_status)}>
                          {getAvailabilityLabel(worker.availability_status)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-900">
                          {worker.hourly_rate}€/h
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Link href={`/admin/workers/${worker.id}`}>
                            <Button size="sm" variant="default">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/workers/${worker.id}/edit`}>
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