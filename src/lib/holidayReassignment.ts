import { Assignment } from '@/lib/types';
import { getHolidaysForMonthFromDatabase } from './calendar';

export interface ReassignedService {
  date: string;
  originalWorkerId: string;
  originalWorkerName: string;
  reassignedWorkerId: string;
  reassignedWorkerName: string;
  originalHours: number;
  reassignedHours: number;
  reason: string;
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Calcula las horas basándose en el horario específico
 */
function calculateHoursFromSchedule(schedule: unknown[]): number {
  if (!Array.isArray(schedule) || schedule.length < 2) return 0;
  
  // Si es un array de strings (formato antiguo)
  if (typeof schedule[0] === 'string' && typeof schedule[1] === 'string') {
    const start = schedule[0];
    const end = schedule[1];
    const startHour = parseInt(start.split(':')[0]) + parseInt(start.split(':')[1]) / 60;
    const endHour = parseInt(end.split(':')[0]) + parseInt(end.split(':')[1]) / 60;
    return Math.max(0, endHour - startHour);
  }
  
  // Si es un array de objetos (formato nuevo)
  if (typeof schedule[0] === 'object' && schedule[0].start && schedule[0].end) {
    return schedule.reduce((total, slot) => {
      const startHour = parseInt(slot.start.split(':')[0]) + parseInt(slot.start.split(':')[1]) / 60;
      const endHour = parseInt(slot.end.split(':')[0]) + parseInt(slot.end.split(':')[1]) / 60;
      return total + Math.max(0, endHour - startHour);
    }, 0);
  }
  
  return 0;
}

/**
 * Detecta el tipo de trabajadora basándose en su horario (método temporal)
 */
function detectWorkerType(assignment: Assignment): 'laborable' | 'holiday_weekend' | 'both' {
  const schedule = assignment.specific_schedule;
  if (!schedule) return 'laborable';

  const laborableDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as WeekDay[];
  const weekendDays = ['saturday', 'sunday'] as WeekDay[];

  const hasLaborableDays = laborableDays.some(day => 
    schedule[day] && Array.isArray(schedule[day]) && schedule[day].length > 0
  );

  const hasWeekendDays = weekendDays.some(day => 
    schedule[day] && Array.isArray(schedule[day]) && schedule[day].length > 0
  );

  if (hasLaborableDays && hasWeekendDays) return 'both';
  if (hasWeekendDays) return 'holiday_weekend';
  return 'laborable';
}

/**
 * Detecta reasignaciones necesarias para un usuario en un mes específico
 */
export async function detectHolidayReassignments(
  assignments: Assignment[],
  userId: string,
  month: number,
  year: number
): Promise<{
  reassignments: ReassignedService[];
  totalReassignedHours: number;
}> {
  const userAssignments = assignments.filter(a => a.user_id === userId);
  if (userAssignments.length === 0) {
    return { reassignments: [], totalReassignedHours: 0 };
  }

  // Obtener festivos del mes
  const holidays = await getHolidaysForMonthFromDatabase(year, month);
  const holidayDates = new Set(holidays.map(h => h.date));

  // Clasificar trabajadoras por tipo (método temporal)
  const holidayWeekendWorkers = userAssignments.filter(a => {
    const workerType = detectWorkerType(a);
    return workerType === 'holiday_weekend' || workerType === 'both';
  });

  const laborableWorkers = userAssignments.filter(a => {
    const workerType = detectWorkerType(a);
    return workerType === 'laborable' || workerType === 'both';
  });

  const reassignments: ReassignedService[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek] as WeekDay;
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const isHoliday = holidayDates.has(dateStr);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = domingo, 6 = sábado

    // Solo procesar si es festivo o fin de semana
    if (!isHoliday && !isWeekend) continue;

    // Buscar servicios de trabajadoras laborables en este día
    for (const laborableAssignment of laborableWorkers) {
      const daySchedule = laborableAssignment.specific_schedule?.[dayName];
      if (daySchedule && Array.isArray(daySchedule) && daySchedule.length > 0) {
        const originalHours = calculateHoursFromSchedule(daySchedule as { start: string; end: string }[]);
        
        if (originalHours > 0) {
          // Buscar una trabajadora de festivos/fines de semana disponible
          const availableHolidayWorker = holidayWeekendWorkers.find(hw => {
            const hwDaySchedule = hw.specific_schedule?.[dayName];
            return hwDaySchedule && Array.isArray(hwDaySchedule) && hwDaySchedule.length > 0;
          });

          if (availableHolidayWorker) {
            // Calcular horas reasignadas: 3.5h laborable → 1.5h festivo
            const reassignedHours = 1.5; // Horas fijas para festivos/fines de semana

            reassignments.push({
              date: dateStr,
              originalWorkerId: laborableAssignment.worker_id,
              originalWorkerName: `${laborableAssignment.worker?.name} ${laborableAssignment.worker?.surname}`,
              reassignedWorkerId: availableHolidayWorker.worker_id,
              reassignedWorkerName: `${availableHolidayWorker.worker?.name} ${availableHolidayWorker.worker?.surname}`,
              originalHours,
              reassignedHours,
              reason: isHoliday ? 'Día festivo' : 'Fin de semana'
            });
          }
        }
      }
    }
  }

