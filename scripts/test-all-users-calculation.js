const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno desde el archivo .env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAllUsersCalculation() {
  try {
// // console.log('🔍 Verificando cálculo para todos los usuarios - Julio 2025\n');

    // 1. Obtener todos los usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (usersError) {
      console.error('❌ Error al obtener usuarios:', usersError.message);
      return;
    }

// // console.log(`✅ Encontrados ${users.length} usuarios\n`);

    // 2. Obtener festivos de julio 2025
    const { data: holidays, error: holidaysError } = await supabase
      .from('local_holidays')
      .select('*')
      .eq('year', 2025)
      .eq('month', 7);

    if (holidaysError) {
      console.error('❌ Error al obtener festivos:', holidaysError.message);
      return;
    }

// // console.log('✅ Festivos de julio 2025:', holidays.map(h => `${h.day}/${h.month}: ${h.name}`));

    // 3. Procesar cada usuario
    for (const user of users) {
// // console.log(`\n📋 === USUARIO: ${user.name} ${user.surname} ===`);
// // console.log(`   Dirección: ${user.address || 'No especificada'}`);
// // console.log(`   ID: ${user.id}`);

      // Obtener asignaciones del usuario
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*, workers(*)')
        .eq('user_id', user.id);

      if (assignmentsError) {
        console.error(`❌ Error al obtener asignaciones de ${user.name}:`, assignmentsError.message);
        continue;
      }

      if (assignments.length === 0) {
// // console.log('   ⚠️  No tiene asignaciones');
        continue;
      }

// // console.log(`   📝 Asignaciones encontradas: ${assignments.length}`);
      assignments.forEach(assignment => {
// // console.log(`      - ${assignment.workers.name} ${assignment.workers.surname} (${assignment.workers.worker_type || 'No definido'})`);
        if (assignment.specific_schedule) {
          const scheduleInfo = Object.entries(assignment.specific_schedule)
            .filter(([day, slots]) => slots && Array.isArray(slots) && slots.length > 0)
            .map(([day, slots]) => `${day}: ${slots.length} tramo(s)`)
            .join(', ');
// // console.log(`        Horario: ${scheduleInfo || 'No configurado'}`);
        }
      });

      // Verificar si tiene servicios en fines de semana y festivos
      const hasWeekendHolidayServices = assignments.some(assignment => {
        const worker = assignment.workers;
        return worker.worker_type === 'holiday_weekend' || worker.worker_type === 'both';
      });

// // console.log(`   🔍 ¿Tiene servicios festivos/fines de semana?: ${hasWeekendHolidayServices ? 'SÍ' : 'NO'}`);

      // Calcular días y horas
      const year = 2025;
      const month = 7;
      const daysInMonth = new Date(year, month, 0).getDate();
      
      let laborableDays = 0;
      let holidayWeekendDays = 0;
      let laborableHolidayDays = 0;
      const holidayDates = holidays.map(h => h.day);

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidayDates.includes(day);

        if (isHoliday && !isWeekend) {
          laborableHolidayDays++;
          if (hasWeekendHolidayServices) {
            holidayWeekendDays++;
          }
        } else if (isHoliday || isWeekend) {
          holidayWeekendDays++;
        } else {
          laborableDays++;
        }
      }

// // console.log(`   📊 Días: ${laborableDays} laborables, ${laborableHolidayDays} festivos laborables, ${holidayWeekendDays} festivos/fines de semana`);

      // Calcular horas por trabajadora
      const workerHours = new Map();

      for (const assignment of assignments) {
        const worker = assignment.workers;
        const workerName = `${worker.name} ${worker.surname}`;
        const workerType = worker.worker_type || 'laborable';

        let hours = 0;
        let daysCount = 0;

        if (workerType === 'laborable' || workerType === 'both') {
          // Solo días laborables normales (sin festivos)
          hours = laborableDays * getHoursPerDay(assignment);
          daysCount = laborableDays;
        }

        if (workerType === 'holiday_weekend' || workerType === 'both') {
          // Fines de semana + festivos laborables
          const holidayWeekendHours = holidayWeekendDays * 1.5; // Horas fijas para festivos
          hours += holidayWeekendHours;
          daysCount += holidayWeekendDays;
        }

        if (hours > 0) {
          workerHours.set(workerName, {
            hours: Math.round(hours * 10) / 10, // Redondear a 1 decimal
            days: daysCount,
            type: workerType
          });
        }
      }

      // Mostrar resultados
// // console.log(`   ⏰ Cálculo de horas:`);
      let totalHours = 0;
      for (const [workerName, data] of workerHours) {
// // console.log(`      - ${workerName} (${data.type}): ${data.days} días × ${data.type === 'holiday_weekend' ? '1.5h' : getHoursPerDay(assignments.find(a => a.workers.name + ' ' + a.workers.surname === workerName)) + 'h'} = ${data.hours}h`);
        totalHours += data.hours;
      }

// // console.log(`   🎯 TOTAL: ${Math.round(totalHours * 10) / 10}h`);

      // Detalle de reasignaciones
      if (laborableHolidayDays > 0) {
// // console.log(`   🔄 Reasignaciones:`);
        if (hasWeekendHolidayServices) {
// // console.log(`      - ${laborableHolidayDays} día(s) festivo(s) laborable(s) se reasignan a trabajadora de festivos`);
          holidayDates.forEach(day => {
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              const originalHours = getHoursPerDay(assignments.find(a => a.workers.worker_type === 'laborable'));
// // console.log(`        • ${day}/7: ${originalHours}h → 1.5h`);
            }
          });
        } else {
// // console.log(`      - ${laborableHolidayDays} día(s) festivo(s) laborable(s) NO se realizan`);
          holidayDates.forEach(day => {
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              const originalHours = getHoursPerDay(assignments.find(a => a.workers.worker_type === 'laborable'));
// // console.log(`        • ${day}/7: ${originalHours}h → 0h`);
            }
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Función para obtener horas por día de una asignación
function getHoursPerDay(assignment) {
  if (!assignment || !assignment.specific_schedule) return 0;
  
  let totalHours = 0;
  Object.values(assignment.specific_schedule).forEach(daySchedule => {
    if (Array.isArray(daySchedule) && daySchedule.length > 0) {
      if (typeof daySchedule[0] === 'string' && typeof daySchedule[1] === 'string') {
        // Formato antiguo: ["09:00", "12:30"]
        const start = daySchedule[0];
        const end = daySchedule[1];
        const startHour = parseInt(start.split(':')[0]) + parseInt(start.split(':')[1]) / 60;
        const endHour = parseInt(end.split(':')[0]) + parseInt(end.split(':')[1]) / 60;
        totalHours += Math.max(0, endHour - startHour);
      } else if (typeof daySchedule[0] === 'object') {
        // Formato nuevo: [{start: "09:00", end: "12:30"}]
        daySchedule.forEach(slot => {
          const startHour = parseInt(slot.start.split(':')[0]) + parseInt(slot.start.split(':')[1]) / 60;
          const endHour = parseInt(slot.end.split(':')[0]) + parseInt(slot.end.split(':')[1]) / 60;
          totalHours += Math.max(0, endHour - startHour);
        });
      }
    }
  });
  
  return totalHours;
}

testAllUsersCalculation(); 