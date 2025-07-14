#!/usr/bin/env node

/**
 * Script para probar el cálculo específico de Rosa Robles en julio 2025
 * Verifica que las horas sean correctas: 22 días laborables (77h) + 9 días festivos (13.5h) = 90.5h total
 */

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
// // // console.log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
// // // console.log('URL actual:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
// // // console.log('KEY actual:', supabaseKey ? '✅ Configurada' : '❌ Faltante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRosaRoblesCalculation() {
// // // console.log('🧮 Probando cálculo de Rosa Robles - Julio 2025\n');

  try {
    // 1. Buscar a Rosa Robles
// // // console.log('1. Buscando a Rosa Robles...');
    const { data: rosaWorker, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .ilike('name', '%rosa%')
      .ilike('surname', '%robles%')
      .single();

    if (workerError || !rosaWorker) {
      console.error('❌ No se encontró a Rosa Robles:', workerError?.message);
      return;
    }

// // // console.log(`✅ Encontrada: ${rosaWorker.name} ${rosaWorker.surname} (ID: ${rosaWorker.id})`);

    // 2. Buscar a José Martínez por ID proporcionado
    const joseUserId = '9af4d980-414c-4e9b-8400-3f6021755d45';
// // // console.log(`\n2. Usando ID de José Martínez proporcionado: ${joseUserId}`);
    const { data: joseUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', joseUserId)
      .single();

    if (userError || !joseUser) {
      console.error('❌ No se encontró a José Martínez:', userError?.message);
      return;
    }

// // // console.log(`✅ Encontrado: ${joseUser.name} ${joseUser.surname} (ID: ${joseUser.id})`);

    // 3. Obtener asignaciones de José Martínez
// // // console.log('\n3. Obteniendo asignaciones de José Martínez...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        workers:worker_id (
          id,
          name,
          surname,
          worker_type
        ),
        users:user_id (
          id,
          name,
          surname,
          monthly_hours
        )
      `)
      .eq('user_id', joseUser.id)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('❌ Error obteniendo asignaciones:', assignmentsError.message);
      return;
    }

// // // console.log(`✅ Encontradas ${assignments.length} asignaciones activas`);
    assignments.forEach(a => {
// // // console.log(`   - ${a.workers?.name} ${a.workers?.surname} (${a.workers?.worker_type || 'sin tipo'})`);
    });

    // 4. Obtener festivos de julio 2025
// // // console.log('\n4. Obteniendo festivos de julio 2025...');
    const { data: holidays, error: holidaysError } = await supabase
      .from('local_holidays')
      .select('*')
      .eq('year', 2025)
      .eq('month', 7);

    if (holidaysError) {
      console.error('❌ Error obteniendo festivos:', holidaysError.message);
      return;
    }

// // // console.log(`✅ Encontrados ${holidays.length} festivos en julio 2025:`);
    holidays.forEach(h => // // console.log(`   - ${h.day}/${h.month}: ${h.name}`));

    // 5. Simular cálculo manual
// // // console.log('\n5. Calculando horas manualmente...');
    
    const month = 7;
    const year = 2025;
    const daysInMonth = new Date(year, month, 0).getDate();
    const holidayDates = new Set(holidays.map(h => `${year}-${month.toString().padStart(2, '0')}-${h.day.toString().padStart(2, '0')}`));
    
    let laborableDays = 0;
    let laborableHours = 0;
    let holidayDays = 0;
    let holidayHours = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const isHoliday = holidayDates.has(dateStr);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Buscar servicios en este día
      let hasService = false;
      let serviceHours = 0;
      let workerName = '';

      for (const assignment of assignments) {
        const daySchedule = assignment.specific_schedule?.[dayName];
        if (daySchedule && Array.isArray(daySchedule) && daySchedule.length > 0) {
          hasService = true;
          workerName = `${assignment.workers?.name} ${assignment.workers?.surname}`;
          
          // Calcular horas del servicio
          if (typeof daySchedule[0] === 'string' && typeof daySchedule[1] === 'string') {
            const start = daySchedule[0];
            const end = daySchedule[1];
            const startHour = parseInt(start.split(':')[0]) + parseInt(start.split(':')[1]) / 60;
            const endHour = parseInt(end.split(':')[0]) + parseInt(end.split(':')[1]) / 60;
            serviceHours = Math.max(0, endHour - startHour);
          }
          break; // Solo contar el primer servicio del día
        }
      }

      if (hasService) {
        if (isHoliday || isWeekend) {
          holidayDays++;
          holidayHours += 1.5; // Horas fijas para festivos/fines de semana
// // // console.log(`   Día ${day}: ${isHoliday ? 'FESTIVO' : 'FIN DE SEMANA'} - ${workerName} - 1.5h (reasignado)`);
        } else {
          laborableDays++;
          laborableHours += serviceHours; // Horas reales del servicio
// // // console.log(`   Día ${day}: LABORABLE - ${workerName} - ${serviceHours.toFixed(1)}h`);
        }
      }
    }

// // // console.log('\n📊 RESULTADO DEL CÁLCULO MANUAL:');
// // // console.log(`   Días laborables: ${laborableDays} días, ${laborableHours.toFixed(1)} horas`);
// // // console.log(`   Días festivos/fines de semana: ${holidayDays} días, ${holidayHours.toFixed(1)} horas`);
// // // console.log(`   TOTAL: ${(laborableDays + holidayDays)} días, ${(laborableHours + holidayHours).toFixed(1)} horas`);

    // 6. Comparar con el resultado esperado
// // // console.log('\n🎯 COMPARACIÓN CON RESULTADO ESPERADO:');
// // // console.log(`   Esperado: 22 días laborables (77h) + 9 días festivos (13.5h) = 90.5h total`);
// // // console.log(`   Calculado: ${laborableDays} días laborables (${laborableHours.toFixed(1)}h) + ${holidayDays} días festivos (${holidayHours.toFixed(1)}h) = ${(laborableHours + holidayHours).toFixed(1)}h total`);
    
    const expectedTotal = 90.5;
    const calculatedTotal = laborableHours + holidayHours;
    const difference = Math.abs(expectedTotal - calculatedTotal);
    
    if (difference < 0.1) {
// // // console.log('✅ ¡CÁLCULO CORRECTO! La diferencia es menor a 0.1 horas');
    } else {
// // // console.log(`❌ CÁLCULO INCORRECTO. Diferencia: ${difference.toFixed(1)} horas`);
// // // console.log('\n🔍 Posibles causas:');
// // // console.log('   - Horarios de servicios no coinciden con lo esperado');
// // // console.log('   - Festivos no detectados correctamente');
// // // console.log('   - Lógica de reasignación no aplicada');
    }

    // 7. Probar la nueva lógica de reasignación
// // // console.log('\n🔄 Probando nueva lógica de reasignación...');
    try {
      const { generateMonthlyPlanningWithHolidayReassignment } = require('../src/lib/holidayReassignment');
      
      const planningResult = await generateMonthlyPlanningWithHolidayReassignment(
        assignments,
        joseUser.id,
        month,
        year
      );

      const totalPlanningHours = planningResult.planning.reduce((sum, day) => sum + day.hours, 0);
// // // console.log(`   Horas totales con reasignación: ${totalPlanningHours.toFixed(1)}h`);
// // // console.log(`   Reasignaciones detectadas: ${planningResult.reassignments.length}`);
      
      if (planningResult.reassignments.length > 0) {
// // // console.log('   Detalles de reasignaciones:');
        planningResult.reassignments.forEach(r => {
// // // console.log(`     ${r.date}: ${r.originalWorkerName} → ${r.reassignedWorkerName} (${r.originalHours}h → ${r.reassignedHours}h)`);
        });
      }

      const planningDifference = Math.abs(expectedTotal - totalPlanningHours);
      if (planningDifference < 0.1) {
// // // console.log('✅ ¡LÓGICA DE REASIGNACIÓN CORRECTA!');
      } else {
// // // console.log(`❌ LÓGICA DE REASIGNACIÓN INCORRECTA. Diferencia: ${planningDifference.toFixed(1)}h`);
      }

    } catch (error) {
      console.error('❌ Error probando lógica de reasignación:', error.message);
    }

  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
}

if (require.main === module) {
  testRosaRoblesCalculation();
}

module.exports = { testRosaRoblesCalculation }; 