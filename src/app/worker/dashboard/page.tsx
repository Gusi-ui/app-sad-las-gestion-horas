"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatScheduleOrdered } from "@/lib/utils";
import { ScheduleDisplay } from "@/components/ScheduleDisplay";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, CheckCircle, TrendingUp, TrendingDown, AlertTriangle, MapPin, Phone, Mail, UserCheck, RotateCcw, Users } from "lucide-react";
import { Worker, Assignment, User as UserType } from "@/lib/types";
import Link from "next/link";

interface AssignmentWithUser extends Assignment {
  users?: UserType;
}

interface UserHoursStatus {
  userId: string;
  userName: string;
  userSurname: string;
  userAddress?: string;
  userPhone?: string;
  monthlyHours: number;
  assignedHours: number;
  usedHours: number;
  remainingHours: number;
  status: 'excess' | 'deficit' | 'perfect';
  assignments: AssignmentWithUser[];
  totalWorkers: number;
}

// Función para formatear los horarios de una asignación
const formatSchedule = (schedule: Record<string, any[]> | undefined) => {
  if (!schedule) return 'Sin horario específico'
  
  const dayNames: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes', 
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  }
  
  const today = new Date();
  const todayDayName = Object.keys(dayNames)[today.getDay() === 0 ? 6 : today.getDay() - 1];

  // Usar la función de utilidad para ordenar cronológicamente
  const orderedSchedule = formatScheduleOrdered(schedule, dayNames);
  
  if (orderedSchedule === 'No configurado') return 'Sin horario específico';
  
  // Agregar indicador de "HOY" si hay servicio hoy
  const todaySchedule = schedule[todayDayName];
  if (todaySchedule && todaySchedule.length > 0) {
    const todaySlots = todaySchedule.length === 2 && typeof todaySchedule[0] === 'string' && typeof todaySchedule[1] === 'string'
      ? `${todaySchedule[0]} - ${todaySchedule[1]}`
      : todaySchedule.map((slot: any) => `${slot.start}-${slot.end}`).join(', ');
    
    return orderedSchedule.replace(
      `${dayNames[todayDayName]}: ${todaySlots}`,
      `🕐 HOY: ${dayNames[todayDayName]} ${todaySlots}`
    );
  }
  
  return orderedSchedule;
}

// Función para verificar si una asignación tiene servicio hoy
const hasServiceToday = (assignment: AssignmentWithUser) => {
  if (!assignment.specific_schedule) return true // Si no hay horario específico, asumir que sí
  
  const today = new Date()
  const todayDayName = Object.keys({
    monday: 'monday',
    tuesday: 'tuesday', 
    wednesday: 'wednesday',
    thursday: 'thursday',
    friday: 'friday',
    saturday: 'saturday',
    sunday: 'sunday'
  })[today.getDay() === 0 ? 6 : today.getDay() - 1]
  
  const todaySchedule = assignment.specific_schedule?.[todayDayName as keyof typeof assignment.specific_schedule]
  return todaySchedule && todaySchedule.length > 0
}

