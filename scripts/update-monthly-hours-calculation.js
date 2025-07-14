const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Funciones de utilidad para festivos
function isWeekend(date) {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function isWorkingDay(date, holidays) {
  const dayOfWeek = date.getDay();
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekendDay) return false;
  
  const dateString = date.toISOString().split('T')[0];
  const isHoliday = holidays.some(holiday => holiday.date === dateString);
  
  return !isHoliday;
}

function isHolidayDay(date, holidays) {
  const dayOfWeek = date.getDay();
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekendDay) return true;
  
  const dateString = date.toISOString().split('T')[0];
  const isHoliday = holidays.some(holiday => holiday.date === dateString);
  
  return isHoliday;
}

function canWorkerWorkOnDay(workerType, date, holidays) {
  switch (workerType) {
    case 'laborables':
      return isWorkingDay(date, holidays);
    case 'festivos':
      return isHolidayDay(date, holidays);
    case 'flexible':
      return true;
    default:
      return false;
  }
}

async function calculateMonthlyHoursForWorker(workerType, weeklyHours, year, month, holidays) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let availableDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (canWorkerWorkOnDay(workerType, date, holidays)) {
      availableDays++;
    }
  }
  
  // Calcular semanas basadas en días disponibles
  let weeksInMonth;
  
  if (workerType === 'laborables') {
    // Para trabajadoras laborables: 5 días por semana
    weeksInMonth = availableDays / 5;
  } else if (workerType === 'festivos') {
    // Para trabajadoras festivas: 2 días por semana (sábado y domingo)
    weeksInMonth = availableDays / 2;
  } else {
    // Para trabajadoras flexibles: 7 días por semana
    weeksInMonth = availableDays / 7;
  }
  
  return Math.round(weeklyHours * weeksInMonth * 100) / 100;
}

async function updateMonthlyHoursCalculation() {
// // console.log('🔄 Actualizando cálculo de horas mensuales con lógica de festivos...\n');

  try {
    // Obtener festivos de 2025
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('*')
      .eq('is_active', true)
      .order('date');

    if (holidaysError) {
      console.error('❌ Error al obtener festivos:', holidaysError);
      return;
    }

// // console.log(`✅ Se cargaron ${holidays.length} festivos\n`);

    // Obtener todas las asignaciones activas
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        worker:workers!assignments_worker_id_fkey(
          id,
          name,
          worker_type
        )
      `)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError);
      return;
    }

// // console.log(`✅ Se encontraron ${assignments.length} asignaciones activas\n`);

    // Calcular horas mensuales para cada asignación
    const calculations = [];
    
    for (const assignment of assignments) {
      const workerType = assignment.worker?.worker_type || 'laborables';
      const weeklyHours = assignment.weekly_hours;
      
      // Calcular para los próximos 12 meses
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      for (let i = 0; i < 12; i++) {
        const targetMonth = currentMonth + i;
        const targetYear = currentYear + Math.floor((targetMonth - 1) / 12);
        const actualMonth = ((targetMonth - 1) % 12) + 1;
        
        const monthlyHours = await calculateMonthlyHoursForWorker(
          workerType,
          weeklyHours,
          targetYear,
          actualMonth,
          holidays
        );
        
        calculations.push({
          assignmentId: assignment.id,
          workerId: assignment.worker_id,
          workerName: assignment.worker?.name,
          workerType,
          weeklyHours,
          year: targetYear,
          month: actualMonth,
          calculatedHours: monthlyHours,
          assignmentType: assignment.assignment_type
        });
      }
    }

    // Mostrar resultados
// // console.log('📊 Cálculos de horas mensuales:\n');

    const workerGroups = {};
    calculations.forEach(calc => {
      if (!workerGroups[calc.workerId]) {
        workerGroups[calc.workerId] = [];
      }
      workerGroups[calc.workerId].push(calc);
    });

    Object.keys(workerGroups).forEach(workerId => {
      const workerCalcs = workerGroups[workerId];
      const firstCalc = workerCalcs[0];
      
// // console.log(`👤 ${firstCalc.workerName} (${firstCalc.workerType})`);
// // console.log(`   Horas semanales: ${firstCalc.weeklyHours}`);
// // console.log(`   Tipo de asignación: ${firstCalc.assignmentType}`);
// // console.log(`   Horas mensuales calculadas:`);
      
      // Mostrar solo los próximos 3 meses
      workerCalcs.slice(0, 3).forEach(calc => {
        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const monthName = monthNames[calc.month - 1];
        
// // console.log(`     ${monthName} ${calc.year}: ${calc.calculatedHours} horas`);
      });
// // console.log('');
    });

    // Ejemplo específico: San Juan 2025
// // console.log('🎯 Ejemplo específico: San Juan 2025 (24 de junio, martes)\n');
    
    const sanJuanDate = new Date('2025-06-24');
    const sanJuanString = sanJuanDate.toISOString().split('T')[0];
    const sanJuanHoliday = holidays.find(h => h.date === sanJuanString);
    
    if (sanJuanHoliday) {
// // console.log(`✅ San Juan encontrado: ${sanJuanHoliday.name} (${sanJuanHoliday.type})`);
// // console.log(`   Fecha: ${sanJuanString} (Martes)`);
// // console.log(`   Es fin de semana: ${isWeekend(sanJuanDate) ? 'Sí' : 'No'}`);
// // console.log(`   Es festivo: Sí`);
// // console.log(`   Es día laborable: ${isWorkingDay(sanJuanDate, holidays) ? 'Sí' : 'No'}`);
// // console.log(`   Es día festivo: ${isHolidayDay(sanJuanDate, holidays) ? 'Sí' : 'No'}`);
// // console.log('');
      
      // Mostrar qué trabajadoras pueden trabajar ese día
      const uniqueWorkerTypes = [...new Set(assignments.map(a => a.worker?.worker_type).filter(Boolean))];
      
      uniqueWorkerTypes.forEach(workerType => {
        const canWork = canWorkerWorkOnDay(workerType, sanJuanDate, holidays);
// // console.log(`   Trabajadora ${workerType}: ${canWork ? 'Puede trabajar' : 'No puede trabajar'}`);
      });
    }

// // console.log('✅ Cálculo de horas mensuales completado');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

updateMonthlyHoursCalculation(); 