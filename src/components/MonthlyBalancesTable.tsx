"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, ChevronDown, ChevronUp, Filter, Calendar, Users, UserCheck, UserX, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyBalance {
  id: string;
  user_id: string;
  month: number;
  year: number;
  total_hours: number;
  laborable_hours: number;
  holiday_hours: number;
  assigned_hours: number;
  difference: number;
  holiday_info: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  name: string;
  surname: string;
  is_active: boolean;
}

interface MonthlyBalancesTableProps {
  balances: MonthlyBalance[];
  users: User[];
  loading?: boolean;
  className?: string;
}

export function MonthlyBalancesTable({ balances, users, loading = false, className = '' }: MonthlyBalancesTableProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filtrar balances según el mes/año seleccionado
  const filteredBalances = balances.filter(balance => 
    balance.month === selectedMonth && balance.year === selectedYear
  );

  // Combinar balances con información de usuarios
  const balancesWithUserInfo = filteredBalances.map(balance => {
    const user = users.find(u => u.id === balance.user_id);
    return {
      ...balance,
      user_name: user?.name || 'Usuario desconocido',
      user_surname: user?.surname || '',
      user_is_active: user?.is_active ?? false
    };
  });

  // Filtrar balances según el filtro de usuarios activos
  const finalBalances = showOnlyActive 
    ? balancesWithUserInfo.filter(balance => balance.user_is_active)
    : balancesWithUserInfo;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (difference: number) => {
    if (difference >= 0) return 'text-green-600';
    return 'text-red-600';
  };

  const getStatusIcon = (difference: number) => {
    if (difference >= 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getStatusText = (difference: number) => {
    if (difference >= 0) return 'Disponible';
    return 'Excedido';
  };

  const totalAssignedHours = finalBalances.reduce((sum, balance) => sum + balance.assigned_hours, 0);
  const totalLaborableHours = finalBalances.reduce((sum, balance) => sum + balance.laborable_hours, 0);
  const totalHolidayHours = finalBalances.reduce((sum, balance) => sum + balance.holiday_hours, 0);
  const totalDifference = finalBalances.reduce((sum, balance) => sum + balance.difference, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Balance Mensual de Horas
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowOnlyActive(!showOnlyActive)}
              className="flex items-center"
            >
              <Filter className="w-4 h-4 mr-1" />
              {showOnlyActive ? 'Solo Activos' : 'Todos'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="flex items-center"
            >
              {isVisible ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Mostrar
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      {isVisible && (
        <CardContent>
          {/* Selector de mes/año */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Mes:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Enero</option>
                <option value={2}>Febrero</option>
                <option value={3}>Marzo</option>
                <option value={4}>Abril</option>
                <option value={5}>Mayo</option>
                <option value={6}>Junio</option>
                <option value={7}>Julio</option>
                <option value={8}>Agosto</option>
                <option value={9}>Septiembre</option>
                <option value={10}>Octubre</option>
                <option value={11}>Noviembre</option>
                <option value={12}>Diciembre</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700">Año:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Resumen general */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-700">Horas Asignadas</p>
                  <p className="text-xl font-bold text-blue-900">{totalAssignedHours.toFixed(1)}h</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-700">Horas Laborables</p>
                  <p className="text-xl font-bold text-green-900">{totalLaborableHours.toFixed(1)}h</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-orange-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-orange-700">Horas Festivos</p>
                  <p className="text-xl font-bold text-orange-900">{totalHolidayHours.toFixed(1)}h</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-purple-700">Diferencia</p>
                  <p className={`text-xl font-bold ${getStatusColor(totalDifference)}`}>
                    {totalDifference.toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Cargando balances...</p>
            </div>
          ) : finalBalances.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No hay balances disponibles</h3>
              <p className="text-slate-600">
                No se encontraron balances para {selectedMonth}/{selectedYear}
                {showOnlyActive ? ' para usuarios activos' : ''}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Usuario</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Asignadas</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Laborables</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Festivos</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Diferencia</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Última Actualización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalBalances.map((balance) => (
                      <tr key={balance.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            {balance.user_is_active ? (
                              <UserCheck className="w-4 h-4 text-green-600 mr-2" />
                            ) : (
                              <UserX className="w-4 h-4 text-red-600 mr-2" />
                            )}
                            <div>
                              <div className="font-medium text-slate-900">
                                {balance.user_name} {balance.user_surname}
                              </div>
                              <div className="text-sm text-slate-600">
                                {balance.user_is_active ? 'Activo' : 'Inactivo'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            {getStatusIcon(balance.difference)}
                            <span className={`ml-2 text-sm font-medium ${getStatusColor(balance.difference)}`}>
                              {getStatusText(balance.difference)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-slate-900">{balance.assigned_hours.toFixed(1)}h</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-slate-900">{balance.laborable_hours.toFixed(1)}h</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-slate-900">{balance.holiday_hours.toFixed(1)}h</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`font-medium ${getStatusColor(balance.difference)}`}>
                            {balance.difference.toFixed(1)}h
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {formatDate(balance.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {finalBalances.map((balance) => (
                  <div key={balance.id} className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        {balance.user_is_active ? (
                          <UserCheck className="w-4 h-4 text-green-600 mr-2" />
                        ) : (
                          <UserX className="w-4 h-4 text-red-600 mr-2" />
                        )}
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {balance.user_name} {balance.user_surname}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {balance.user_is_active ? 'Activo' : 'Inactivo'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getStatusIcon(balance.difference)}
                        <span className={`ml-1 text-xs font-medium ${getStatusColor(balance.difference)}`}>
                          {getStatusText(balance.difference)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Asignadas</p>
                        <p className="font-medium text-slate-900">{balance.assigned_hours.toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Laborables</p>
                        <p className="font-medium text-slate-900">{balance.laborable_hours.toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Festivos</p>
                        <p className="font-medium text-slate-900">{balance.holiday_hours.toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Diferencia</p>
                        <p className={`font-medium ${getStatusColor(balance.difference)}`}>
                          {balance.difference.toFixed(1)}h
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500">
                        Actualizado: {formatDate(balance.updated_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
} 