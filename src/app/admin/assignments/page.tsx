'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Clock,
  UserCheck,
  Users
} from 'lucide-react'
import Link from 'next/link'

interface Assignment {
  id: string
  worker_id: string
  user_id: string
  status: 'active' | 'inactive' | 'suspended' | 'completed'
  start_date: string
  end_date: string | null
  hours_per_week: number
  hourly_rate: number
  created_at: string
  worker: {
    full_name: string
    email: string
  }
  user: {
    full_name: string
    client_code: string
    email: string
  }
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'completed'>('all')

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      const mockAssignments: Assignment[] = [
        {
          id: '1',
          worker_id: '1',
          user_id: '1',
          status: 'active',
          start_date: '2024-01-15',
          end_date: null,
          hours_per_week: 20,
          hourly_rate: 12.50,
          created_at: '2024-01-10',
          worker: {
            full_name: 'María García López',
            email: 'maria.garcia@email.com'
          },
          user: {
            full_name: 'Juan Pérez García',
            client_code: 'CLI001',
            email: 'juan.perez@email.com'
          }
        },
        {
          id: '2',
          worker_id: '2',
          user_id: '2',
          status: 'active',
          start_date: '2024-01-20',
          end_date: null,
          hours_per_week: 15,
          hourly_rate: 15.00,
          created_at: '2024-01-15',
          worker: {
            full_name: 'Ana Martínez Ruiz',
            email: 'ana.martinez@email.com'
          },
          user: {
            full_name: 'Carmen López Martín',
            client_code: 'CLI002',
            email: 'carmen.lopez@email.com'
          }
        },
        {
          id: '3',
          worker_id: '4',
          user_id: '4',
          status: 'active',
          start_date: '2024-02-01',
          end_date: null,
          hours_per_week: 25,
          hourly_rate: 13.50,
          created_at: '2024-02-01',
          worker: {
            full_name: 'Isabel Fernández Moreno',
            email: 'isabel.fernandez@email.com'
          },
          user: {
            full_name: 'Isabel Fernández Moreno',
            client_code: 'CLI004',
            email: 'isabel.fernandez@email.com'
          }
        },
        {
          id: '4',
          worker_id: '5',
          user_id: '5',
          status: 'suspended',
          start_date: '2024-02-10',
          end_date: null,
          hours_per_week: 18,
          hourly_rate: 12.00,
          created_at: '2024-02-10',
          worker: {
            full_name: 'Rosa Jiménez Torres',
            email: 'rosa.jimenez@email.com'
          },
          user: {
            full_name: 'Manuel Jiménez Torres',
            client_code: 'CLI005',
            email: 'manuel.jimenez@email.com'
          }
        },
        {
          id: '5',
          worker_id: '1',
          user_id: '6',
          status: 'active',
          start_date: '2024-02-15',
          end_date: null,
          hours_per_week: 12,
          hourly_rate: 12.50,
          created_at: '2024-02-15',
          worker: {
            full_name: 'María García López',
            email: 'maria.garcia@email.com'
          },
          user: {
            full_name: 'Dolores Sánchez Ruiz',
            client_code: 'CLI006',
            email: 'dolores.sanchez@email.com'
          }
        },
        {
          id: '6',
          worker_id: '3',
          user_id: '3',
          status: 'completed',
          start_date: '2024-01-20',
          end_date: '2024-02-20',
          hours_per_week: 16,
          hourly_rate: 14.00,
          created_at: '2024-01-20',
          worker: {
            full_name: 'Carmen Rodríguez Sánchez',
            email: 'carmen.rodriguez@email.com'
          },
          user: {
            full_name: 'Antonio Rodríguez Silva',
            client_code: 'CLI003',
            email: 'antonio.rodriguez@email.com'
          }
        }
      ]
      setAssignments(mockAssignments)
      setFilteredAssignments(mockAssignments)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    filterAssignments()
  }, [assignments, searchTerm, statusFilter])

  const filterAssignments = () => {
    let filtered = assignments

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.worker?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.user?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.user?.client_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.worker?.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter)
    }

    setFilteredAssignments(filtered)
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Activa',
      inactive: 'Inactiva',
      suspended: 'Suspendida',
      completed: 'Completada'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const calculateWeeklyCost = (hoursPerWeek: number, hourlyRate: number) => {
    return hoursPerWeek * hourlyRate
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando asignaciones...</p>
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
            Gestión de Asignaciones
          </h1>
          <p className="text-slate-600">
            Administra asignaciones trabajadora-usuario
          </p>
        </div>
        <Link href="/admin/assignments/new">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Asignación
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
                placeholder="Buscar asignación..."
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
              <option value="suspended">Suspendidas</option>
              <option value="completed">Completadas</option>
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
              <Calendar className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Activas</p>
                <p className="text-2xl font-bold text-slate-900">
                  {assignments.filter(a => a.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Horas Semanales</p>
                <p className="text-2xl font-bold text-slate-900">
                  {assignments
                    .filter(a => a.status === 'active')
                    .reduce((sum, a) => sum + a.hours_per_week, 0)
                  }h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-slate-600">Costo Semanal</p>
                <p className="text-2xl font-bold text-slate-900">
                  {assignments
                    .filter(a => a.status === 'active')
                    .reduce((sum, a) => sum + calculateWeeklyCost(a.hours_per_week, a.hourly_rate), 0)
                    .toFixed(0)
                  }€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Asignaciones ({filteredAssignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No se encontraron asignaciones</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Trabajadora</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Horario</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Tarifa</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{assignment.worker?.full_name}</p>
                          <p className="text-sm text-slate-500">{assignment.worker?.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{assignment.user?.full_name}</p>
                          <p className="text-sm text-slate-500">Código: {assignment.user?.client_code}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-slate-900">{assignment.hours_per_week}h/semana</p>
                          <p className="text-sm text-slate-500">
                            Desde: {new Date(assignment.start_date).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-slate-900">{assignment.hourly_rate}€/h</p>
                          <p className="text-sm text-slate-500">
                            {calculateWeeklyCost(assignment.hours_per_week, assignment.hourly_rate)}€/semana
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusColor(assignment.status)}>
                          {getStatusLabel(assignment.status)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Link href={`/admin/assignments/${assignment.id}`}>
                            <Button size="sm" variant="default">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/assignments/${assignment.id}/edit`}>
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