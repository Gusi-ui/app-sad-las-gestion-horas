import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import { ReassignedService } from "@/lib/holidayReassignment";

interface HolidayReassignmentCardProps {
  reassignments: ReassignedService[];
  className?: string;
}

export function HolidayReassignmentCard({ reassignments, className = "" }: HolidayReassignmentCardProps) {
  if (reassignments.length === 0) {
    return null;
  }

  const totalReassignedHours = reassignments.reduce((sum, r) => sum + Math.abs(r.reassignedHours - r.originalHours), 0);
  const laborableToHoliday = reassignments.filter(r => r.originalHours > r.reassignedHours).length;
  const holidayToLaborable = reassignments.filter(r => r.originalHours < r.reassignedHours).length;

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <Calendar className="w-5 h-5 mr-2" />
          Reasignaciones Automáticas de Festivos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{reassignments.length}</div>
            <div className="text-sm text-orange-700">Total Reasignaciones</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{laborableToHoliday}</div>
            <div className="text-sm text-orange-700">Laborable → Festivo</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{totalReassignedHours.toFixed(1)}h</div>
            <div className="text-sm text-orange-700">Horas Ajustadas</div>
          </div>
        </div>

        {/* Lista de reasignaciones */}
        <div className="space-y-3">
          <h4 className="font-medium text-orange-800 mb-2">Detalle de Reasignaciones:</h4>
          {reassignments.map((reassignment, index) => (
            <div key={index} className="p-3 bg-white rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-orange-600 mr-2" />
                  <span className="font-medium text-orange-800">
                    {new Date(reassignment.date).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                  {reassignment.holidayName && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      {reassignment.holidayName}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-orange-600">
                  <Clock className="w-3 h-3 mr-1" />
                  {reassignment.originalHours.toFixed(1)}h → {reassignment.reassignedHours.toFixed(1)}h
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <User className="w-3 h-3 text-slate-500 mr-1" />
                  <span className="text-slate-600">{reassignment.originalWorkerName}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-orange-500 mx-2" />
                <div className="flex items-center">
                  <User className="w-3 h-3 text-slate-500 mr-1" />
                  <span className="text-slate-600">{reassignment.reassignedWorkerName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Información adicional */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">¿Cómo funciona la reasignación automática?</p>
              <ul className="text-xs space-y-1">
                <li>• Los festivos que caen en días laborables se reasignan automáticamente</li>
                <li>• Las horas se ajustan según el tipo de servicio (3.5h laborables vs 1.5h festivos)</li>
                <li>• Solo se reasignan servicios cuando hay trabajadoras disponibles</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 