// Función para obtener el horario de hoy de una asignación
const getTodaySchedule = (assignment: AssignmentWithUser) => {
  if (!assignment.specific_schedule) return null
  
  const today = new Date()
  const todayDayName = Object.keys({
    monday: 'monday',
    tuesday: 'tuesday', 
    wednesday: 'wednesday',
    thursday: 'thursday',
    friday: 'friday',
    saturday: 'saturday',
    sunday: 'sunday'
  })[today.getDay() === 0 ? 6 : today.getDay() - 1]
  
  const todaySchedule = assignment.specific_schedule?.[todayDayName as keyof typeof assignment.specific_schedule]
  if (!todaySchedule || todaySchedule.length === 0) return null
  
  // Debug para Jose Martínez
  if (assignment.users?.name === 'Jose' && assignment.users?.surname === 'Martínez') {
//     // console.log('JOSE MARTINEZ TODAY SCHEDULE DEBUG:', {
//       todayDayName,
//       todaySchedule,
//       today: today.toLocaleDateString(),
//       dayOfWeek: today.getDay()
//     });
  }
  
  // Manejar múltiples slots de tiempo
  // Debug para Jose Martínez
  if (assignment.users?.name === 'Jose' && assignment.users?.surname === 'Martínez') {
//     // console.log('JOSE MARTINEZ GET TODAY SCHEDULE DEBUG:', {
//       todaySchedule,
//       todayScheduleType: typeof todaySchedule[0],
//       todayScheduleLength: todaySchedule.length,
//       isArray: Array.isArray(todaySchedule)
//     });
  }
  
  // Caso 1: Array de objetos {start, end} (formato nuevo) - [{start: '08:00', end: '10:00'}, {start: '13:00', end: '15:00'}]
  if (Array.isArray(todaySchedule) && todaySchedule.length > 0 && typeof todaySchedule[0] === 'object' && todaySchedule[0] !== null && 'start' in todaySchedule[0] && 'end' in todaySchedule[0]) {
    return todaySchedule.map((slot: any) => `${slot.start}-${slot.end}`).join(', ')
  } 
  // Caso 2: Array de strings (formato antiguo) - ['08:00', '10:00']
  else if (todaySchedule.length === 2 && typeof todaySchedule[0] === 'string' && typeof todaySchedule[1] === 'string') {
    return `${todaySchedule[0]} - ${todaySchedule[1]}`
  }
  // Caso 3: Array de strings múltiples - ['08:00-10:00', '13:00-15:00']
  else if (Array.isArray(todaySchedule) && todaySchedule.length > 0 && typeof todaySchedule[0] === 'string') {
    return todaySchedule.join(', ')
  }
  
  return null
}