  const totalReassignedHours = reassignments.reduce((sum, r) => sum + r.reassignedHours, 0);

  return {
    reassignments,
    totalReassignedHours
  };
}

/**
 * Genera un planning mensual con reasignaciones automáticas de festivos
 */
export async function generateMonthlyPlanningWithHolidayReassignment(
  assignments: Assignment[],
  userId: string,
  month: number,
  year: number
): Promise<{
  planning: Array<{date: string, hours: number, isHoliday: boolean, workerId: string}>;
  reassignments: ReassignedService[];
}> {
  const userAssignments = assignments.filter(a => a.user_id === userId);
  if (userAssignments.length === 0) {
    return { planning: [], reassignments: [] };
  }

  // Obtener reasignaciones necesarias
  const reassignmentResult = await detectHolidayReassignments(assignments, userId, month, year);
  const reassignmentMap = new Map(
    reassignmentResult.reassignments.map(r => [r.date, r])
  );

  // Obtener festivos
  const holidays = await getHolidaysForMonthFromDatabase(year, month);
  const holidayDates = new Set(holidays.map(h => h.date));

  const planning = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek] as WeekDay;
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const isHoliday = holidayDates.has(dateStr);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Verificar si hay reasignación para este día
    const reassignment = reassignmentMap.get(dateStr);
    
    let totalHours = 0;
    let workerId = '';

    if (reassignment) {
      // Usar horas reasignadas (1.5h para festivos/fines de semana)
      totalHours = reassignment.reassignedHours;
      workerId = reassignment.reassignedWorkerId;
    } else {
      // Calcular horas normales según el tipo de trabajadora
      for (const assignment of userAssignments) {
        const daySchedule = assignment.specific_schedule?.[dayName];
        if (daySchedule && Array.isArray(daySchedule) && daySchedule.length > 0) {
          const hours = calculateHoursFromSchedule(daySchedule);
          
          // Aplicar lógica según el tipo de trabajadora y el día
          if (hours > 0) {
            const workerType = detectWorkerType(assignment);
            
            // Solo contar horas si la trabajadora trabaja este tipo de día
            let shouldCount = false;
            
            if (isHoliday || isWeekend) {
              // Día festivo o fin de semana
              shouldCount = workerType === 'holiday_weekend' || workerType === 'both';
            } else {
              // Día laborable
              shouldCount = workerType === 'laborable' || workerType === 'both';
            }
            
            if (shouldCount) {
              totalHours += hours;
              if (!workerId) {
                workerId = assignment.worker_id;
              }
            }
          }
        }
      }
    }

    if (totalHours > 0) {
      planning.push({
        date: dateStr,
        hours: totalHours,
        isHoliday,
        workerId
      });
    }
  }

  return {
    planning,
    reassignments: reassignmentResult.reassignments
  };
} 