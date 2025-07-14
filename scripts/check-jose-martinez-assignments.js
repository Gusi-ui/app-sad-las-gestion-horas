const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkJoseMartinezAssignments() {
  console.log('🔍 Verificando asignaciones de José Martínez...\n');

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
      .eq('user_id', joseMartinez.id);

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError);
      return;
    }

    console.log(`📋 Total asignaciones de José Martínez: ${joseAssignments.length}`);
    
    joseAssignments.forEach((assignment, index) => {
      const worker = assignment.workers;
      console.log(`\n   ${index + 1}. ${worker.name} ${worker.surname}`);
      console.log(`      - Estado: ${assignment.status}`);
      console.log(`      - Tipo: ${assignment.assignment_type || 'No especificado'}`);
      console.log(`      - Horas semanales: ${assignment.weekly_hours}h`);
      console.log(`      - Fecha inicio: ${assignment.start_date}`);
      console.log(`      - Fecha fin: ${assignment.end_date || 'Sin fecha fin'}`);
      
      if (assignment.schedule) {
        console.log(`      - Horario:`);
        Object.entries(assignment.schedule).forEach(([day, schedule]) => {
          if (schedule?.enabled) {
            const hours = schedule.timeSlots?.reduce((sum, slot) => {
              const [startHour, startMin] = slot.start.split(':').map(Number);
              const [endHour, endMin] = slot.end.split(':').map(Number);
              const startTime = startHour + startMin / 60;
              const endTime = endHour + endMin / 60;
              return sum + Math.max(0, endTime - startTime);
            }, 0) || 0;
            console.log(`        * ${day}: ${hours.toFixed(1)}h`);
          }
        });
      }
    });

    // 3. Verificar qué tipos de asignación faltan
    const assignmentTypes = joseAssignments.map(a => a.assignment_type).filter(Boolean);
    console.log(`\n📊 Tipos de asignación actuales: ${assignmentTypes.join(', ') || 'Ninguno especificado'}`);

    const missingTypes = [];
    if (!assignmentTypes.includes('laborables')) {
      missingTypes.push('laborables');
    }
    if (!assignmentTypes.includes('festivos')) {
      missingTypes.push('festivos');
    }

    if (missingTypes.length > 0) {
      console.log(`❌ Tipos de asignación faltantes: ${missingTypes.join(', ')}`);
    } else {
      console.log(`✅ Todos los tipos de asignación están cubiertos`);
    }

    // 4. Calcular horas totales necesarias
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
    
    let laborableDays = 0;
    let festivoDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = date.getDay();
      const isHoliday = holidayDates.has(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (isHoliday || isWeekend) {
        festivoDays++;
      } else {
        laborableDays++;
      }
    }

    console.log(`\n📅 Julio 2025:`);
    console.log(`   - Días laborables: ${laborableDays}`);
    console.log(`   - Días festivos: ${festivoDays}`);
    console.log(`   - Horas contratadas: ${joseMartinez.monthly_hours}h`);
    console.log(`   - Horas necesarias por día laborable: ${(joseMartinez.monthly_hours / laborableDays).toFixed(1)}h`);
    console.log(`   - Horas necesarias por día festivo: ${(joseMartinez.monthly_hours / festivoDays).toFixed(1)}h`);

    // 5. Recomendaciones
    console.log(`\n💡 Recomendaciones:`);
    if (missingTypes.includes('laborables')) {
      console.log(`   1. Crear asignación de tipo 'laborables' para cubrir ${laborableDays} días laborables`);
    }
    if (missingTypes.includes('festivos')) {
      console.log(`   2. Crear asignación de tipo 'festivos' para cubrir ${festivoDays} días festivos`);
    }
    console.log(`   3. Asegurar que las horas semanales cubran las necesidades mensuales`);
    console.log(`   4. Verificar que las trabajadoras tengan horarios configurados correctamente`);

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

checkJoseMartinezAssignments(); 