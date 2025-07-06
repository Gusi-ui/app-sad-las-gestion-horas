import { Card, CardContent } from "@/components/ui/card";
import { Clock, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Calendar, RefreshCw } from "lucide-react";
import { calculateUserHoursStatus } from "@/lib/utils";
import { Assignment, User } from "@/lib/types";

interface AssignmentWithUser extends Assignment {
  users?: User;
}

interface DetailedHoursStatusCardProps {
  monthlyHours: number;
  usedHours: number;
  userName: string;
  userSurname: string;
  userAddress?: string;
  userPhone?: string;
  totalWorkers: number;
  assignments: AssignmentWithUser[];
  className?: string;
  reassignmentInfo?: {
    hasReassignments: boolean;
    reassignmentCount: number;
    reassignmentDates?: string[];
  };
}

export function DetailedHoursStatusCard({
  monthlyHours,
  usedHours,
  userName,
  userSurname,
  userAddress,
  userPhone,
  totalWorkers,
  assignments,
  className = "",
  reassignmentInfo
}: DetailedHoursStatusCardProps) {
  const calculation = calculateUserHoursStatus(monthlyHours, usedHours);
  
  // Calcular información del mes actual
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  // Calcular horas que se van a consumir en el mes completo
  const totalHoursToBeConsumed = usedHours; // Esto ya viene calculado del hook
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'perfect':
        return 'text-green-600';
      case 'excess':
        return 'text-red-600';
      case 'deficit':
        return 'text-blue-600';
      default:
        return 'text-slate-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'perfect':
        return 'bg-green-100 text-green-800';
      case 'excess':
        return 'bg-red-100 text-red-800';
      case 'deficit':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'perfect':
        return <CheckCircle className="w-4 h-4" />;
      case 'excess':
        return <TrendingUp className="w-4 h-4" />;
      case 'deficit':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'perfect':
        return 'bg-green-500';
      case 'excess':
        return 'bg-red-500';
      case 'deficit':
        return 'bg-blue-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <Card className={`border border-slate-200 shadow-sm ${className}`}>
      <CardContent className="p-4">
        {/* Header con información del usuario */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 text-lg">
              {userName} {userSurname}
            </h4>
            {userAddress && (
              <div className="flex items-center text-sm text-slate-600 mt-1">
                <span className="mr-1">📍</span>
                {userAddress}
              </div>
            )}
            {userPhone && (
              <div className="flex items-center text-sm text-slate-600 mt-1">
                <span className="mr-1">📞</span>
                {userPhone}
              </div>
            )}
            <div className="flex items-center text-sm text-slate-600 mt-1">
              <span className="mr-1">👥</span>
              {totalWorkers} trabajadora{totalWorkers !== 1 ? 's' : ''} asignada{totalWorkers !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBgColor(calculation.status)}`}>
              {getStatusIcon(calculation.status)}
              <span className="ml-1">
                {calculation.status === 'perfect' && 'Perfecto'}
                {calculation.status === 'excess' && `+${Math.abs(calculation.remainingHours).toFixed(1)}h`}
                {calculation.status === 'deficit' && `-${Math.abs(calculation.remainingHours).toFixed(1)}h`}
              </span>
            </div>
          </div>
        </div>

        {/* Información de reasignaciones automáticas */}
        {reassignmentInfo && reassignmentInfo.hasReassignments && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center mb-2">
              <RefreshCw className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                Reasignaciones Automáticas de Festivos
              </span>
            </div>
            <div className="text-xs text-blue-700">
              <div className="mb-1">
                <span className="font-medium">Servicios reasignados:</span> {reassignmentInfo.reassignmentCount}
              </div>
              {reassignmentInfo.reassignmentDates && reassignmentInfo.reassignmentDates.length > 0 && (
                <div>
                  <span className="font-medium">Fechas:</span> {reassignmentInfo.reassignmentDates.join(', ')}
                </div>
              )}
              <div className="mt-1 text-blue-600">
                Los servicios en días festivos se reasignan automáticamente a trabajadoras de festivos y fines de semana.
              </div>
            </div>
          </div>
        )}

        {/* Balance del mes */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">Balance del mes (Julio 2024)</span>
            <span className="text-xs text-slate-500">Día {currentDay} de {daysInMonth}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-600">Horas asignadas al mes:</div>
              <div className="font-semibold text-slate-900">{monthlyHours}h</div>
            </div>
            <div>
              <div className="text-slate-600">Horas que se van a consumir:</div>
              <div className="font-semibold text-slate-900">{totalHoursToBeConsumed.toFixed(1)}h</div>
            </div>
          </div>
        </div>

        {/* Barra de progreso del mes */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Progreso del mes</span>
            <span className="font-medium">
              {usedHours.toFixed(1)}h / {monthlyHours}h
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${getProgressBarColor(calculation.status)}`}
              style={{ 
                width: `${Math.min(calculation.percentage, 100)}%` 
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Consumidas: {usedHours.toFixed(1)}h</span>
            <span className={getStatusColor(calculation.status)}>
              {calculation.status === 'perfect' 
                ? '✅ Perfecto'
                : calculation.status === 'excess'
                ? `+${Math.abs(calculation.remainingHours).toFixed(1)}h`
                : `-${Math.abs(calculation.remainingHours).toFixed(1)}h`
              }
            </span>
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div className="bg-slate-50 p-2 rounded">
            <div className="font-medium text-slate-700">Horas semanales</div>
            <div className="text-slate-600">{calculation.weeklyHours.toFixed(1)}h</div>
          </div>
          <div className="bg-slate-50 p-2 rounded">
            <div className="font-medium text-slate-700">Porcentaje</div>
            <div className="text-slate-600">{calculation.percentage.toFixed(1)}%</div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {calculation.status !== 'perfect' && (
          <div className={`p-3 rounded text-sm ${
            calculation.status === 'excess' 
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className="flex items-start">
              {calculation.status === 'excess' ? (
                <TrendingUp className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <div className="font-medium mb-1">
                  {calculation.status === 'excess' 
                    ? 'Horas disponibles'
                    : 'Horas adicionales necesarias'
                  }
                </div>
                <div className="text-xs opacity-90">
                  {calculation.status === 'excess' 
                    ? `Este usuario tendrá ${Math.abs(calculation.remainingHours).toFixed(1)}h de más. Tendrás ${Math.abs(calculation.remainingHours).toFixed(1)}h libres.`
                    : `Este usuario tendrá ${Math.abs(calculation.remainingHours).toFixed(1)}h de menos. Tendrás que realizar ${Math.abs(calculation.remainingHours).toFixed(1)}h adicionales.`
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 