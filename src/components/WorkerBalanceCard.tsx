import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Clock, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { WorkerBalance } from '@/lib/calculateWorkerBalance';

interface WorkerBalanceCardProps {
  balance: WorkerBalance;
  className?: string;
}

export default function WorkerBalanceCard({ balance, className = '' }: WorkerBalanceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excess':
        return 'text-red-600';
      case 'deficit':
        return 'text-blue-600';
      case 'perfect':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excess':
        return <TrendingUp className="w-4 h-4" />;
      case 'deficit':
        return <TrendingDown className="w-4 h-4" />;
      case 'perfect':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excess':
        return 'Exceso de horas';
      case 'deficit':
        return 'Horas pendientes';
      case 'perfect':
        return 'Balance perfecto';
      default:
        return 'Sin datos';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Balance de Horas - {balance.workerName}
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${getStatusColor(balance.status)}`}>
            {getStatusIcon(balance.status)}
            {getStatusText(balance.status)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen de horas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{balance.totalAssignedHours}h</div>
            <div className="text-sm text-gray-600">Asignadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{balance.totalUsedHours}h</div>
            <div className="text-sm text-gray-600">Utilizadas</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${balance.totalRemainingHours >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {balance.totalRemainingHours >= 0 ? '+' : ''}{balance.totalRemainingHours}h
            </div>
            <div className="text-sm text-gray-600">Restantes</div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progreso del mes</span>
            <span className="font-medium">{balance.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(balance.percentage)}`}
              style={{ width: `${Math.min(balance.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Información adicional */}
        <div className="text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Mes:</span>
            <span className="font-medium">{balance.month}/{balance.year}</span>
          </div>
          <div className="flex justify-between">
            <span>Asignaciones activas:</span>
            <span className="font-medium">{balance.assignments.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 