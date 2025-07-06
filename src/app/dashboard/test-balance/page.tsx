"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminBalanceGenerator } from "@/components/AdminBalanceGenerator";
import { AlertTriangle, CheckCircle, Loader2, User, Clock } from "lucide-react";
import { HolidayReassignmentCard } from "@/components/HolidayReassignmentCard";

interface User {
  id: string;
  name: string;
  surname: string;
  monthly_hours: number;
}

interface Worker {
  id: string;
  name: string;
  surname: string;
  email: string;
}

import { Assignment } from '@/lib/types';

export default function TestBalancePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedWorker, setSelectedWorker] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [planning, setPlanning] = useState<Array<{date: string, hours: number, isHoliday: boolean}>>([]);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [reassignments, setReassignments] = useState<Array<any>>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Generar planning cuando cambien los parámetros
  useEffect(() => {
    if (selectedUser && selectedWorker) {
      setPlanningLoading(true);
      generateMonthlyPlanning(assignments, selectedUser, selectedWorker, currentMonth, currentYear)
        .then(setPlanning)
        .catch(console.error)
        .finally(() => setPlanningLoading(false));
    } else {
      setPlanning([]);
    }
  }, [selectedUser, selectedWorker, currentMonth, currentYear, assignments]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuarios
      const { data: usersData, error: usersError } = await supabase!
        .from('users')
        .select('id, name, surname, monthly_hours')
        .eq('is_active', true);

      if (usersError) throw usersError;

      // Obtener trabajadoras
      const { data: workersData, error: workersError } = await supabase!
        .from('workers')
        .select('id, name, surname, email');

      if (workersError) throw workersError;

      // Obtener asignaciones
      const { data: assignmentsData, error: assignmentsError } = await supabase!
        .from('assignments')
        .select('id, user_id, worker_id, specific_schedule, status, assigned_hours_per_week, start_date, priority, created_at, updated_at')
        .eq('status', 'active');

      if (assignmentsError) throw assignmentsError;

      setUsers(usersData || []);
      setWorkers(workersData || []);
      setAssignments(assignmentsData as Assignment[] || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyPlanning = async (assignments: Assignment[], userId: string, workerId: string, month: number, year: number) => {
    // Usar la nueva funcionalidad de reasignación automática de festivos
    const { generateMonthlyPlanningWithHolidayReassignment } = await import('@/lib/holidayReassignment');
    
    const result = await generateMonthlyPlanningWithHolidayReassignment(assignments, userId, month, year);
    
    // Convertir al formato esperado por el sistema actual
    const planning = result.planning.map(day => ({
      date: day.date,
      hours: day.hours,
      isHoliday: day.isHoliday
    }));

    // Guardar reasignaciones para mostrar en la UI
    setReassignments(result.reassignments);

    // Mostrar información de reasignaciones en consola para debugging
    if (result.reassignments.length > 0) {
      console.log('🔄 Reasignaciones automáticas detectadas:', result.reassignments);
      console.log('📊 Resumen:', result.reassignments.length, 'reasignaciones');
    }

    return planning;
  };

  const handleBalanceGenerated = () => {
    // Recargar datos si es necesario
    console.log('Balance generado exitosamente');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchData}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedUserData = users.find(u => u.id === selectedUser);
  const selectedWorkerData = workers.find(w => w.id === selectedWorker);
  const userAssignments = assignments.filter(a => a.user_id === selectedUser && a.worker_id === selectedWorker);

  // Bloque de depuración para mostrar datos en pantalla
  const debugAssignments = assignments.filter(a => a.user_id === selectedUser);
  const debugPlanning = planning;

  // Para cada día del mes, mostrar los horarios detectados
  const debugDayDetails = () => {
    if (!selectedUser) return null;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const details = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek];
      let slots: any[] = [];
      debugAssignments.forEach(a => {
        const daySchedule = (a.specific_schedule as any)?.[dayName];
        if (daySchedule && Array.isArray(daySchedule)) {
          slots = slots.concat(daySchedule);
        }
      });
      details.push({
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        dayName,
        slots
      });
    }
    return details;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Generador de Balances Mensuales</h1>
          <Button onClick={fetchData} variant="secondary">
            <Loader2 className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Selectores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Seleccionar Usuario y Trabajadora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Usuario
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                >
                  <option value="">Seleccionar usuario...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.surname} ({user.monthly_hours}h/mes)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Trabajadora
                </label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                  disabled={!selectedUser}
                >
                  <option value="">Seleccionar trabajadora...</option>
                  {selectedUser && workers
                    .filter(worker => 
                      assignments.some(a => 
                        a.user_id === selectedUser && 
                        a.worker_id === worker.id && 
                        a.status === 'active'
                      )
                    )
                    .map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} {worker.surname}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mes
                </label>
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md"
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {new Date(2024, month - 1).toLocaleDateString('es-ES', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Año
                </label>
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md"
                >
                  {[2023, 2024, 2025].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del usuario seleccionado */}
        {selectedUserData && selectedWorkerData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Información del Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedUserData.monthly_hours}</div>
                  <div className="text-sm text-blue-700">Horas Asignadas</div>
                </div>
                              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {planningLoading ? '...' : planning.reduce((sum, day) => sum + day.hours, 0).toFixed(1)}
                </div>
                <div className="text-sm text-green-700">Horas Programadas</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {planningLoading ? '...' : (selectedUserData.monthly_hours - planning.reduce((sum, day) => sum + day.hours, 0)).toFixed(1)}
                </div>
                <div className="text-sm text-orange-700">Balance</div>
              </div>
              </div>

              <div className="text-sm text-slate-600">
                <p><strong>Usuario:</strong> {selectedUserData.name} {selectedUserData.surname}</p>
                <p><strong>Trabajadora seleccionada:</strong> {selectedWorkerData.name} {selectedWorkerData.surname}</p>
                <p><strong>Asignaciones activas:</strong> {userAssignments.length}</p>
                <p><strong>Días con servicio:</strong> {planning.length}</p>
                <p><strong>Total horas programadas (todas las trabajadoras):</strong> {planning.reduce((sum, day) => sum + day.hours, 0).toFixed(1)}h</p>
                <p><strong>Balance esperado:</strong> {(selectedUserData.monthly_hours - planning.reduce((sum, day) => sum + day.hours, 0)).toFixed(1)}h</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generador de Balance */}
        {selectedUser && selectedWorker && selectedUserData && (
          <AdminBalanceGenerator
            workerId={selectedWorker}
            userId={selectedUser}
            month={currentMonth}
            year={currentYear}
            planning={planning}
            assignedHours={selectedUserData.monthly_hours}
            onSuccess={handleBalanceGenerated}
          />
        )}

        {/* Reasignaciones Automáticas de Festivos */}
        {reassignments.length > 0 && (
          <HolidayReassignmentCard reassignments={reassignments} />
        )}

        {/* Lista de usuarios para referencia rápida */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => {
                const userWorkers = workers.filter(worker => 
                  assignments.some(a => 
                    a.user_id === user.id && 
                    a.worker_id === worker.id && 
                    a.status === 'active'
                  )
                );
                
                return (
                  <div key={user.id} className="p-3 border border-slate-200 rounded-lg">
                    <div className="font-medium text-slate-900">
                      {user.name} {user.surname}
                    </div>
                    <div className="text-sm text-slate-600">
                      {user.monthly_hours}h/mes • {userWorkers.length} trabajadora{userWorkers.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {userWorkers.map(w => w.name).join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bloque de depuración */}
        {selectedUser && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Depuración de datos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <strong>Assignments para el usuario:</strong>
                <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto max-h-48">{JSON.stringify(debugAssignments, null, 2)}</pre>
              </div>
              <div className="mb-2">
                <strong>Planning generado:</strong>
                <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto max-h-48">{JSON.stringify(debugPlanning, null, 2)}</pre>
              </div>
              <div>
                <strong>Horarios detectados por día:</strong>
                <div className="overflow-x-auto max-h-48">
                  <table className="text-xs border border-slate-200 w-full">
                    <thead>
                      <tr>
                        <th className="border px-2">Fecha</th>
                        <th className="border px-2">Día</th>
                        <th className="border px-2">Slots</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debugDayDetails()?.map((d, idx) => (
                        <tr key={idx}>
                          <td className="border px-2 whitespace-nowrap">{d.date}</td>
                          <td className="border px-2">{d.dayName}</td>
                          <td className="border px-2">
                            {d.slots.length > 0 ? (
                              d.slots.map((slot, i) => (
                                <span key={i} className="inline-block mr-2">
                                  {typeof slot === 'object' && slot.start && slot.end ? `${slot.start}-${slot.end}` : JSON.stringify(slot)}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400">Sin horario</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 