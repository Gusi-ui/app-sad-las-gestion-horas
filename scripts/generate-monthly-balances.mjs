// @ts-check

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Configurar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para obtener festivos de la base de datos
async function getHolidaysFromDatabase(year, month) {
  // Crear fechas de inicio y fin del mes
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
  
  const { data, error } = await supabase
    .from('holidays')
    .select('date, name, type')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('is_active', true);
  
  if (error) throw error;
  return data || [];
}

// Función para obtener asignaciones
async function getAllAssignments(filters) {
  let query = supabase.from('assignments').select('*');
  
  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  if (filters.status) query = query.eq('status', filters.status);
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Funciones utilitarias
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getWeekDayName(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

function timeDiffInHours(start, end) {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  const startTime = startHour + startMin / 60;
  const endTime = endHour + endMin / 60;
  return Math.max(0, endTime - startTime);
}

/**
 * Calcula y guarda el balance mensual de todos los usuarios activos.
 * @param {number} year Año (ej: 2025)
 * @param {number} month Mes (1-12)
 */
async function calculateAndStoreMonthlyBalances(year, month) {
  console.log(`Calculando balances para ${month}/${year}...`);
  
  // Obtener todos los usuarios activos
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, surname, monthly_hours')
    .eq('is_active', true);
  
  if (usersError) throw usersError;
  if (!users || users.length === 0) {
    console.log('No hay usuarios activos para calcular balances');
    return;
  }
  
  // Obtener festivos del mes
  const holidays = await getHolidaysFromDatabase(year, month);
  console.log(`Festivos encontrados: ${holidays.length}`);
  
  // Obtener asignaciones activas
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, user_id, worker_id, weekly_hours, schedule, start_date, end_date')
    .eq('status', 'active');
  
  if (assignmentsError) throw assignmentsError;
  
  // Calcular balances para cada usuario
  for (const user of users) {
    console.log(`Procesando usuario: ${user.name} ${user.surname}`);
    
    // Obtener asignaciones del usuario
    const userAssignments = assignments.filter(a => a.user_id === user.id);
    
    if (userAssignments.length === 0) {
      console.log(`  - No tiene asignaciones activas`);
      continue;
    }
    
    // Calcular horas programadas basándose en asignaciones y festivos
    let scheduledHours = 0;
    
    for (const assignment of userAssignments) {
      // Verificar si la asignación está activa en este mes
      const assignmentStart = new Date(assignment.start_date);
      const assignmentEnd = assignment.end_date ? new Date(assignment.end_date) : new Date(year, month, 0);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      
      // Si la asignación no está activa en este mes, saltar
      if (assignmentEnd < monthStart || assignmentStart > monthEnd) {
        continue;
      }
      
      // Calcular horas semanales de la asignación
      const weeklyHours = parseFloat(assignment.weekly_hours) || 0;
      
      // Calcular semanas en el mes (aproximado)
      const daysInMonth = new Date(year, month, 0).getDate();
      const weeksInMonth = daysInMonth / 7;
      
      // Horas base del mes
      let monthHours = weeklyHours * weeksInMonth;
      
      // Ajustar por festivos si hay horario específico
      if (assignment.schedule) {
        // Aquí podrías implementar lógica más compleja para ajustar por festivos
        // Por ahora, usamos un cálculo simple
        const holidayDates = holidays.map(h => h.date);
        const workingDaysInMonth = daysInMonth - holidayDates.length;
        const workingWeeksInMonth = workingDaysInMonth / 5; // Asumiendo 5 días laborables por semana
        monthHours = weeklyHours * workingWeeksInMonth;
      }
      
      scheduledHours += monthHours;
    }
    
    // Calcular balance (diferencia entre horas programadas y asignadas)
    const assignedHours = parseFloat(user.monthly_hours) || 0;
    const balance = scheduledHours - assignedHours;
    
    // Determinar estado
    let status = 'perfect';
    if (Math.abs(balance) > 0.1) {
      status = balance > 0 ? 'excess' : 'deficit';
    }
    
    console.log(`  - Horas asignadas: ${assignedHours}h`);
    console.log(`  - Horas programadas: ${scheduledHours.toFixed(2)}h`);
    console.log(`  - Balance: ${balance.toFixed(2)}h (${status})`);
    
    // Guardar o actualizar en monthly_balances
    const { error: upsertError } = await supabase
      .from('monthly_balances')
      .upsert({
        user_id: user.id,
        worker_id: userAssignments[0]?.worker_id || null, // Usar la primera asignación como referencia
        month: month,
        year: year,
        assigned_hours: assignedHours,
        scheduled_hours: parseFloat(scheduledHours.toFixed(2)),
        balance: parseFloat(balance.toFixed(2)),
        status: status,
        message: `Balance calculado automáticamente para ${month}/${year}`,
        planning: { calculated_at: new Date().toISOString() },
        holiday_info: { 
          total_holidays: holidays.length,
          holiday_dates: holidays.map(h => h.date)
        }
      }, {
        onConflict: 'user_id,worker_id,month,year'
      });
    
    if (upsertError) {
      console.error(`Error guardando balance para ${user.name}:`, upsertError);
    } else {
      console.log(`  - Balance guardado correctamente`);
    }
  }
  
  console.log('¡Cálculo de balances completado!');
}

async function main() {
  const args = process.argv.slice(2);
  const now = new Date();
  const year = args[0] ? parseInt(args[0], 10) : now.getFullYear();
  const month = args[1] ? parseInt(args[1], 10) : now.getMonth() + 1;

  if (!year || !month) {
    console.error('Uso: node scripts/generate-monthly-balances.js [año] [mes]');
    process.exit(1);
  }

  console.log(`Calculando balances mensuales para ${month}/${year}...`);
  try {
    await calculateAndStoreMonthlyBalances(year, month);
  } catch (err) {
    console.error('Error al calcular balances:', err);
    process.exit(1);
  }
}

main(); 