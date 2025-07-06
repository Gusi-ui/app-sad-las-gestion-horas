import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";

interface AdminBalanceGeneratorProps {
  workerId: string;
  userId: string;
  month: number;
  year: number;
  planning: any;
  assignedHours: number;
  onSuccess?: () => void;
}

export function AdminBalanceGenerator({
  workerId,
  userId,
  month,
  year,
  planning,
  assignedHours,
  onSuccess
}: AdminBalanceGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    balance?: any;
  } | null>(null);

  const generateBalance = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/admin/generate-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: workerId,
          user_id: userId,
          month,
          year,
          planning,
          assigned_hours: assignedHours
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar el balance');
      }

      setResult({
        success: true,
        message: 'Balance generado exitosamente',
        balance: data.balance
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error generating balance:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <Card className="border border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center text-sm">
          <Clock className="w-4 h-4 mr-2" />
          Generar Balance Mensual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del balance */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-slate-700">Mes:</span>
            <span className="ml-2 text-slate-600">{monthNames[month - 1]} {year}</span>
          </div>
          <div>
            <span className="font-medium text-slate-700">Horas Asignadas:</span>
            <span className="ml-2 text-slate-600">{assignedHours}h</span>
          </div>
        </div>

        {/* Botón de generación */}
        <Button
          onClick={generateBalance}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando balance...
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Generar Balance
            </>
          )}
        </Button>

        {/* Resultado */}
        {result && (
          <div className={`p-3 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              {result.success ? (
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              )}
              <span className={`text-sm font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </span>
            </div>
            
            {result.success && result.balance && (
              <div className="mt-2 text-xs text-green-700">
                <div>Horas programadas: {result.balance.scheduled_hours}h</div>
                <div>Balance: {result.balance.balance >= 0 ? '+' : ''}{result.balance.balance}h</div>
                <div>Estado: {result.balance.status}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 