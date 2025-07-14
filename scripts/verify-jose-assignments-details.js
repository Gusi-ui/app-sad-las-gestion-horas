const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyJoseAssignmentsDetails() {
  console.log('🔍 Verificando en detalle las asignaciones de José Martínez...\n');

  try {
    // 1. Obtener José Martínez
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
        workers:worker_id (id, name, surname)
      `)
      .eq('user_id', joseMartinez.id)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError);
      return;
    }

    console.log(`📋 Asignaciones activas de José Martínez: ${joseAssignments.length}\n`);

    // 3. Analizar cada asignación en detalle
    joseAssignments.forEach((assignment, index) => {
      const worker = assignment.workers;
      console.log(`📋 Asignación ${index + 1}: ${worker.name} ${worker.surname}`);
      console.log(`   - ID: ${assignment.id}`);
      console.log(`   - Tipo: ${assignment.assignment_type || 'No especificado'}`);
      console.log(`   - Horas semanales configuradas: ${assignment.weekly_hours}h`);
      console.log(`   - Fecha inicio: ${assignment.start_date}`);
      console.log(`   - Fecha fin: ${assignment.end_date || 'Sin fecha fin'}`);
      console.log(`   - Notas: ${assignment.notes || 'Sin notas'}`);
      
      if (assignment.schedule) {
        console.log(`   - Horario detallado:`);
        let totalWeeklyHours = 0;
        Object.entries(assignment.schedule).forEach(([day, schedule]) => {
          if (schedule?.enabled) {
            const hours = schedule.timeSlots?.reduce((sum, slot) => {
              const [startHour, startMin] = slot.start.split(':').map(Number);
              const [endHour, endMin] = slot.end.split(':').map(Number);
              const startTime = startHour + startMin / 60;
              const endTime = endHour + endMin / 60;
              return sum + Math.max(0, endTime - startTime);
            }, 0) || 0;
            totalWeeklyHours += hours;
            console.log(`     * ${day}: ${hours.toFixed(1)}h`);
            schedule.timeSlots?.forEach(slot => {
              console.log(`       - ${slot.start} - ${slot.end}`);
            });
          }
        });
        console.log(`     * Total horas semanales calculadas: ${totalWeeklyHours.toFixed(1)}h`);
        
        if (Math.abs(totalWeeklyHours - assignment.weekly_hours) > 0.1) {
          console.log(`     ⚠️ DISCREPANCIA: Horas configuradas (${assignment.weekly_hours}h) vs calculadas (${totalWeeklyHours.toFixed(1)}h)`);
        }
      }
      console.log('');
    });

    // 4. Calcular necesidades reales para julio 2025
    const currentMonth = 7;
    const currentYear = 2025;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // Obtener festivos
    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${daysInMonth}`;
    
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('date, name, type')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_active', true);

    const holidayDates = new Set((holidays || []).map(h => new Date(h.date).getDate()));
    
    console.log(`📅 Análisis de julio 2025:`);
    console.log(`   - Días totales: ${daysInMonth}`);
    console.log(`   - Festivos encontrados: ${holidays?.length || 0}`);
    
    let laborableDays = 0;
    let festivoDays = 0;
    const dayDetails = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = date.getDay();
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const isHoliday = holidayDates.has(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const holidayName = holidays?.find(h => new Date(h.date).getDate() === day)?.name;

      let dayType = 'laborable';
      if (isHoliday) {
        dayType = 'festivo';
        festivoDays++;
      } else if (isWeekend) {
        dayType = 'festivo';
        festivoDays++;
      } else {
        laborableDays++;
      }

      dayDetails.push({
        day,
        date: date.toISOString().split('T')[0],
        dayName: dayNames[dayOfWeek],
        type: dayType,
        isHoliday,
        isWeekend,
        holidayName
      });
    }

    console.log(`   - Días laborables: ${laborableDays}`);
    console.log(`   - Días festivos: ${festivoDays}`);
    console.log(`   - Horas contratadas: ${joseMartinez.monthly_hours}h`);
    console.log(`   - Horas necesarias por día laborable: ${(joseMartinez.monthly_hours / laborableDays).toFixed(1)}h`);
    console.log(`   - Horas necesarias por día festivo: ${(joseMartinez.monthly_hours / festivoDays).toFixed(1)}h`);

    // 5. Mostrar festivos específicos
    console.log(`\n🎉 Festivos de julio 2025:`);
    dayDetails.filter(d => d.isHoliday).forEach(day => {
      console.log(`   - ${day.day}/${currentMonth}: ${day.holidayName || 'Fin de semana'} (${day.dayName})`);
    });

    // 6. Calcular horas correctas necesarias
    console.log(`\n🧮 Cálculo de horas correctas:`);
    
    // Horas por día laborable (distribuir las 86h entre días laborables)
    const hoursPerLaborableDay = joseMartinez.monthly_hours / laborableDays;
    const weeklyLaborableHours = hoursPerLaborableDay * 5; // 5 días laborables por semana
    
    // Horas por día festivo (distribuir las 86h entre días festivos)
    const hoursPerFestivoDay = joseMartinez.monthly_hours / festivoDays;
    const weeklyFestivoHours = hoursPerFestivoDay * 2; // 2 días festivos por semana (aproximado)
    
    console.log(`   Para días laborables:`);
    console.log(`     - Horas por día laborable: ${hoursPerLaborableDay.toFixed(1)}h`);
    console.log(`     - Horas semanales necesarias: ${weeklyLaborableHours.toFixed(1)}h`);
    console.log(`     - Total mensual laborables: ${(hoursPerLaborableDay * laborableDays).toFixed(1)}h`);
    
    console.log(`   Para días festivos:`);
    console.log(`     - Horas por día festivo: ${hoursPerFestivoDay.toFixed(1)}h`);
    console.log(`     - Horas semanales necesarias: ${weeklyFestivoHours.toFixed(1)}h`);
    console.log(`     - Total mensual festivos: ${(hoursPerFestivoDay * festivoDays).toFixed(1)}h`);

    // 7. Recomendaciones
    console.log(`\n💡 Recomendaciones:`);
    console.log(`   1. Revisar y corregir las horas semanales en las asignaciones`);
    console.log(`   2. Asegurar que los horarios coincidan con las horas configuradas`);
    console.log(`   3. Considerar que los festivos pueden variar por mes`);
    console.log(`   4. Implementar lógica dinámica para calcular horas según festivos reales`);

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

verifyJoseAssignmentsDetails(); 