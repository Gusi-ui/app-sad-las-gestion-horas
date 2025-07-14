const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWorkerUserBalance() {
  console.log('🧪 Probando el sistema de balance por usuario (considerando todas las trabajadoras)...\n');

  try {
    // 1. Obtener una trabajadora de prueba
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, email')
      .eq('is_active', true)
      .limit(1);

    if (workersError || !workers || workers.length === 0) {
      console.error('❌ Error al obtener trabajadoras:', workersError);
      return;
    }

    const worker = workers[0];
    console.log(`👤 Trabajadora de prueba: ${worker.name} ${worker.surname} (${worker.email})`);

    // 2. Obtener asignaciones de la trabajadora
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        users:user_id (
          id,
          name,
          surname,
          address,
          phone,
          monthly_hours
        )
      `)
      .eq('worker_id', worker.id)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError);
      return;
    }

    console.log(`📋 Asignaciones encontradas: ${assignments?.length || 0}`);

    if (!assignments || assignments.length === 0) {
      console.log('⚠️  No hay asignaciones activas para esta trabajadora');
      return;
    }

    // 3. Obtener festivos del mes actual
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('date, name, type')
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .eq('is_active', true);

    if (holidaysError) {
      console.warn('⚠️ Error al obtener festivos:', holidaysError);
    }

    const holidayDates = new Set((holidays || []).map(h => new Date(h.date).getDate()));
    console.log(`🎉 Festivos del mes: ${holidayDates.size} días`);

    // 4. Obtener usuarios únicos de las asignaciones de esta trabajadora
    const uniqueUserIds = [...new Set(assignments.map(a => a.user_id))];

    console.log(`\n📊 Calculando balance para ${uniqueUserIds.length} usuarios...\n`);

    let totalAssignedHours = 0;
    let totalUsedHours = 0;

    for (const userId of uniqueUserIds) {
      // Obtener TODAS las asignaciones de este usuario (de todas las trabajadoras)
      const { data: allUserAssignments, error: allAssignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          users:user_id (
            id,
            name,
            surname,
            address,
            phone,
            monthly_hours
          ),
          workers:worker_id (
            id,
            name,
            surname
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (allAssignmentsError) {
        console.error(`Error al obtener todas las asignaciones del usuario ${userId}:`, allAssignmentsError);
        continue;
      }

      const userAssignments = assignments.filter(a => a.user_id === userId);
      const user = userAssignments[0].users;
      if (!user) continue;

      const monthlyHours = user.monthly_hours || 0;
      console.log(`\n👤 Usuario: ${user.name} ${user.surname}`);
      console.log(`   📍 Dirección: ${user.address || 'No especificada'}`);
      console.log(`   📞 Teléfono: ${user.phone || 'No especificado'}`);
      console.log(`   ⏰ Horas mensuales asignadas: ${monthlyHours}h`);
      console.log(`   👥 Trabajadoras asignadas: ${allUserAssignments?.length || 0}`);

      // Calcular horas totales asignadas a este usuario (por todas las trabajadoras)
      let totalAssignedHoursForUser = 0;
      let totalUsedHoursForUser = 0;
      let holidayHours = 0;
      let workingHours = 0;
      let totalHolidays = 0;
      let workingDays = 0;

      // Calcular días del mes
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth - 1, day);
        const dayOfWeek = date.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        const isHoliday = holidayDates.has(day);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isPastDay = date <= currentDate;

        // Verificar si hay servicios en este día (de todas las trabajadoras)
        allUserAssignments?.forEach(assignment => {
          if (assignment.schedule && assignment.schedule[dayName]) {
            const daySchedule = assignment.schedule[dayName];
            if (daySchedule?.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
              let dayHours = 0;
              daySchedule.timeSlots.forEach(slot => {
                const [startHour, startMin] = slot.start.split(':').map(Number);
                const [endHour, endMin] = slot.end.split(':').map(Number);
                const startTime = startHour + startMin / 60;
                const endTime = endHour + endMin / 60;
                dayHours += Math.max(0, endTime - startTime);
              });

              // Contar horas según el tipo de día
              if (isHoliday || isWeekend) {
                holidayHours += dayHours;
                totalHolidays++;
              } else {
                workingHours += dayHours;
                workingDays++;
              }

              // Solo contar como "usadas" si es un día pasado
              if (isPastDay) {
                totalUsedHoursForUser += dayHours;
              }

              // Contar como "asignadas" siempre
              totalAssignedHoursForUser += dayHours;
            }
          }
        });
      }

      // Calcular horas de esta trabajadora específica con este usuario
      let workerAssignedHours = 0;
      let workerUsedHours = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth - 1, day);
        const dayOfWeek = date.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        const isPastDay = date <= currentDate;

        userAssignments.forEach(assignment => {
          if (assignment.schedule && assignment.schedule[dayName]) {
            const daySchedule = assignment.schedule[dayName];
            if (daySchedule?.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
              let dayHours = 0;
              daySchedule.timeSlots.forEach(slot => {
                const [startHour, startMin] = slot.start.split(':').map(Number);
                const [endHour, endMin] = slot.end.split(':').map(Number);
                const startTime = startHour + startMin / 60;
                const endTime = endHour + endMin / 60;
                dayHours += Math.max(0, endTime - startTime);
              });

              if (isPastDay) {
                workerUsedHours += dayHours;
              }
              workerAssignedHours += dayHours;
            }
          }
        });
      }

      // Aplicar la lógica de balance: comparar total de horas asignadas al usuario vs horas realizadas
      const totalRemainingHours = Math.max(0, monthlyHours - totalUsedHoursForUser);
      const totalExcessHours = Math.max(0, totalUsedHoursForUser - monthlyHours);
      
      // Determinar estado basado en el total de horas del usuario
      let status;
      if (Math.abs(totalRemainingHours) < 0.1) {
        status = 'perfect';
      } else if (totalRemainingHours > 0) {
        status = 'deficit';
      } else {
        status = 'excess';
      }

      const percentage = monthlyHours > 0 ? (totalUsedHoursForUser / monthlyHours) * 100 : 0;

      console.log(`   📅 Días laborables: ${workingDays} (${workingHours.toFixed(1)}h)`);
      console.log(`   🎉 Días festivos: ${totalHolidays} (${holidayHours.toFixed(1)}h)`);
      console.log(`   ⏱️  Horas totales asignadas (todas las trabajadoras): ${totalAssignedHoursForUser.toFixed(1)}h`);
      console.log(`   ✅ Horas totales realizadas (todas las trabajadoras): ${totalUsedHoursForUser.toFixed(1)}h`);
      console.log(`   👤 Mis horas con este usuario: ${workerAssignedHours.toFixed(1)}h asignadas / ${workerUsedHours.toFixed(1)}h realizadas`);
      console.log(`   📊 Porcentaje completado: ${percentage.toFixed(1)}%`);
      console.log(`   ${status === 'excess' ? '⚠️' : status === 'deficit' ? '📋' : '✅'} Estado: ${status}`);
      
      if (totalRemainingHours > 0) {
        console.log(`   📋 Horas pendientes en total: ${totalRemainingHours.toFixed(1)}h`);
      } else if (totalExcessHours > 0) {
        console.log(`   ⚠️  Exceso de horas en total: ${totalExcessHours.toFixed(1)}h (no se realizarán)`);
      } else {
        console.log(`   ✅ Balance perfecto`);
      }

      totalAssignedHours += workerAssignedHours;
      totalUsedHours += workerUsedHours;
    }

    const totalRemainingHours = totalAssignedHours - totalUsedHours;
    
    console.log(`\n🎯 RESUMEN GENERAL:`);
    console.log(`   👤 Trabajadora: ${worker.name} ${worker.surname}`);
    console.log(`   📊 Total mis horas asignadas: ${totalAssignedHours.toFixed(1)}h`);
    console.log(`   ✅ Total mis horas realizadas: ${totalUsedHours.toFixed(1)}h`);
    console.log(`   ${totalRemainingHours > 0 ? '📋' : '⚠️'} Total mis horas ${totalRemainingHours > 0 ? 'pendientes' : 'de exceso'}: ${Math.abs(totalRemainingHours).toFixed(1)}h`);

    console.log('\n✅ Prueba completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

testWorkerUserBalance(); 