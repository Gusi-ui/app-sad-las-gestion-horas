import { assignments as assignmentsApi } from "@/lib/supabase-new";
import { getHolidaysFromDatabase } from "@/lib/calendar";
import { createClient } from "@/lib/supabase-server";

// Utilidades
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function isWeekend(date: Date) {
  return date.getDay() === 0 || date.getDay() === 6;
}
function getWeekDayName(date: Date): string {
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
}
function timeDiffInHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

/**
 * Calcula y guarda el balance mensual de todos los usuarios activos.
 * @param year Año (ej: 2025)
 * @param month Mes (1-12)
 */
export async function calculateAndStoreMonthlyBalances(year: number, month: number) {
  const supabase = await createClient();
  // 1. Obtener todos los usuarios activos
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, monthly_hours')
    .eq('is_active', true);
  if (usersError) throw usersError;

  // 2. Obtener festivos reales del mes
  const holidays = await getHolidaysFromDatabase(year, month);
  const holidayDates = new Set(holidays.map(h => h.date));

  for (const user of users) {
    // 3. Obtener todas las asignaciones activas del usuario para el mes
    const userAssignments = await assignmentsApi.getAll({
      user_id: user.id,
      status: "active"
    });
    let realHours = 0;
    const daysInMonth = getDaysInMonth(year, month);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().slice(0, 10);
      const isHoliday = holidayDates.has(dateStr);
      const weekend = isWeekend(date);
      const weekDay = getWeekDayName(date);
      // Buscar asignaciones activas ese día
      const activeAssignments = userAssignments.filter(a => {
        const start = new Date(a.start_date);
        const end = a.end_date ? new Date(a.end_date) : null;
        return date >= start && (!end || date <= end);
      });
      for (const a of activeAssignments) {
        let applies = false;
        if (isHoliday && a.assignment_type === "holidays") applies = true;
        else if (weekend && a.assignment_type === "weekends") applies = true;
        else if (!isHoliday && !weekend && (a.assignment_type === "regular" || a.assignment_type === "laborables")) applies = true;
        if (!applies) continue;
        const schedule = a.schedule as any;
        if (schedule && schedule[weekDay] && schedule[weekDay].enabled) {
          const timeSlots = schedule[weekDay].timeSlots || [];
          for (const slot of timeSlots) {
            realHours += timeDiffInHours(slot.start, slot.end);
          }
        }
      }
    }
    const assignedHours = user.monthly_hours;
    const difference = realHours - assignedHours;
    // Guardar o actualizar el balance mensual
    await supabase
      .from('monthly_balances')
      .upsert([
        {
          user_id: user.id,
          year,
          month,
          assigned_hours: assignedHours,
          real_hours: realHours,
          difference
        }
      ], { onConflict: 'user_id,year,month' });
  }
} 