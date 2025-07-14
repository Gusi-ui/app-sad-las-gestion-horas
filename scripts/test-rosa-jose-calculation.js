const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno desde el archivo .env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Verificar que las variables estén disponibles
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables de entorno no encontradas. Verifica que .env.local existe con:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRosaJoseCalculation() {
  try {
// // console.log('🔍 Verificando cálculo para Rosa Robles y José Martínez - Julio 2025\n');

    // 1. Buscar Rosa Robles por ID
    const rosaWorkerId = '1661b7b6-20d1-4eab-bdd3-462e9603d27a';
    const { data: rosaWorker, error: rosaError } = await supabase
      .from('workers')
      .select('*')
      .eq('id', rosaWorkerId)
      .single();

    if (rosaError || !rosaWorker) {
      console.error('❌ No se encontró Rosa Robles:', rosaError?.message);
      return;
    }

// // console.log('✅ Rosa Robles encontrada:', {
      id: rosaWorker.id,
      name: rosaWorker.name,
      surname: rosaWorker.surname,
      email: rosaWorker.email,
      worker_type: rosaWorker.worker_type || 'No definido'
    });

    // 2. Buscar José Martínez (usuario)
    const joseUserId = '9af4d980-414c-4e9b-8400-3f6021755d45';
    const { data: joseUser, error: joseError } = await supabase
      .from('users')
      .select('*')
      .eq('id', joseUserId)
      .single();

    if (joseError || !joseUser) {
      console.error('❌ No se encontró José Martínez:', joseError?.message);
      return;
    }

// // console.log('✅ José Martínez encontrado:', {
      id: joseUser.id,
      name: joseUser.name,
      surname: joseUser.surname,
      address: joseUser.address
    });

    // 3. Obtener TODAS las asignaciones de José Martínez
    const { data: allAssignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*, workers(*)')
      .eq('user_id', joseUser.id);

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError.message);
      return;
    }

// // console.log('✅ Asignaciones de José Martínez encontradas:', allAssignments.length);
    allAssignments.forEach(assignment => {
// // console.log(`- ${assignment.workers.name} ${assignment.workers.surname} (${assignment.workers.worker_type || 'No definido'})`);
    });

    // 4. Obtener la asignación específica de Rosa para José
    const rosaAssignment = allAssignments.find(a => a.worker_id === rosaWorkerId);
    if (!rosaAssignment) {
      console.error('❌ No se encontró la asignación de Rosa para José');
      return;
    }

// // console.log('✅ Asignación de Rosa encontrada:', {
      id: rosaAssignment.id,
      schedule: rosaAssignment.schedule,
      hours_per_day: rosaAssignment.hours_per_day
    });

    // 5. Verificar si José tiene servicios en fines de semana y festivos
    const hasWeekendHolidayServices = allAssignments.some(assignment => {
      const worker = assignment.workers;
      return worker.worker_type === 'holiday_weekend' || worker.worker_type === 'both';
    });

// // console.log(`\n📋 Análisis de servicios:`);
// // console.log(`- ¿Tiene servicios en fines de semana/festivos?: ${hasWeekendHolidayServices ? 'SÍ' : 'NO'}`);

    if (hasWeekendHolidayServices) {
      const holidayWorker = allAssignments.find(a => 
        a.workers.worker_type === 'holiday_weekend' || a.workers.worker_type === 'both'
      );
// // console.log(`- Trabajadora de festivos: ${holidayWorker.workers.name} ${holidayWorker.workers.surname}`);
    }

    // 6. Obtener festivos de julio 2025
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

    // 7. Calcular días laborables y festivos
    const year = 2025;
    const month = 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let laborableDays = 0;
    let holidayWeekendDays = 0;
    let laborableHolidayDays = 0; // Días laborables que son festivos
    const holidayDates = holidays.map(h => h.day);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay(); // 0 = domingo, 6 = sábado
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidayDates.includes(day);

      if (isHoliday && !isWeekend) {
        // Es un festivo que cae en día laborable
        laborableHolidayDays++;
        if (hasWeekendHolidayServices) {
          holidayWeekendDays++; // Se cuenta para la trabajadora de festivos
        }
        // NO se cuenta para la trabajadora laborable
      } else if (isHoliday || isWeekend) {
        // Es fin de semana o festivo que cae en fin de semana
        holidayWeekendDays++;
      } else {
        // Es día laborable normal
        laborableDays++;
      }
    }

// // console.log('\n📊 Cálculo de días:');
// // console.log(`- Días laborables normales: ${laborableDays}`);
// // console.log(`- Días festivos laborables: ${laborableHolidayDays}`);
// // console.log(`- Días festivos/fines de semana: ${holidayWeekendDays}`);
// // console.log(`- Total días: ${daysInMonth}`);

    // 8. Calcular horas según la lógica
    let rosaHours, holidayWorkerHours, totalHours;

    if (hasWeekendHolidayServices) {
      // Lógica para usuarios CON servicios en fines de semana/festivos
      rosaHours = laborableDays * 3.5; // Solo días laborables normales
      holidayWorkerHours = holidayWeekendDays * 1.5; // Incluye festivos laborables
      totalHours = rosaHours + holidayWorkerHours;

// // console.log('\n⏰ Cálculo de horas (CON servicios festivos):');
// // console.log(`- Rosa Robles (laborable): ${laborableDays} días × 3.5h = ${rosaHours}h`);
// // console.log(`- Trabajadora festivos: ${holidayWeekendDays} días × 1.5h = ${holidayWorkerHours}h`);
// // console.log(`- TOTAL: ${totalHours}h`);
    } else {
      // Lógica para usuarios SIN servicios en fines de semana/festivos
      rosaHours = laborableDays * 3.5; // Solo días laborables normales (sin festivos)
      holidayWorkerHours = 0; // No hay trabajadora de festivos
      totalHours = rosaHours;

// // console.log('\n⏰ Cálculo de horas (SIN servicios festivos):');
// // console.log(`- Rosa Robles (laborable): ${laborableDays} días × 3.5h = ${rosaHours}h`);
// // console.log(`- Trabajadora festivos: No asignada`);
// // console.log(`- TOTAL: ${totalHours}h`);
// // console.log(`- NOTA: ${laborableHolidayDays} día(s) festivo(s) laborable(s) no se contabilizan`);
    }

    // 9. Detalle de reasignaciones
// // console.log('\n🔄 Detalle de reasignaciones:');
    if (hasWeekendHolidayServices && laborableHolidayDays > 0) {
// // console.log(`- ${laborableHolidayDays} día(s) festivo(s) laborable(s) se reasignan a la trabajadora de festivos`);
      holidayDates.forEach(day => {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // No es fin de semana
// // console.log(`  • ${day}/7 (${['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][dayOfWeek]}): 3.5h → 1.5h`);
        }
      });
    } else if (!hasWeekendHolidayServices && laborableHolidayDays > 0) {
// // console.log(`- ${laborableHolidayDays} día(s) festivo(s) laborable(s) NO se realizan (no hay trabajadora de festivos)`);
      holidayDates.forEach(day => {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // No es fin de semana
// // console.log(`  • ${day}/7 (${['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][dayOfWeek]}): 3.5h → 0h`);
        }
      });
    }

    // 10. Resultado final
// // console.log('\n🎯 RESULTADO FINAL:');
// // console.log(`- Rosa Robles: ${rosaHours}h`);
    if (hasWeekendHolidayServices) {
// // console.log(`- Trabajadora festivos: ${holidayWorkerHours}h`);
    }
// // console.log(`- TOTAL: ${totalHours}h`);

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testRosaJoseCalculation(); 