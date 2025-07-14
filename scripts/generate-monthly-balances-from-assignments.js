const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateMonthlyBalancesFromAssignments(year, month) {
  console.log('🔄 Generando balances mensuales por usuario desde asignaciones reales...\n');

  try {
    const currentMonth = month;
    const currentYear = year;

    // 1. Obtener todas las asignaciones activas
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`*, users:user_id (id, name, surname, monthly_hours)`)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError);
      return;
    }

    // 2. Obtener festivos del mes
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

    // 3. Agrupar asignaciones por usuario
    const userAssignmentsMap = new Map();
    assignments.forEach(assignment => {
      const userId = assignment.user_id;
      if (!userAssignmentsMap.has(userId)) {
        userAssignmentsMap.set(userId, {
          user: assignment.users,
          assignments: []
        });
      }
      userAssignmentsMap.get(userId).assignments.push(assignment);
    });

    // 4. Generar balances para cada usuario
    const balancesToInsert = [];
    let processedCount = 0;
    for (const [userId, data] of userAssignmentsMap) {
      const { user, assignments } = data;
      console.log(`\n📊 Procesando usuario: ${user.name} ${user.surname}`);
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      let totalScheduledHours = 0;
      let laborableDays = 0;
      let festivoDays = 0;
      let laborableHours = 0;
      let festivoHours = 0;
      const planning = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth - 1, day);
        const dayOfWeek = date.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        const isHoliday = holidayDates.has(day);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        let isFestivo = isHoliday || isWeekend;
        let dayHours = 0;
        let daySchedule = null;
        assignments.forEach(assignment => {
          if (assignment.schedule) {
            let scheduleKey = null;
            
            // Determinar qué horario usar para este día
            if (isHoliday && assignment.schedule.holiday) {
              scheduleKey = 'holiday';
            } else if (isWeekend && assignment.schedule[dayName]) {
              scheduleKey = dayName;
            } else if (!isHoliday && !isWeekend && assignment.schedule[dayName]) {
              scheduleKey = dayName;
            }

            if (scheduleKey && assignment.schedule[scheduleKey]?.enabled) {
              const schedule = assignment.schedule[scheduleKey];
              if (schedule.timeSlots && schedule.timeSlots.length > 0) {
                daySchedule = schedule;
                schedule.timeSlots.forEach((slot) => {
                  const [startHour, startMin] = slot.start.split(':').map(Number);
                  const [endHour, endMin] = slot.end.split(':').map(Number);
                  const startTime = startHour + startMin / 60;
                  const endTime = endHour + endMin / 60;
                  dayHours += Math.max(0, endTime - startTime);
                });
              }
            }
          }
        });
        if (dayHours > 0) {
          planning.push({
            date: date.toISOString().split('T')[0],
            day: day,
            dayName: dayName,
            hours: dayHours,
            isHoliday: isHoliday,
            isWeekend: isWeekend,
            isFestivo: isFestivo,
            schedule: daySchedule
          });
          totalScheduledHours += dayHours;
          if (isFestivo) {
            festivoDays++;
            festivoHours += dayHours;
          } else {
            laborableDays++;
            laborableHours += dayHours;
          }
        }
      }
      const assignedHours = user.monthly_hours || 0;
      const balance = assignedHours - totalScheduledHours;
      let status;
      if (Math.abs(balance) < 0.1) {
        status = 'perfect';
      } else if (balance > 0) {
        status = 'excess';
      } else {
        status = 'deficit';
      }
      let message;
      if (Math.abs(balance) < 0.1) {
        message = "Las horas asignadas coinciden exactamente con las que se van a consumir este mes.";
      } else if (balance > 0) {
        message = `Este usuario tendrá ${Math.abs(balance).toFixed(1)}h de más. Tendrás ${Math.abs(balance).toFixed(1)}h libres.`;
      } else {
        message = `Este usuario tendrá ${Math.abs(balance).toFixed(1)}h de menos. Tendrás que realizar ${Math.abs(balance).toFixed(1)}h adicionales.`;
      }
      const holidayInfo = {
        totalHolidays: festivoDays,
        holidayHours: Math.round(festivoHours * 10) / 10,
        workingDays: laborableDays,
        workingHours: Math.round(laborableHours * 10) / 10
      };
      const balanceData = {
        user_id: userId,
        worker_id: null, // No relevante en el balance global por usuario
        month: currentMonth,
        year: currentYear,
        assigned_hours: assignedHours,
        scheduled_hours: Math.round(totalScheduledHours * 10) / 10,
        balance: Math.round(balance * 10) / 10,
        status: status,
        message: message,
        planning: planning,
        holiday_info: holidayInfo
      };
      balancesToInsert.push(balanceData);
      console.log(`   ✅ Días laborables: ${laborableDays}, festivos: ${festivoDays}`);
      console.log(`   ✅ Horas laborables: ${laborableHours.toFixed(1)}h, festivas: ${festivoHours.toFixed(1)}h`);
      console.log(`   ✅ Total programado: ${totalScheduledHours.toFixed(1)}h`);
      console.log(`   ✅ Balance: ${balance.toFixed(1)}h (${status})`);
      processedCount++;
    }
    // 5. Insertar balances en la base de datos
    console.log(`\n💾 Insertando ${balancesToInsert.length} balances en la base de datos...`);
    const { data: insertedBalances, error: insertError } = await supabase
      .from('monthly_balances')
      .upsert(balancesToInsert, { onConflict: 'user_id,month,year' })
      .select();
    if (insertError) {
      console.error('❌ Error al insertar balances:', insertError);
      return;
    }
    console.log(`✅ ${insertedBalances.length} balances insertados/actualizados exitosamente`);
    // 6. Mostrar resumen
    console.log(`\n📊 Resumen:`);
    console.log(`   - Total usuarios procesados: ${processedCount}`);
    console.log(`   - Balances insertados: ${insertedBalances.length}`);
    console.log(`   - Mes/Año: ${currentMonth}/${currentYear}`);
    console.log('\n🎉 Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const now = new Date();
  const year = args[0] ? parseInt(args[0], 10) : now.getFullYear();
  const month = args[1] ? parseInt(args[1], 10) : now.getMonth() + 1;
  generateMonthlyBalancesFromAssignments(year, month);
} 