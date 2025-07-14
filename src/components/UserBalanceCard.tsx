import { UserBalance } from '@/lib/calculateWorkerBalance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle, Clock, Calendar } from 'lucide-react';

interface UserBalanceCardProps {
  userBalance: UserBalance;
  className?: string;
}

export function UserBalanceCard({ userBalance, className = '' }: UserBalanceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excess':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'deficit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'perfect':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excess':
        return 'Exceso';
      case 'deficit':
        return 'Faltan horas';
      case 'perfect':
        return 'Perfecto';
      default:
        return 'Sin estado';
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

  // Calcular el exceso o déficit de horas
  const excessHours = Math.max(0, userBalance.assignedHours - userBalance.monthlyHours);
  const deficitHours = Math.max(0, userBalance.monthlyHours - userBalance.assignedHours);

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {userBalance.userName} {userBalance.userSurname}
          </CardTitle>
          <Badge className={getStatusColor(userBalance.status)}>
            {getStatusIcon(userBalance.status)} {getStatusText(userBalance.status)}
          </Badge>
        </div>
        {userBalance.userAddress && (
          <p className="text-sm text-gray-600">
            📍 {userBalance.userAddress}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mensaje de exceso/deficit destacado */}
        {userBalance.status === 'excess' && (
          <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="text-lg font-bold text-red-900">
                ¡EXCESO DE HORAS DETECTADO!
              </h4>
            </div>
            <p className="text-red-800 font-medium">
              Este mes, el usuario <strong>{userBalance.userName} {userBalance.userSurname}</strong> tiene un exceso de{' '}
              <span className="text-xl font-bold text-red-900">{excessHours.toFixed(1)} horas</span>.
            </p>
            <p className="text-sm text-red-700 mt-2">
              Se han asignado {userBalance.assignedHours}h cuando el usuario solo tiene {userBalance.monthlyHours}h contratadas.
            </p>
          </div>
        )}

        {userBalance.status === 'deficit' && (
          <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-yellow-600" />
              <h4 className="text-lg font-bold text-yellow-900">
                HORAS PENDIENTES
              </h4>
            </div>
            <p className="text-yellow-800 font-medium">
              Este mes, el usuario <strong>{userBalance.userName} {userBalance.userSurname}</strong> tiene{' '}
              <span className="text-xl font-bold text-yellow-900">{deficitHours.toFixed(1)} horas pendientes</span>.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Se han asignado {userBalance.assignedHours}h de las {userBalance.monthlyHours}h contratadas.
            </p>
          </div>
        )}

        {userBalance.status === 'perfect' && (
          <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="text-lg font-bold text-green-900">
                BALANCE PERFECTO
              </h4>
            </div>
            <p className="text-green-800 font-medium">
              Este mes, el usuario <strong>{userBalance.userName} {userBalance.userSurname}</strong> tiene un balance perfecto.
            </p>
            <p className="text-sm text-green-700 mt-2">
              Las horas asignadas ({userBalance.assignedHours}h) coinciden exactamente con las contratadas ({userBalance.monthlyHours}h).
            </p>
          </div>
        )}

        {/* Horas asignadas al usuario */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-800">
              Horas asignadas al usuario
            </span>
            <span className="text-lg font-bold text-blue-900">
              {userBalance.monthlyHours}h
            </span>
          </div>
        </div>

        {/* Horas de esta trabajadora */}
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-800">
              Mis horas con este usuario
            </span>
            <span className="text-lg font-bold text-green-900">
              {userBalance.assignedHours}h asignadas / {userBalance.usedHours}h realizadas
            </span>
          </div>
        </div>

        {/* Desglose de horas laborables y festivas */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Desglose de horas por tipo de día
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-blue-700">Días laborables</span>
                <span className="text-sm font-bold text-blue-900">{userBalance.holidayInfo.workingDays}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Horas laborables</span>
                <span className="text-sm font-bold text-blue-900">{userBalance.holidayInfo.workingHours}h</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-purple-700">Días festivos</span>
                <span className="text-sm font-bold text-purple-900">{userBalance.holidayInfo.totalHolidays}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Horas festivas</span>
                <span className="text-sm font-bold text-purple-900">{userBalance.holidayInfo.holidayHours}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progreso de horas */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Horas totales realizadas (todas las trabajadoras)</span>
            <span className="font-medium">{userBalance.percentage.toFixed(1)}% del total</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                userBalance.status === 'excess' ? 'bg-red-500' :
                userBalance.status === 'deficit' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(userBalance.percentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progreso general del usuario</span>
            <span>
              {userBalance.remainingHours > 0 
                ? `Faltan ${userBalance.remainingHours}h en total` 
                : userBalance.remainingHours < 0 
                ? `Exceso de ${Math.abs(userBalance.remainingHours)}h en total`
                : 'Completado'
              }
            </span>
          </div>
        </div>

        {/* Información de festivos */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            📅 Información del mes
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Días laborables:</span>
              <span className="font-medium ml-1">{userBalance.holidayInfo.workingDays}</span>
            </div>
            <div>
              <span className="text-gray-600">Horas laborables:</span>
              <span className="font-medium ml-1">{userBalance.holidayInfo.workingHours}h</span>
            </div>
            <div>
              <span className="text-gray-600">Días festivos:</span>
              <span className="font-medium ml-1">{userBalance.holidayInfo.totalHolidays}</span>
            </div>
            <div>
              <span className="text-gray-600">Horas festivas:</span>
              <span className="font-medium ml-1">{userBalance.holidayInfo.holidayHours}h</span>
            </div>
          </div>
        </div>

        {/* Mensaje de estado */}
        <div className={`p-3 rounded-lg text-sm ${
          userBalance.status === 'excess' ? 'bg-red-50 text-red-700' :
          userBalance.status === 'deficit' ? 'bg-yellow-50 text-yellow-700' :
          'bg-green-50 text-green-700'
        }`}>
          {userBalance.status === 'excess' && (
            <p>
              <strong>Exceso de horas:</strong> Entre todas las trabajadoras se han superado las {userBalance.monthlyHours}h 
              asignadas al usuario. No tendrás que realizar las horas extra.
            </p>
          )}
          {userBalance.status === 'deficit' && (
            <p>
              <strong>Horas pendientes:</strong> Entre todas las trabajadoras faltan {userBalance.remainingHours}h 
              para completar las {userBalance.monthlyHours}h asignadas al usuario.
            </p>
          )}
          {userBalance.status === 'perfect' && (
            <p>
              <strong>Balance perfecto:</strong> Las horas realizadas por todas las trabajadoras coinciden 
              exactamente con las asignadas al usuario.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 