export default function WorkerDashboard() {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithUser[]>([]);
  const [userHoursStatus, setUserHoursStatus] = useState<UserHoursStatus[]>([]);
  const [completedServices, setCompletedServices] = useState<Set<string>>(() => {
    // Cargar servicios completados desde localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('completedServices');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  // Función para obtener el estado de un servicio basado en la hora
  const getServiceStatus = (assignment: AssignmentWithUser) => {
    const todaySchedule = getTodaySchedule(assignment);
    if (!todaySchedule) return 'no-service'; // No hay servicio hoy
    
    // Debug: Log para Jose Martínez
    if (assignment.users?.name === 'Jose' && assignment.users?.surname === 'Martínez') {
//       // console.log('JOSE MARTINEZ DEBUG:', {
//         todaySchedule,
//         assignment: assignment.id,
//         specific_schedule: assignment.specific_schedule,
//         currentTime: new Date().toLocaleTimeString()
//       });
    }
    
    // Parsear horario - manejar múltiples slots
    const timeSlots: Array<{start: string, end: string}> = [];
    
    // Formato múltiple: "08:00-09:30, 13:00-15:00"
    if (todaySchedule.includes(',')) {
      const slots = todaySchedule.split(',').map(slot => slot.trim());
      slots.forEach(slot => {
        if (slot.includes('-')) {
          const parts = slot.split('-');
          if (parts.length === 2) {
            timeSlots.push({ start: parts[0], end: parts[1] });
          }
        }
      });
    }
    // Formato simple: "13:00-15:00" o "13:00 - 15:00"
    else if (todaySchedule.includes('-')) {
      const cleanSchedule = todaySchedule.replace(' - ', '-');
      const parts = cleanSchedule.split('-');
      if (parts.length === 2) {
        timeSlots.push({ start: parts[0], end: parts[1] });
      }
    }
    
    // Si no pudimos parsear ningún horario, retornar no-service
    if (timeSlots.length === 0) {
      return 'no-service';
    }
    
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      // Verificar cada slot de tiempo
      for (const slot of timeSlots) {
        const [startHour, startMinute] = slot.start.split(':').map(Number);
        const [endHour, endMinute] = slot.end.split(':').map(Number);
        
        // Validar que los números son válidos
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
          continue;
        }
        
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;
        
        // Debug: Log para Jose Martínez
        if (assignment.users?.name === 'Jose' && assignment.users?.surname === 'Martínez') {
//           // console.log('JOSE MARTINEZ TIME DEBUG:', {
//             slot,
//             startHour,
//             startMinute,
//             endHour,
//             endMinute,
//             currentHour,
//             currentMinute,
//             currentTime,
//             startTimeMinutes,
//             endTimeMinutes,
//             status: currentTime < startTimeMinutes ? 'pending' : 
//                    currentTime >= startTimeMinutes && currentTime < endTimeMinutes ? 'in-progress' : 
//                    'completed',
//             now: new Date().toLocaleTimeString()
//           });
        }
        
        // Si estamos dentro de este slot, retornar el estado correspondiente
        if (currentTime >= startTimeMinutes && currentTime < endTimeMinutes) {
          return 'in-progress'; // En progreso
        }
      }
      
      // Si no estamos en ningún slot activo, verificar si ya terminaron todos
      const allSlotsCompleted = timeSlots.every(slot => {
        const [endHour, endMinute] = slot.end.split(':').map(Number);
        const endTimeMinutes = endHour * 60 + endMinute;
        return currentTime >= endTimeMinutes;
      });
      
      if (allSlotsCompleted) {
        return 'completed'; // Todos los slots terminaron
      } else {
        return 'pending'; // Aún no ha empezado ningún slot
      }
    } catch (error) {
      console.error('Error parsing time:', error, 'Schedule:', todaySchedule);
      return 'no-service';
    }
  };

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-primary';
      case 'in-progress': return 'text-warning';
      case 'completed': return 'text-success';
      default: return 'text-slate-600';
    }
  };

  // Función para obtener el icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏰';
      case 'in-progress': return '🔄';
      case 'completed': return '✅';
      default: return '';
    }
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Función para limpiar servicios completados (se puede llamar al cambiar de día)
  const clearCompletedServices = () => {
    setCompletedServices(new Set());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('completedServices');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Obtener usuario autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError("No autenticado");
          return;
        }

        // Buscar trabajadora por email
        const { data: workerData, error: workerError } = await supabase
          .from("workers")
          .select("*")
          .eq("email", user.email)
          .single();
        
        if (workerError || !workerData) {
          setError("No se encontró la trabajadora asociada a este usuario");
          return;
        }
        
        setWorker(workerData);

        if (!supabase) {
          setError("Error de configuración de base de datos");
          return;
        }

        const supabaseClient = supabase;

        // Buscar asignaciones activas con datos de usuario
        const { data: assignmentsData } = await supabaseClient
          .from("assignments")
          .select("*, users(*)")
          .eq("worker_id", workerData.id)
          .eq("status", "active");
        
        const assignmentsWithUsers = (assignmentsData as AssignmentWithUser[]) || [];
        setAssignments(assignmentsWithUsers);

        // Calcular estado de horas por usuario
        const userStatusMap = new Map<string, UserHoursStatus>();
        
        // Primero, obtener TODAS las asignaciones activas para cada usuario (de todas las trabajadoras)
        const userIds = [...new Set(assignmentsWithUsers.map(a => a.user_id))];
        
        for (const userId of userIds) {
          // Buscar todas las asignaciones activas para este usuario (de todas las trabajadoras)
          const { data: allUserAssignments } = await supabaseClient
            .from("assignments")
            .select("*, users(*), workers(*)")
            .eq("user_id", userId)
            .eq("status", "active");
          
          const userAssignments = allUserAssignments || [];
          const user = userAssignments[0]?.users;
          
          if (!user) continue;
          
          // Calcular horas totales asignadas al usuario (de todas las trabajadoras)
          const totalAssignedHours = userAssignments.reduce((sum, assignment) => 
            sum + (assignment.assigned_hours_per_week || 0), 0
          );
          
          // Filtrar solo las asignaciones de la trabajadora actual para mostrar en el dashboard
          const currentWorkerAssignments = assignmentsWithUsers.filter(a => a.user_id === userId);
          
          userStatusMap.set(userId, {
            userId,
            userName: user.name,
            userSurname: user.surname,
            userAddress: user.address,
            userPhone: user.phone,
            monthlyHours: user.monthly_hours || 0,
            assignedHours: totalAssignedHours, // Horas totales del usuario (todas las trabajadoras)
            usedHours: 0,
            remainingHours: 0,
            status: 'perfect',
            assignments: currentWorkerAssignments, // Solo asignaciones de esta trabajadora para mostrar
            totalWorkers: userAssignments.length // Número total de trabajadoras que atienden al usuario
          });
        }

        // Calcular horas utilizadas y estado
        const currentDate = new Date();
        
        userStatusMap.forEach(userStatus => {
          // Calcular horas utilizadas basándose en las semanas transcurridas del mes
          const weeksInMonth = Math.ceil(currentDate.getDate() / 7);
          userStatus.usedHours = Math.round(userStatus.assignedHours * weeksInMonth * 10) / 10;
          userStatus.remainingHours = userStatus.monthlyHours - userStatus.usedHours;
          
          // Determinar estado
          if (Math.abs(userStatus.remainingHours) < 1) {
            userStatus.status = 'perfect';
          } else if (userStatus.remainingHours < 0) {
            userStatus.status = 'excess';
          } else {
            userStatus.status = 'deficit';
          }
        });

        setUserHoursStatus(Array.from(userStatusMap.values()));
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Efecto para actualizar automáticamente el estado de los servicios cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      // Forzar re-render para actualizar estados automáticos
      setAssignments(prev => [...prev]);
    }, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, []);

  // Servicios de hoy
  const todaysAssignments = assignments.filter(hasServiceToday);

  // Resumen general
  const totalAssignedHours = assignments.reduce((sum, a) => sum + (a.assigned_hours_per_week || 0), 0);
  const uniqueUsers = new Set(assignments.map(a => a.user_id)).size;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
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
            <p className="text-red-600 mb-4">Error al cargar datos: {error}</p>
            <Link href="/worker/login">
              <Button>Volver al Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
            <p className="text-danger mb-4">No se encontró la trabajadora.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-secondary">
                👩‍💼 Panel de {worker.name} {worker.surname}
              </h1>
              <p className="text-sm text-slate-600">
                Gestión de servicios y cómputo de horas por usuario
              </p>
            </div>
            <Button variant="secondary" onClick={() => router.push("/worker/planning")}>
              <Calendar className="w-4 h-4 mr-2" />
              Ver Planning
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Bienvenida */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              ¡Hola, {worker.name}!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              Este es tu panel personal donde puedes ver el estado de horas de cada usuario que atiendes. 
              <strong>El cómputo mensual se calcula por usuario</strong>, sumando las horas de todas las trabajadoras 
              que le dan servicio. Esto te permite ver el total de horas que recibe cada usuario.
            </p>
          </CardContent>
        </Card>

        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-blue-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-700">Usuarios Atendidos</p>
                  <p className="text-xl font-bold text-blue-900">{uniqueUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-green-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-green-700">Horas Asignadas</p>
                  <p className="text-xl font-bold text-green-900">{totalAssignedHours}h/sem</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-purple-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-purple-700">Servicios Hoy</p>
                  <p className="text-xl font-bold text-purple-900">{todaysAssignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Servicios de Hoy */}
        {todaysAssignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Servicios para hoy
                </div>
                <div className="text-sm text-slate-600">
                  {todaysAssignments.filter(a => getServiceStatus(a) === 'completed').length} de {todaysAssignments.length} completado{todaysAssignments.filter(a => getServiceStatus(a) === 'completed').length !== 1 ? 's' : ''}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaysAssignments.map(assignment => (
                  <div key={assignment.id} className={`border rounded-lg p-4 relative ${
                    getServiceStatus(assignment) === 'completed' ? 'bg-green-50 border-green-200' :
                    getServiceStatus(assignment) === 'in-progress' ? 'bg-orange-50 border-orange-200' :
                    'bg-white'
                  }`}>
                    <div className="flex items-start justify-between">
                      {getServiceStatus(assignment) === 'completed' && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">
                          {assignment.users?.name} {assignment.users?.surname}
                        </h4>
                        {assignment.users?.address && (
                          <div className="flex items-center text-sm text-slate-600 mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {assignment.users.address}
                          </div>
                        )}
                        <div className="text-sm text-slate-600 mt-1">
                          {getTodaySchedule(assignment) ? (
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${getStatusColor(getServiceStatus(assignment))}`}>
                                {getStatusIcon(getServiceStatus(assignment))} {getTodaySchedule(assignment)}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                getServiceStatus(assignment) === 'pending' ? 'bg-primary-100 text-primary-800' :
                                getServiceStatus(assignment) === 'in-progress' ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {getServiceStatus(assignment) === 'pending' ? 'Pendiente' :
                                 getServiceStatus(assignment) === 'in-progress' ? 'En Progreso' :
                                 'Completado'}
                              </span>
                            </div>
                          ) : (
                            <ScheduleDisplay schedule={assignment.specific_schedule} showIcon={false} layout="rows" />
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-900">
                          {assignment.assigned_hours_per_week}h/sem
                        </div>
                        <div className="text-xs text-slate-500 mb-2">
                          {assignment.users?.phone}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                          getServiceStatus(assignment) === 'pending' ? 'bg-primary-100 text-primary-800' :
                          getServiceStatus(assignment) === 'in-progress' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {getServiceStatus(assignment) === 'pending' ? '⏰ Pendiente' :
                           getServiceStatus(assignment) === 'in-progress' ? '🔄 En Progreso' :
                           '✅ Completado'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado de Horas por Usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Estado de Horas por Usuario
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userHoursStatus.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <User className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No tienes usuarios asignados actualmente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userHoursStatus.map(userStatus => (
                  <div key={userStatus.userId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 text-lg">
                          {userStatus.userName} {userStatus.userSurname}
                        </h4>
                        <div className="flex items-center text-sm text-slate-600 mt-1">
                          <Users className="w-3 h-3 mr-1" />
                          {userStatus.totalWorkers} trabajadora{userStatus.totalWorkers !== 1 ? 's' : ''} atendiendo
                        </div>
                        {userStatus.userAddress && (
                          <div className="flex items-center text-sm text-slate-600 mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {userStatus.userAddress}
                          </div>
                        )}
                        {userStatus.userPhone && (
                          <div className="flex items-center text-sm text-slate-600 mt-1">
                            <Phone className="w-3 h-3 mr-1" />
                            {userStatus.userPhone}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          userStatus.status === 'perfect' 
                            ? 'bg-green-100 text-green-800' 
                            : userStatus.status === 'excess'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-primary-100 text-primary-800'
                        }`}>
                          {userStatus.status === 'perfect' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {userStatus.status === 'excess' && <TrendingUp className="w-3 h-3 mr-1" />}
                          {userStatus.status === 'deficit' && <TrendingDown className="w-3 h-3 mr-1" />}
                          {userStatus.status === 'perfect' && 'Perfecto'}
                          {userStatus.status === 'excess' && `+${Math.abs(userStatus.remainingHours).toFixed(1)}h`}
                          {userStatus.status === 'deficit' && `-${Math.abs(userStatus.remainingHours).toFixed(1)}h`}
                        </div>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Progreso del mes</span>
                        <span className="font-medium">
                          {userStatus.usedHours.toFixed(1)}h / {userStatus.monthlyHours}h
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            userStatus.status === 'perfect' 
                              ? 'bg-green-500' 
                              : userStatus.status === 'excess'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ 
                            width: `${Math.min((userStatus.usedHours / userStatus.monthlyHours) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Utilizadas: {userStatus.usedHours.toFixed(1)}h</span>
                        <span className={
                          userStatus.status === 'perfect' 
                            ? 'text-green-600' 
                            : userStatus.status === 'excess'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }>
                          {userStatus.status === 'perfect' 
                            ? '✅ Perfecto'
                            : userStatus.status === 'excess'
                            ? `⚠️ Exceso: ${Math.abs(userStatus.remainingHours).toFixed(1)}h`
                            : `📋 Faltan: ${Math.abs(userStatus.remainingHours).toFixed(1)}h`
                          }
                        </span>
                      </div>
                    </div>

                                         {/* Asignaciones activas */}
                     <div className="mt-3 pt-3 border-t border-slate-200">
                       <div className="text-sm text-slate-600 mb-2">Horarios semanales:</div>
                       <div className="space-y-2">
                         {userStatus.assignments.map(assignment => {
                           // Debug: Log para ver el formato de los datos
//                            // console.log('ASSIGNMENT DEBUG:', {
//                              id: assignment.id,
//                              user: assignment.users?.name,
//                              specific_schedule: assignment.specific_schedule
//                            });
                           
                           const today = new Date();
                           const todayDayName = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'][today.getDay() === 0 ? 6 : today.getDay() - 1];
                           
                           return (
                             <div key={assignment.id} className="text-xs bg-slate-50 p-2 rounded">
                               <div className="flex justify-between items-start">
                                 <div className="flex-1">
                                   {assignment.specific_schedule ? (
                                     Object.entries(assignment.specific_schedule)
                                       .filter(([, times]) => times && times.length > 0)
                                       .map(([day, times]) => {
                                         const dayNames: Record<string, string> = {
                                           monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
                                           thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom'
                                         };
                                         const isTodayDay = day === todayDayName;
                                         // Manejar diferentes formatos de tiempo
                                         let timeStr = '';
                                         try {
                                           // Debug para Jose Martínez
                                           if (assignment.users?.name === 'Jose' && assignment.users?.surname === 'Martínez' && day === 'friday') {
//                                              // console.log('JOSE MARTINEZ FRIDAY TIMES DEBUG:', {
//                                                times,
//                                                timesLength: times.length,
//                                                timesType: typeof times[0],
//                                                isArray: Array.isArray(times)
//                                              });
                                           }
                                           
                                           // Caso 1: Array de strings (formato antiguo) - ['08:00', '10:00']
                                           if (times.length === 2 && typeof times[0] === 'string' && typeof times[1] === 'string') {
                                             timeStr = `${times[0]}-${times[1]}`;
                                           }
                                           // Caso 2: Array de objetos {start, end} (formato nuevo) - [{start: '08:00', end: '10:00'}, {start: '13:00', end: '15:00'}]
                                           else if (Array.isArray(times) && times.length > 0 && typeof times[0] === 'object' && times[0] !== null) {
                                             timeStr = times.map((time: any) => {
                                               if (time && typeof time === 'object' && 'start' in time && 'end' in time) {
                                                 return `${time.start}-${time.end}`;
                                               }
                                               return 'Formato desconocido';
                                             }).join(', ');
                                           }
                                           // Caso 3: Array de strings múltiples - ['08:00-10:00', '13:00-15:00']
                                           else if (Array.isArray(times) && times.length > 0 && typeof times[0] === 'string') {
                                             timeStr = times.join(', ');
                                           }
                                           else {
                                             timeStr = 'Formato desconocido';
                                           }
                                         } catch (error) {
                                           // console.log('ERROR PARSING TIMES:', times, error);
                                           timeStr = 'Error en formato';
                                         }
                                         
                                         return (
                                           <div key={day} className={`${isTodayDay ? 'font-bold text-blue-600' : 'text-slate-700'}`}>
                                             {isTodayDay ? '🕐 HOY: ' : ''}{dayNames[day]} {timeStr}
                                           </div>
                                         );
                                       })
                                   ) : (
                                     <div className="text-slate-500">Sin horario específico</div>
                                   )}
                                 </div>
                                 <div className="text-right ml-2">
                                   <span className="font-medium text-slate-900">{assignment.assigned_hours_per_week}h/sem</span>
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                variant="secondary" 
                className="w-full justify-start"
                onClick={() => router.push("/worker/planning")}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Ver Planning Completo
              </Button>
                             <Button 
                 variant="secondary" 
                 className="w-full justify-start"
                 onClick={() => window.location.reload()}
               >
                 <RotateCcw className="w-4 h-4 mr-2" />
                 Actualizar Datos
               </Button>
               {todaysAssignments.filter(a => getServiceStatus(a) === 'completed').length > 0 && (
                 <Button 
                   variant="secondary" 
                   className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                   onClick={clearCompletedServices}
                 >
                   <RotateCcw className="w-4 h-4 mr-2" />
                   Limpiar Completados
                 </Button>
               )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 