const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAllUsers() {
  try {
// // console.log('🔍 VERIFICANDO TODOS LOS USUARIOS Y SUS BALANCES...\n');
    
    // Obtener todos los usuarios activos
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (usersError) {
      console.error('Error al obtener usuarios:', usersError);
      return;
    }

// // console.log(`📊 Total usuarios activos: ${users.length}\n`);

    // Obtener todos los balances de julio 2025
    const { data: balances, error: balancesError } = await supabase
      .from('monthly_hours')
      .select('*')
      .eq('year', 2025)
      .eq('month', 7);

    if (balancesError) {
      console.error('Error al obtener balances:', balancesError);
      return;
    }

// // console.log(`📊 Total balances julio 2025: ${balances.length}\n`);

    // Obtener todas las asignaciones
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        workers(name, email, worker_type),
        users(name, surname)
      `);

    if (assignmentsError) {
      console.error('Error al obtener asignaciones:', assignmentsError);
      return;
    }

// // console.log(`📊 Total asignaciones: ${assignments.length}\n`);

    // Obtener festivos de julio 2025
    const { data: holidays, error: holidaysError } = await supabase
      .from('local_holidays')
      .select('*')
      .eq('year', 2025)
      .eq('month', 7);

    if (holidaysError) {
      console.error('Error al obtener festivos:', holidaysError);
      return;
    }

// // console.log(`🎉 Festivos julio 2025: ${holidays.length}`);
    holidays.forEach(holiday => {
// // console.log(`   ${holiday.day}/${holiday.month}/${holiday.year}: ${holiday.name}`);
    });
// // console.log('');

    // Analizar cada usuario
// // console.log('📋 ANÁLISIS POR USUARIO:');
// // console.log('========================\n');

    const results = [];

    for (const user of users) {
// // console.log(`👤 ${user.name} ${user.surname}`);
// // console.log(`   ID: ${user.id}`);
// // console.log(`   Horas mensuales asignadas: ${user.monthly_hours}h`);

      // Buscar asignaciones del usuario
      const userAssignments = assignments.filter(a => a.user_id === user.id);
// // console.log(`   Asignaciones encontradas: ${userAssignments.length}`);

      if (userAssignments.length === 0) {
// // console.log(`   ⚠️  SIN ASIGNACIONES - No debería tener balance`);
// // console.log('');
        continue;
      }

      // Mostrar asignaciones
      userAssignments.forEach((assignment, index) => {
// // console.log(`   Asignación ${index + 1}:`);
// // console.log(`     Trabajadora: ${assignment.workers?.name || 'N/A'}`);
// // console.log(`     Horario: ${JSON.stringify(assignment.schedule)}`);
      });

      // Buscar balance del usuario
      const userBalance = balances.find(b => b.user_id === user.id);
      
      if (userBalance) {
// // console.log(`   📊 Balance en BD:`);
// // console.log(`     Asignadas: ${userBalance.assigned_hours}h`);
// // console.log(`     Laborables: ${userBalance.laborable_hours}h`);
// // console.log(`     Festivos: ${userBalance.holiday_hours}h`);
// // console.log(`     Diferencia: ${userBalance.difference}h`);

        // Calcular manualmente
        const manualCalculation = calculateManualHours(userAssignments, holidays, 2025, 7);
        
// // console.log(`   🧮 Cálculo manual:`);
// // console.log(`     Días laborables: ${manualCalculation.laborableDays}`);
// // console.log(`     Días festivos: ${manualCalculation.holidayDays}`);
// // console.log(`     Horas laborables: ${manualCalculation.laborableHours}h`);
// // console.log(`     Horas festivas: ${manualCalculation.holidayHours}h`);
// // console.log(`     Total manual: ${manualCalculation.totalHours}h`);

        // Comparar
        const laborableDiff = Math.abs(manualCalculation.laborableHours - userBalance.laborable_hours);
        const holidayDiff = Math.abs(manualCalculation.holidayHours - userBalance.holiday_hours);
        const totalDiff = Math.abs(manualCalculation.totalHours - (userBalance.laborable_hours + userBalance.holiday_hours));

// // console.log(`   📊 Comparación:`);
// // console.log(`     Diferencia laborables: ${laborableDiff.toFixed(2)}h`);
// // console.log(`     Diferencia festivos: ${holidayDiff.toFixed(2)}h`);
// // console.log(`     Diferencia total: ${totalDiff.toFixed(2)}h`);

        if (totalDiff > 0.1) {
// // console.log(`   ❌ ERROR: Los valores NO coinciden`);
          results.push({
            user: `${user.name} ${user.surname}`,
            userId: user.id,
            manual: manualCalculation,
            balance: userBalance,
            difference: totalDiff
          });
        } else {
// // console.log(`   ✅ Los valores coinciden`);
        }
      } else {
// // console.log(`   ⚠️  SIN BALANCE - No se encontró balance para julio 2025`);
      }

// // console.log('');
    }

    // Resumen de errores
    if (results.length > 0) {
// // console.log('🚨 RESUMEN DE ERRORES ENCONTRADOS:');
// // console.log('==================================\n');
      
      results.forEach((result, index) => {
// // console.log(`${index + 1}. ${result.user}`);
// // console.log(`   Manual: ${result.manual.totalHours}h (${result.manual.laborableHours}h laborables + ${result.manual.holidayHours}h festivos)`);
// // console.log(`   BD: ${result.balance.laborable_hours + result.balance.holiday_hours}h (${result.balance.laborable_hours}h laborables + ${result.balance.holiday_hours}h festivos)`);
// // console.log(`   Diferencia: ${result.difference.toFixed(2)}h`);
// // console.log('');
      });

// // console.log(`📊 Total usuarios con errores: ${results.length}/${users.length}`);
    } else {
// // console.log('✅ Todos los balances son correctos');
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

function calculateManualHours(assignments, holidays, year, month) {
  // Contar días de cada tipo en el mes
  const daysInMonth = new Date(year, month, 0).getDate();
  const holidayDays = holidays.map(h => h.day);
  
  let laborableDays = 0;
  let holidayDaysCount = 0;

  // Para cada día del mes
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const isHoliday = holidayDays.includes(day);

    // Verificar si hay servicio en este día según las asignaciones
    let hasService = false;
    let serviceHours = 0;

    assignments.forEach(assignment => {
      if (assignment.schedule) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        
        if (assignment.schedule[dayName] && assignment.schedule[dayName].length > 0) {
          hasService = true;
          // Calcular horas del servicio
          assignment.schedule[dayName].forEach(slot => {
            if (typeof slot === 'string') {
              // Formato "HH:MM-HH:MM"
              const [start, end] = slot.split('-');
              const startTime = new Date(`2000-01-01T${start}:00`);
              const endTime = new Date(`2000-01-01T${end}:00`);
              serviceHours += (endTime - startTime) / (1000 * 60 * 60);
            } else if (slot.start && slot.end) {
              // Formato objeto {start: "HH:MM", end: "HH:MM"}
              const startTime = new Date(`2000-01-01T${slot.start}:00`);
              const endTime = new Date(`2000-01-01T${slot.end}:00`);
              serviceHours += (endTime - startTime) / (1000 * 60 * 60);
            }
          });
        }
      }
    });

    if (hasService) {
      if (isHoliday) {
        holidayDaysCount++;
      } else {
        laborableDays++;
      }
    }
  }

  return {
    laborableDays,
    holidayDays: holidayDaysCount,
    laborableHours: laborableDays * 1.75, // Asumiendo 1h 45min por servicio
    holidayHours: holidayDaysCount * 1.75,
    totalHours: (laborableDays + holidayDaysCount) * 1.75
  };
}

verifyAllUsers(); 