import { Assignment, User } from './types';
import { supabase } from './supabase';

export interface AssignmentWithUser extends Assignment {
  users?: User;
}

export interface WorkerBalance {
  workerId: string;
  workerName: string;
  month: number;
  year: number;
  totalAssignedHours: number;
  totalUsedHours: number;
  totalRemainingHours: number;
  assignments: AssignmentWithUser[];
  status: 'excess' | 'deficit' | 'perfect';
  percentage: number;
}

export interface UserBalance {
  userId: string;
  userName: string;
  userSurname: string;
  userAddress?: string;
  userPhone?: string;
  monthlyHours: number; // Horas asignadas al usuario por la empresa
  assignedHours: number; // Horas que la trabajadora tiene asignadas con este usuario
  usedHours: number; // Horas que la trabajadora ha realizado hasta hoy
  remainingHours: number; // Horas que faltan por hacer
  status: 'excess' | 'deficit' | 'perfect';
  percentage: number;
  assignments: AssignmentWithUser[];
  holidayInfo: {
    totalHolidays: number;
    holidayHours: number;
    workingDays: number;
    workingHours: number;
  };
}

export interface WorkerUserBalance {
  workerId: string;
  workerName: string;
  month: number;
  year: number;
  userBalances: UserBalance[];
  totalAssignedHours: number;
  totalUsedHours: number;
  totalRemainingHours: number;
  overallStatus: 'excess' | 'deficit' | 'perfect';
}

/**
 * Calcula el balance de horas de una trabajadora para un mes específico
 */
export async function calculateWorkerBalance(
  workerId: string,
  month: number,
  year: number,
  assignments: AssignmentWithUser[]
): Promise<WorkerBalance> {
  // Calcular horas asignadas basadas en los horarios de las asignaciones
  const totalAssignedHours = assignments.reduce((sum, assignment) => {
    if (!assignment.schedule) return sum;
    
    let weeklyHours = 0;
    Object.values(assignment.schedule as Record<string, { enabled: boolean; timeSlots: { start: string; end: string }[] }>).forEach((daySchedule) => {
      if (daySchedule?.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
        daySchedule.timeSlots.forEach((slot) => {
          const [startHour, startMin] = slot.start.split(':').map(Number);
          const [endHour, endMin] = slot.end.split(':').map(Number);    
          const startTime = startHour + startMin / 60;
          const endTime = endHour + endMin / 60;
          weeklyHours += Math.max(0, endTime - startTime);
        });
      }
    });
    
    // Convertir horas semanales a mensuales (aproximadamente 4.3 semanas por mes)
    const monthlyHours = Math.round(weeklyHours * 4.3 * 10) / 10;
    return sum + monthlyHours;
  }, 0);

  // Calcular horas utilizadas hasta hoy
  const today = new Date();
  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();
  const lastDayToCount = isCurrentMonth ? today.getDate() : new Date(year, month, 0).getDate();
  
  let totalUsedHours = 0;
  
  // Iterar por cada día del mes hasta hoy (si es el mes actual) o hasta el final del mes
  for (let day = 1; day <= lastDayToCount; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // Verificar si hay servicios en este día
    assignments.forEach(assignment => {
      if (assignment.schedule && assignment.schedule[dayName as keyof typeof assignment.schedule]) {
        const daySchedule = assignment.schedule[dayName as keyof typeof assignment.schedule];
        if (daySchedule?.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
          daySchedule.timeSlots.forEach((slot: { start: string; end: string }) => {
            const [startHour, startMin] = slot.start.split(':').map(Number);
            const [endHour, endMin] = slot.end.split(':').map(Number);
            const startTime = startHour + startMin / 60;
            const endTime = endHour + endMin / 60;
            totalUsedHours += Math.max(0, endTime - startTime);
          });
        }
      }
    });
  }
  
  totalUsedHours = Math.round(totalUsedHours * 10) / 10;
  const totalRemainingHours = totalAssignedHours - totalUsedHours;
  const percentage = totalAssignedHours > 0 ? (totalUsedHours / totalAssignedHours) * 100 : 0;
  
  // Determinar estado
  let status: 'excess' | 'deficit' | 'perfect';
  if (Math.abs(totalRemainingHours) < 0.1) {
    status = 'perfect';
  } else if (totalRemainingHours < 0) {
    status = 'excess';
  } else {
    status = 'deficit';
  }
  
  return {
    workerId,
    workerName: assignments[0]?.worker?.name || 'Trabajadora',
    month,
    year,
    totalAssignedHours,
    totalUsedHours,
    totalRemainingHours,
    assignments,
    status,
    percentage: Math.round(percentage * 10) / 10
  };
}

