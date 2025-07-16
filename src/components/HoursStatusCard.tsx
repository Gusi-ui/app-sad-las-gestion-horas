import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, CheckCircle, AlertTriangle } from "lucide-react";
import { calculateUserHoursStatus } from "@/lib/utils";

interface HoursStatusCardProps {
  monthlyHours: number;
  usedHours: number;
  userName: string;
  userSurname: string;
  userAddress?: string;
  userPhone?: string;
  totalWorkers: number;
  className?: string;
}

export function HoursStatusCard({
  monthlyHours,
  usedHours,
  userName,
  userSurname,
  userAddress,
  userPhone,
  totalWorkers,
  className = ""
}: HoursStatusCardProps) {
  const calculation = calculateUserHoursStatus(monthlyHours, usedHours);
  
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
        <div className="flex items-start justify-between mb-3">
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

        {/* Barra de progreso */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Progreso del mes</span>
            <span className="font-medium">
              {calculation.usedHours.toFixed(1)}h / {calculation.monthlyHours}h
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
            <span>Utilizadas: {calculation.usedHours.toFixed(1)}h</span>
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
        <div className="grid grid-cols-2 gap-3 text-xs">
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
          <div className={`mt-3 p-2 rounded text-xs ${
            calculation.status === 'excess' 
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {calculation.status === 'excess' && (
              <span>⚠️ Se han excedido las horas asignadas para este mes.</span>
            )}
            {calculation.status === 'deficit' && (
              <span>ℹ️ Aún quedan horas disponibles para asignar este mes.</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 