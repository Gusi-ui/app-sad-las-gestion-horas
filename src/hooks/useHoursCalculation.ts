import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateUsedHoursUntilToday, calculateUserHoursStatus } from '@/lib/utils';
import { Assignment, User } from '@/lib/types';
import { generateMonthlyPlanningWithHolidayReassignment } from '@/lib/holidayReassignment';

interface AssignmentWithUser extends Assignment {
  users?: User;
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
  percentage: number;
}

export function useHoursCalculation(workerId: string | null) {
  const [assignments, setAssignments] = useState<AssignmentWithUser[]>([]);
  const [userHoursStatus, setUserHoursStatus] = useState<UserHoursStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para verificar si una asignación tiene servicio hoy
  const hasServiceToday = (assignment: AssignmentWithUser) => {
    if (!assignment.schedule) return true;

    const today = new Date();
    const todayDayName = Object.keys({
      monday: 'monday',
      tuesday: 'tuesday',
      wednesday: 'wednesday',
      thursday: 'thursday',
      friday: 'friday',
      saturday: 'saturday',
      sunday: 'sunday'
    })[today.getDay() === 0 ? 6 : today.getDay() - 1];

    const todaySchedule = assignment.schedule?.[todayDayName as keyof typeof assignment.schedule];
    return todaySchedule?.enabled && todaySchedule.timeSlots && todaySchedule.timeSlots.length > 0;
  };

  // Función para verificar si una asignación tiene servicio mañana (para mostrar servicios próximos)
  const hasServiceTomorrow = (assignment: AssignmentWithUser) => {
    if (!assignment.schedule) return false;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayName = Object.keys({
      monday: 'monday',
      tuesday: 'tuesday',
      wednesday: 'wednesday',
      thursday: 'thursday',
      friday: 'friday',
      saturday: 'saturday',
      sunday: 'sunday'
    })[tomorrow.getDay() === 0 ? 6 : tomorrow.getDay() - 1];

    const tomorrowSchedule = assignment.schedule?.[tomorrowDayName as keyof typeof assignment.schedule];
    return tomorrowSchedule?.enabled && tomorrowSchedule.timeSlots && tomorrowSchedule.timeSlots.length > 0;
  };

  // Función para convertir el nuevo formato de schedule al formato esperado por calculateWeeklyHours
  function isDaySchedule(obj: unknown): obj is { enabled: boolean; timeSlots: { start: string; end: string }[] } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'enabled' in obj &&
      'timeSlots' in obj &&
      Array.isArray((obj as { timeSlots?: unknown[] }).timeSlots)
    );
  }

  // Envolver calculateWeeklyHoursFromNewFormat en useCallback
  const calculateWeeklyHoursFromNewFormat = useCallback((schedule: unknown) => {
    if (!schedule) return 0;
    let totalHours = 0;
    Object.values(schedule).forEach((daySchedule: unknown) => {
      if (!isDaySchedule(daySchedule) || !daySchedule.enabled || daySchedule.timeSlots.length === 0) return;
      daySchedule.timeSlots.forEach((slot: unknown) => {
        if (typeof slot === 'object' && slot !== null && 'start' in slot && 'end' in slot) {
          const slotObj = slot as { start: string; end: string };
          const [startHour, startMin] = slotObj.start.split(':').map(Number);
          const [endHour, endMin] = slotObj.end.split(':').map(Number);
          const startTime = startHour + startMin / 60;
          const endTime = endHour + endMin / 60;
          totalHours += Math.max(0, endTime - startTime);
        }
      });
    });
    return Math.round(totalHours * 10) / 10;
  }, []);

  // Función para obtener el horario de hoy de una asignación
  const getTodaySchedule = (assignment: AssignmentWithUser) => {
    if (!assignment.schedule) return null;

    const today = new Date();
    const todayDayName = Object.keys({
      monday: 'monday',
      tuesday: 'tuesday',
      wednesday: 'wednesday',
      thursday: 'thursday',
      friday: 'friday',
      saturday: 'saturday',
      sunday: 'sunday'
    })[today.getDay() === 0 ? 6 : today.getDay() - 1];

    const todaySchedule = assignment.schedule?.[todayDayName as keyof typeof assignment.schedule];
    if (!todaySchedule?.enabled || !todaySchedule.timeSlots || todaySchedule.timeSlots.length === 0) return null;

    // Formatear los timeSlots
    return todaySchedule.timeSlots.map((slot: unknown) => {
      if (typeof slot === 'object' && slot !== null && 'start' in slot && 'end' in slot) {
        const slotObj = slot as { start: string; end: string };
        return `${slotObj.start}-${slotObj.end}`;
      }
      return '';
    }).join(', ');
  };

  // Función para obtener el estado de un servicio basado en la hora
  const getServiceStatus = (assignment: AssignmentWithUser) => {
    const todaySchedule = getTodaySchedule(assignment);
    if (!todaySchedule) return 'no-service';

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

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Verificar si algún slot está en progreso o completado
    for (const slot of timeSlots) {
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      if (currentTime >= startTime && currentTime <= endTime) {
        return 'in-progress';
      }

      if (currentTime > endTime) {
        return 'completed';
      }
    }

    // Si no hay slots en progreso o completados, el próximo está pendiente
    return 'pending';
  };

  // Calcular estadísticas generales
  const stats = useMemo(() => {
    const totalAssignedHours = assignments.reduce((sum, a) => {
      const weeklyHours = calculateWeeklyHoursFromNewFormat(a.schedule);
      return sum + weeklyHours;
    }, 0);

    const uniqueUsers = new Set(assignments.map(a => a.user_id)).size;
    const todaysAssignments = assignments.filter(hasServiceToday);
    const tomorrowsAssignments = assignments.filter(hasServiceTomorrow);

    // Solo mostrar servicios de mañana si es domingo y hay servicios de lunes
    const today = new Date();
    const isSunday = today.getDay() === 0;
    const assignmentsToShow = todaysAssignments.length > 0 ? todaysAssignments :
      (isSunday && tomorrowsAssignments.length > 0 ? [] : tomorrowsAssignments);

          return {
        totalAssignedHours,
        uniqueUsers,
        todaysAssignments,
        tomorrowsAssignments,
        assignmentsToShow,
        totalAssignments: assignments.length
      };
  }, [assignments, calculateWeeklyHoursFromNewFormat]);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      if (!workerId || !supabase) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Obtener asignaciones con datos de usuario
        const { data: assignmentsData, error: assignmentsError } = await supabase
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
          setError('Error al cargar asignaciones');
          setLoading(false);
          return;
        }

        setAssignments(assignmentsData || []);

        // Calcular estado de horas por usuario
        const userStatusMap = new Map<string, UserHoursStatus>();
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        assignmentsData?.forEach(assignment => {
          const userId = assignment.user_id;
          const user = assignment.users;

          if (!user) return;

          if (!userStatusMap.has(userId)) {
            userStatusMap.set(userId, {
              userId,
              userName: user.name,
              userSurname: user.surname,
              userAddress: user.address,
              userPhone: user.phone,
              monthlyHours: user.monthly_hours || 0,
              assignedHours: 0,
              usedHours: 0,
              remainingHours: 0,
              status: 'perfect',
              assignments: [],
              totalWorkers: 0,
              percentage: 0
            });
          }

          const userStatus = userStatusMap.get(userId)!;

            // Calcular horas semanales basadas en el horario específico
  const weeklyHours = calculateWeeklyHoursFromNewFormat(assignment.schedule);
          userStatus.assignedHours += weeklyHours;
          userStatus.assignments.push(assignment);
        });

        // Obtener horas utilizadas de todas las trabajadoras para cada usuario
        try {
          for (const [userId, userStatus] of userStatusMap) {
            const { data: allAssignments, error: allAssignmentsError } = await supabase
              .from('assignments')
              .select(`
                *,
                workers:worker_id (
                  id,
                  name,
                  surname
                )
              `)
              .eq('user_id', userId)
              .eq('status', 'active');

            if (allAssignmentsError) {
              continue; // Continuar con el siguiente usuario en lugar de fallar completamente
            }

            if (allAssignments) {
              // USAR LA NUEVA LÓGICA DE REASIGNACIÓN AUTOMÁTICA
              try {
                // Generar planning con reasignaciones automáticas
                const planningResult = await generateMonthlyPlanningWithHolidayReassignment(
                  allAssignments,
                  userId,
                  currentMonth,
                  currentYear
                );

                // Calcular horas utilizadas hasta hoy considerando reasignaciones
                let totalUsedHours = 0;
                const today = new Date();
                const todayDay = today.getDate();

                planningResult.planning.forEach(day => {
                  const dayDate = new Date(day.date);
                  const dayDay = dayDate.getDate();

                  // Solo contar días hasta hoy
                  if (dayDay <= todayDay) {
                    totalUsedHours += day.hours;
                  }
                });

                userStatus.usedHours = totalUsedHours;
                userStatus.remainingHours = userStatus.monthlyHours - userStatus.usedHours;
                userStatus.totalWorkers = allAssignments.length;
                userStatus.percentage = userStatus.monthlyHours > 0 ? (userStatus.usedHours / userStatus.monthlyHours) * 100 : 0;

                // Determinar estado usando la función utilitaria
                try {
                  const hoursCalculation = calculateUserHoursStatus(userStatus.monthlyHours, userStatus.usedHours);
                  userStatus.status = hoursCalculation.status;
                } catch {
                  userStatus.status = 'perfect'; // Estado por defecto
                }

                // Log de debugging para reasignaciones
                // if (planningResult.reassignments.length > 0) {
                //   // // }

              } catch {
                // Fallback al método anterior si hay error
                let totalUsedHours = 0;

                allAssignments.forEach(assignment => {
                  try {
                    // Calcular horas utilizadas hasta hoy para esta asignación
                    const usedHoursForAssignment = calculateUsedHoursUntilToday(
                      assignment.specific_schedule,
                      currentYear,
                      currentMonth
                    );
                    totalUsedHours += usedHoursForAssignment;
                  } catch {
                    // Continuar con la siguiente asignación
                  }
                });

                userStatus.usedHours = totalUsedHours;
                userStatus.remainingHours = userStatus.monthlyHours - userStatus.usedHours;
                userStatus.totalWorkers = allAssignments.length;
                userStatus.percentage = userStatus.monthlyHours > 0 ? (userStatus.usedHours / userStatus.monthlyHours) * 100 : 0;

                // Determinar estado usando la función utilitaria
                try {
                  const hoursCalculation = calculateUserHoursStatus(userStatus.monthlyHours, userStatus.usedHours);
                  userStatus.status = hoursCalculation.status;
                } catch {
                  userStatus.status = 'perfect'; // Estado por defecto
                }
              }
            }
          }
        } catch {
          // No establecer error aquí, continuar con los datos que tengamos
        }

        setUserHoursStatus(Array.from(userStatusMap.values()));

      } catch {
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData().catch(() => {
      setError('Error inesperado al cargar los datos');
      setLoading(false);
    });
  }, [workerId, calculateWeeklyHoursFromNewFormat]);

  // Efecto para actualizar automáticamente el estado de los servicios cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      // Forzar re-render para actualizar estados automáticos
      setAssignments(prev => [...prev]);
    }, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, [calculateWeeklyHoursFromNewFormat]);

  return {
    assignments,
    userHoursStatus,
    stats,
    loading,
    error,
    getServiceStatus,
    getTodaySchedule,
    hasServiceToday,
    hasServiceTomorrow,
    calculateWeeklyHoursFromNewFormat,
    refetch: () => {
      setAssignments([]);
      setUserHoursStatus([]);
      setLoading(true);
      setError(null);
    }
  };
}