/**
 * Calcula el balance de horas por usuario para una trabajadora
 * siguiendo la lógica: 
 * - Contabiliza días de servicio con cada usuario
 * - Considera festivos entre semana (no se cuentan horas)
 * - Si supera las horas asignadas al usuario, no hace las extra
 * - Si falta, debe completar hasta las horas asignadas al usuario
 * - IMPORTANTE: Considera TODAS las trabajadoras que dan servicio al usuario
 */
export async function calculateWorkerUserBalance(
  workerId: string,
  month: number,
  year: number
): Promise<WorkerUserBalance> {
  if (!supabase) {
    throw new Error('No se pudo conectar a la base de datos');
  }

  // 1. Obtener todas las asignaciones activas de la trabajadora
  const { data: workerAssignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`
      *,
      users:user_id (
        id,
        name,
        surname,
        address,
        phone,
        monthly_hours
      )
    `)
    .eq('worker_id', workerId)
    .eq('status', 'active');

  if (assignmentsError) {
    throw new Error(`Error al obtener asignaciones: ${assignmentsError.message}`);
  }

  if (!workerAssignments || workerAssignments.length === 0) {
    return {
      workerId,
      workerName: 'Trabajadora',
      month,
      year,
      userBalances: [],
      totalAssignedHours: 0,
      totalUsedHours: 0,
      totalRemainingHours: 0,
      overallStatus: 'perfect'
    };
  }

  // 2. Obtener festivos del mes
  const { data: holidays, error: holidaysError } = await supabase
    .from('holidays')
    .select('date, name, type')
    .eq('year', year)
    .eq('month', month)
    .eq('is_active', true);

  const holidayDates = new Set((holidays || []).map((h: { date: string }) => new Date(h.date).getDate()));

  // 3. Obtener usuarios únicos de las asignaciones de esta trabajadora
  const uniqueUserIds = [...new Set(workerAssignments.map(a => a.user_id))];

  // 4. Calcular balance por usuario (considerando TODAS las trabajadoras)
  const userBalances: UserBalance[] = [];
  let totalAssignedHours = 0;
  let totalUsedHours = 0;

  for (const userId of uniqueUserIds) {
    // Obtener TODAS las asignaciones de este usuario (de todas las trabajadoras)
    const { data: allUserAssignments, error: allAssignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        users:user_id (
          id,
          name,
          surname,
          address,
          phone,
          monthly_hours
        ),
        workers:worker_id (
          id,
          name,
          surname
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (allAssignmentsError) {
      continue;
    }

    const user = allUserAssignments?.[0]?.users;
    if (!user) continue;

    const monthlyHours = user.monthly_hours || 0;
    
    // Calcular horas totales asignadas a este usuario (por todas las trabajadoras)
    let totalAssignedHoursForUser = 0;
    let totalUsedHoursForUser = 0;
    let holidayHours = 0;
    let workingHours = 0;
    let totalHolidays = 0;
    let workingDays = 0;

    // Calcular días del mes
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const isHoliday = holidayDates.has(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const today = new Date();
      const isPastDay = date <= today;

      // Verificar si hay servicios en este día (de todas las trabajadoras)
      allUserAssignments?.forEach((assignment: AssignmentWithUser) => {
        if (assignment.schedule && assignment.schedule[dayName as keyof typeof assignment.schedule]) {
          const daySchedule = assignment.schedule[dayName as keyof typeof assignment.schedule];
          if (daySchedule?.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
            let dayHours = 0;
            daySchedule.timeSlots.forEach((slot: { start: string; end: string }) => {
              const [startHour, startMin] = slot.start.split(':').map(Number);
              const [endHour, endMin] = slot.end.split(':').map(Number);
              const startTime = startHour + startMin / 60;
              const endTime = endHour + endMin / 60;
              dayHours += Math.max(0, endTime - startTime);
            });

            // Contar horas según el tipo de día
            if (isHoliday || isWeekend) {
              holidayHours += dayHours;
              totalHolidays++;
            } else {
              workingHours += dayHours;
              workingDays++;
            }

            // Solo contar como "usadas" si es un día pasado
            if (isPastDay) {
              totalUsedHoursForUser += dayHours;
            }

            // Contar como "asignadas" siempre
            totalAssignedHoursForUser += dayHours;
          }
        }
      });
    }

    // Calcular horas de esta trabajadora específica con este usuario
    let workerAssignedHours = 0;
    let workerUsedHours = 0;

    const workerUserAssignments = workerAssignments.filter(a => a.user_id === userId);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const isHoliday = holidayDates.has(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const today = new Date();
      const isPastDay = date <= today;

      workerUserAssignments.forEach((assignment: AssignmentWithUser) => {
        if (assignment.schedule && assignment.schedule[dayName as keyof typeof assignment.schedule]) {
          const daySchedule = assignment.schedule[dayName as keyof typeof assignment.schedule];
          if (daySchedule?.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
            let dayHours = 0;
            daySchedule.timeSlots.forEach((slot: { start: string; end: string }) => {
              const [startHour, startMin] = slot.start.split(':').map(Number);
              const [endHour, endMin] = slot.end.split(':').map(Number);
              const startTime = startHour + startMin / 60;
              const endTime = endHour + endMin / 60;
              dayHours += Math.max(0, endTime - startTime);
            });

            if (isPastDay) {
              workerUsedHours += dayHours;
            }
            workerAssignedHours += dayHours;
          }
        }
      });
    }

    // Aplicar la lógica de balance: comparar total de horas asignadas al usuario vs horas realizadas
    const totalRemainingHours = Math.max(0, monthlyHours - totalUsedHoursForUser);
    
    // Determinar estado basado en el total de horas del usuario
    let status: 'excess' | 'deficit' | 'perfect';
    if (Math.abs(totalRemainingHours) < 0.1) {
      status = 'perfect';
    } else if (totalRemainingHours > 0) {
      status = 'deficit';
    } else {
      status = 'excess';
    }

    const percentage = monthlyHours > 0 ? (totalUsedHoursForUser / monthlyHours) * 100 : 0;

    userBalances.push({
      userId,
      userName: user.name,
      userSurname: user.surname,
      userAddress: user.address,
      userPhone: user.phone,
      monthlyHours,
      assignedHours: Math.round(workerAssignedHours * 10) / 10, // Horas de esta trabajadora
      usedHours: Math.round(workerUsedHours * 10) / 10, // Horas de esta trabajadora
      remainingHours: Math.round(totalRemainingHours * 10) / 10, // Horas totales pendientes del usuario
      status,
      percentage: Math.round(percentage * 10) / 10,
      assignments: workerUserAssignments,
      holidayInfo: {
        totalHolidays,
        holidayHours: Math.round(holidayHours * 10) / 10,
        workingDays,
        workingHours: Math.round(workingHours * 10) / 10
      }
    });

    totalAssignedHours += workerAssignedHours;
    totalUsedHours += workerUsedHours;
  }

  const totalRemainingHours = totalAssignedHours - totalUsedHours;
  
  // Determinar estado general
  let overallStatus: 'excess' | 'deficit' | 'perfect';
  if (Math.abs(totalRemainingHours) < 0.1) {
    overallStatus = 'perfect';
  } else if (totalRemainingHours > 0) {
    overallStatus = 'deficit';
  } else {
    overallStatus = 'excess';
  }

  return {
    workerId,
    workerName: workerAssignments[0]?.worker?.name || 'Trabajadora',
    month,
    year,
    userBalances,
    totalAssignedHours: Math.round(totalAssignedHours * 10) / 10,
    totalUsedHours: Math.round(totalUsedHours * 10) / 10,
    totalRemainingHours: Math.round(totalRemainingHours * 10) / 10,
    overallStatus
  };
} 