export type PlanningDay = { 
  date: string; 
  hours: number; 
  isHoliday?: boolean;
};

export type MonthlyBalanceResult = {
  assigned_hours: number;
  scheduled_hours: number;
  balance: number;
  status: "perfect" | "excess" | "deficit";
  message: string;
  planning: PlanningDay[];
  // Información detallada sobre festivos
  holidayInfo: {
    totalHolidays: number;
    holidayHours: number;
    workingDays: number;
    workingHours: number;
  };
};

/**
 * Calcula el balance mensual de horas para un usuario y su planning.
 * @param planning Array de días y horas programadas para el mes
 * @param assigned_hours Horas asignadas al usuario ese mes (límite)
 * @returns Balance mensual, estado y mensaje para la trabajadora
 */
export function calculateMonthlyBalance(
  planning: PlanningDay[],
  assigned_hours: number
): MonthlyBalanceResult {
  // 1. Sumar todas las horas programadas para el mes
  const scheduled_hours = planning.reduce((sum, day) => sum + (day.hours || 0), 0);

  // 2. Calcular el balance
  const balance = assigned_hours - scheduled_hours;

  // 3. Determinar el estado y el mensaje
  let status: "perfect" | "excess" | "deficit";
  let message: string;

  if (Math.abs(balance) < 0.1) {
    status = "perfect";
    message = "Las horas asignadas coinciden exactamente con las que se van a consumir este mes.";
  } else if (balance > 0) {
    status = "excess";
    message = `Este usuario tendrá ${Math.abs(balance).toFixed(1)}h de más. Tendrás ${Math.abs(balance).toFixed(1)}h libres.`;
  } else {
    status = "deficit";
    message = `Este usuario tendrá ${Math.abs(balance).toFixed(1)}h de menos. Tendrás que realizar ${Math.abs(balance).toFixed(1)}h adicionales.`;
  }

  // 3. Calcular información detallada sobre festivos
  const holidayDays = planning.filter(day => day.isHoliday);
  const workingDays = planning.filter(day => !day.isHoliday);
  
  const holidayHours = holidayDays.reduce((sum, day) => sum + (day.hours || 0), 0);
  const workingHours = workingDays.reduce((sum, day) => sum + (day.hours || 0), 0);

  // 4. Devolver el resultado
  return {
    assigned_hours,
    scheduled_hours,
    balance,
    status,
    message,
    planning,
    holidayInfo: {
      totalHolidays: holidayDays.length,
      holidayHours,
      workingDays: workingDays.length,
      workingHours,
    },
  };
} 