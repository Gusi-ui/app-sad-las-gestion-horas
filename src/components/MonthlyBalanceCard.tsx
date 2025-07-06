import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, User, MapPin, Calendar, RefreshCw } from "lucide-react";

interface MonthlyBalance {
  id: string;
  worker_id: string;
  user_id: string;
  month: number;
  year: number;
  assigned_hours: number;
  scheduled_hours: number;
  balance: number;
  status: 'on_track' | 'over_scheduled' | 'under_scheduled' | 'completed';
  message: string;
  planning: any;
  created_at: string;
  updated_at: string;
  users?: {
    name: string;
    surname: string;
    address?: string;
  };
  // Información de festivos (opcional, para balances nuevos)
  holidayInfo?: {
    totalHolidays: number;
    holidayHours: number;
    workingDays: number;
    workingHours: number;
  };
  // Información de reasignaciones (nueva)
  reassignmentInfo?: {
    hasReassignments: boolean;
    reassignmentCount: number;
    reassignmentDates?: string[];
  };
}

interface MonthlyBalanceCardProps {
  balance: MonthlyBalance;
  className?: string;
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function MonthlyBalanceCard({ balance, className = "" }: MonthlyBalanceCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'on_track':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: <TrendingUp className="w-4 h-4" />,
          label: 'En camino',
          description: 'Horas programadas dentro del límite asignado'
        };
      case 'over_scheduled':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: <AlertTriangle className="w-4 h-4" />,
          label: 'Exceso de horas',
          description: 'Se han programado más horas de las asignadas'
        };
      case 'under_scheduled':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: <TrendingDown className="w-4 h-4" />,
          label: 'Horas disponibles',
          description: 'Aún quedan horas por programar'
        };
      case 'completed':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Completado',
          description: 'Mes completado según lo programado'
        };
      default:
        return {
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          icon: <Clock className="w-4 h-4" />,
          label: 'Sin estado',
          description: 'Estado no definido'
        };
    }
  };

  const statusConfig = getStatusConfig(balance.status);
  const monthName = monthNames[balance.month - 1];

  return (
    <Card className={`${statusConfig.borderColor} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2 text-slate-600" />
            <span className="font-medium">
              {balance.users?.name} {balance.users?.surname}
            </span>
          </div>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.icon}
            <span className="ml-1">{statusConfig.label}</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Dirección del usuario */}
        {balance.users?.address && (
          <div className="flex items-center text-sm text-slate-600 mb-3">
            <MapPin className="w-3 h-3 mr-1" />
            {balance.users.address}
          </div>
        )}

        {/* Información del mes */}
        <div className="text-xs text-slate-500 mb-4">
          {monthName} {balance.year}
        </div>

        {/* Información de reasignaciones automáticas */}
        {balance.reassignmentInfo && balance.reassignmentInfo.hasReassignments && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center mb-2">
              <RefreshCw className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                Reasignaciones Automáticas
              </span>
            </div>
            <div className="text-xs text-blue-700">
              <div className="mb-1">
                <span className="font-medium">Servicios reasignados:</span> {balance.reassignmentInfo.reassignmentCount}
              </div>
              {balance.reassignmentInfo.reassignmentDates && balance.reassignmentInfo.reassignmentDates.length > 0 && (
                <div>
                  <span className="font-medium">Fechas:</span> {balance.reassignmentInfo.reassignmentDates.join(', ')}
                </div>
              )}
              <div className="mt-1 text-blue-600">
                Los servicios en días festivos se reasignan automáticamente.
              </div>
            </div>
          </div>
        )}

        {/* Métricas de horas */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {balance.assigned_hours.toFixed(1)}
            </div>
            <div className="text-xs text-slate-600">Asignadas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {balance.scheduled_hours.toFixed(1)}
            </div>
            <div className="text-xs text-slate-600">Programadas</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${
              balance.balance >= 0 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {balance.balance >= 0 ? '+' : ''}{balance.balance.toFixed(1)}
            </div>
            <div className="text-xs text-slate-600">Balance</div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Progreso</span>
            <span>{((balance.scheduled_hours / balance.assigned_hours) * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                balance.status === 'over_scheduled' ? 'bg-orange-500' :
                balance.status === 'completed' ? 'bg-green-500' :
                'bg-blue-500'
              }`}
              style={{ 
                width: `${Math.min((balance.scheduled_hours / balance.assigned_hours) * 100, 100)}%` 
              }}
            />
          </div>
        </div>

        {/* Información de festivos */}
        {balance.holidayInfo && balance.holidayInfo.totalHolidays > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-yellow-800">
                Información de Festivos
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-yellow-700">Días festivos:</span>
                <span className="ml-1 font-medium text-yellow-900">
                  {balance.holidayInfo.totalHolidays} días ({balance.holidayInfo.holidayHours.toFixed(1)}h)
                </span>
              </div>
              <div>
                <span className="text-yellow-700">Días laborables:</span>
                <span className="ml-1 font-medium text-yellow-900">
                  {balance.holidayInfo.workingDays} días ({balance.holidayInfo.workingHours.toFixed(1)}h)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje del balance */}
        <div className={`p-3 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
          <p className="text-sm font-medium text-slate-800 mb-1">
            {statusConfig.description}
          </p>
          <p className="text-xs text-slate-600">
            {balance.message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 