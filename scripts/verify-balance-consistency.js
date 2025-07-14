const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyBalanceConsistency() {
  console.log('🔍 Verificando consistencia entre sistemas de balance...\n');

  try {
    // 1. Obtener José Martínez específicamente
    const { data: joseMartinez, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('name', 'Jose')
      .eq('surname', 'Martínez Blanquez')
      .single();

    if (userError || !joseMartinez) {
      console.error('❌ No se encontró José Martínez:', userError);
      return;
    }

    console.log(`👤 Usuario: ${joseMartinez.name} ${joseMartinez.surname}`);
    console.log(`📊 Horas mensuales contratadas: ${joseMartinez.monthly_hours}h\n`);

    // 2. Obtener todas las asignaciones de José Martínez
    const { data: joseAssignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        workers:worker_id (id, name, surname),
        users:user_id (id, name, surname, monthly_hours)
      `)
      .eq('user_id', joseMartinez.id)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError);
      return;
    }

    console.log(`📋 Asignaciones activas de José Martínez: ${joseAssignments.length}`);
    joseAssignments.forEach(assignment => {
      const worker = assignment.workers;
      console.log(`   - ${worker.name} ${worker.surname} (${assignment.weekly_hours}h/semana)`);
    });

    // 3. Verificar balances mensuales del panel administrativo
    const currentMonth = 7;
    const currentYear = 2025;

    console.log(`\n📊 Balances mensuales del panel administrativo (${currentMonth}/${currentYear}):`);
    
    const { data: monthlyBalances, error: balancesError } = await supabase
      .from('monthly_balances')
      .select('*')
      .eq('user_id', joseMartinez.id)
      .eq('month', currentMonth)
      .eq('year', currentYear);

    if (balancesError) {
      console.error('❌ Error al obtener balances mensuales:', balancesError);
    } else if (monthlyBalances && monthlyBalances.length > 0) {
      monthlyBalances.forEach(balance => {
        console.log(`   - Trabajadora ID: ${balance.worker_id}`);
        console.log(`     * Horas asignadas: ${balance.assigned_hours}h`);
        console.log(`     * Horas programadas: ${balance.scheduled_hours}h`);
        console.log(`     * Balance: ${balance.balance}h`);
        console.log(`     * Estado: ${balance.status}`);
        console.log(`     * Mensaje: ${balance.message}`);
      });
    } else {
      console.log('   - No hay balances mensuales generados');
    }

    // 4. Calcular balance manual para comparar
    console.log(`\n🧮 Cálculo manual para julio 2025:`);
    
    // Obtener festivos
    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`;
    
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('date, name, type')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_active', true);

    if (holidaysError) {
      console.warn('⚠️ Error al obtener festivos:', holidaysError);
    }

    const holidayDates = new Set((holidays || []).map(h => new Date(h.date).getDate()));
    console.log(`   - Festivos encontrados: ${holidays?.length || 0}`);

    // Calcular días y horas
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    let laborableDays = 0;
    let festivoDays = 0;
    let laborableHours = 0;
    let festivoHours = 0;
    let totalAssignedHours = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const isHoliday = holidayDates.has(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let isFestivo = false;
      if (isHoliday) {
        isFestivo = true;
      } else if (isWeekend) {
        isFestivo = true;
      }

      if (isFestivo) {
        festivoDays++;
      } else {
        laborableDays++;
      }

      // Calcular horas para este día
      joseAssignments.forEach(assignment => {
        if (assignment.schedule && assignment.schedule[isFestivo ? (isHoliday ? 'holiday' : dayName) : dayName]) {
          const daySchedule = assignment.schedule[isFestivo ? (isHoliday ? 'holiday' : dayName) : dayName];
          if (daySchedule?.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
            let dayHours = 0;
            daySchedule.timeSlots.forEach((slot) => {
              const [startHour, startMin] = slot.start.split(':').map(Number);
              const [endHour, endMin] = slot.end.split(':').map(Number);
              const startTime = startHour + startMin / 60;
              const endTime = endHour + endMin / 60;
              dayHours += Math.max(0, endTime - startTime);
            });
            if (isFestivo) {
              festivoHours += dayHours;
            } else {
              laborableHours += dayHours;
            }
            totalAssignedHours += dayHours;
          }
        }
      });
    }

    console.log(`   - Días laborables: ${laborableDays}`);
    console.log(`   - Días festivos: ${festivoDays}`);
    console.log(`   - Horas laborables: ${laborableHours.toFixed(1)}h`);
    console.log(`   - Horas festivas: ${festivoHours.toFixed(1)}h`);
    console.log(`   - Total horas asignadas: ${totalAssignedHours.toFixed(1)}h`);
    console.log(`   - Horas contratadas: ${joseMartinez.monthly_hours}h`);
    console.log(`   - Balance: ${(joseMartinez.monthly_hours - totalAssignedHours).toFixed(1)}h`);

    // 5. Comparar con el sistema de trabajadoras
    console.log(`\n🔄 Comparando con sistema de trabajadoras:`);
    
    // Simular llamada a la API de trabajadoras
    const workerId = joseAssignments[0]?.worker_id;
    if (workerId) {
      console.log(`   - Probando con trabajadora ID: ${workerId}`);
      
      try {
        const response = await fetch(`http://localhost:3000/api/worker/user-balance?workerId=${workerId}&month=${currentMonth}&year=${currentYear}`);
        if (response.ok) {
          const data = await response.json();
          const joseBalance = data.userBalances.find(u => u.userId === joseMartinez.id);
          
          if (joseBalance) {
            console.log(`   ✅ API de trabajadoras responde:`);
            console.log(`     * Horas asignadas: ${joseBalance.assignedHours}h`);
            console.log(`     * Horas realizadas: ${joseBalance.usedHours}h`);
            console.log(`     * Estado: ${joseBalance.status}`);
            console.log(`     * Días laborables: ${joseBalance.holidayInfo.workingDays}`);
            console.log(`     * Días festivos: ${joseBalance.holidayInfo.totalHolidays}`);
            console.log(`     * Horas laborables: ${joseBalance.holidayInfo.workingHours}h`);
            console.log(`     * Horas festivas: ${joseBalance.holidayInfo.holidayHours}h`);
          } else {
            console.log(`   ❌ José Martínez no aparece en el balance de la trabajadora`);
          }
        } else {
          console.log(`   ❌ Error en API de trabajadoras: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Error al llamar API de trabajadoras: ${error.message}`);
      }
    }

    // 6. Recomendaciones
    console.log(`\n💡 Recomendaciones:`);
    console.log(`   1. El panel administrativo debe generar balances basándose en las asignaciones reales`);
    console.log(`   2. El dashboard de trabajadoras debe usar los balances generados por administración`);
    console.log(`   3. Ambos sistemas deben usar la misma lógica de cálculo de días laborables/festivos`);
    console.log(`   4. Los balances deben actualizarse automáticamente cuando cambien las asignaciones`);

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

verifyBalanceConsistency(); 