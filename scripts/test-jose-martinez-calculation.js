const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testJoseMartinezCalculation() {
  console.log('🧪 Probando cálculo de horas para José Martínez - Julio 2025\n');

  try {
    // 1. Obtener Jose Martínez Blanquez
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .ilike('name', '%Jose%')
      .ilike('surname', '%Martínez%');

    if (usersError || !users || users.length === 0) {
      console.error('❌ No se encontró José Martínez');
      return;
    }

    const jose = users[0];
    console.log(`👤 Usuario: ${jose.name} ${jose.surname}`);
    console.log(`📊 Horas mensuales asignadas: ${jose.monthly_hours}h\n`);

    // 2. Obtener todas las asignaciones de José Martínez
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        workers:worker_id (
          id,
          name,
          surname,
          worker_type
        )
      `)
      .eq('user_id', jose.id)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError);
      return;
    }

    console.log(`📋 Asignaciones activas encontradas: ${assignments.length}`);
    assignments.forEach(assignment => {
      console.log(`   - ${assignment.workers.name} ${assignment.workers.surname} (${assignment.workers.worker_type})`);
    });

    // 3. Obtener festivos de julio 2025
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('*')
      .gte('date', '2025-07-01')
      .lte('date', '2025-07-31')
      .eq('is_active', true);

    if (holidaysError) {
      console.error('❌ Error al obtener festivos:', holidaysError);
      return;
    }

    console.log(`\n📅 Festivos en julio 2025: ${holidays.length}`);
    holidays.forEach(holiday => {
      const date = new Date(holiday.date);
      const dayOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
      console.log(`   - ${date.getDate()} de julio: ${holiday.name} (${holiday.type}) - ${dayOfWeek}`);
    });

    // 4. Calcular horas por trabajadora
    const julyDays = 31;
    let totalHours = 0;
    let laborableWorkerHours = 0;
    let weekendWorkerHours = 0;

    console.log('\n📊 Cálculo detallado por día:');

    for (let day = 1; day <= julyDays; day++) {
      const date = new Date(2025, 6, day); // Julio es mes 6 (0-indexed)
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Verificar si es festivo
      const isHoliday = holidays.some(h => new Date(h.date).getDate() === day);
      
      console.log(`\n   Día ${day} (${dayName}):`);
      
      if (isHoliday) {
        console.log(`     🎉 FESTIVO: ${holidays.find(h => new Date(h.date).getDate() === day)?.name}`);
      }
      
      // Buscar la asignación correcta según el tipo de día
      let currentAssignment = null;
      let dayKey = dayName;
      
      if (isHoliday) {
        // Para festivos, buscar asignación con día "holiday"
        currentAssignment = assignments.find(a => a.schedule && a.schedule.holiday && a.schedule.holiday.enabled);
        dayKey = 'holiday';
      } else if (isWeekend) {
        // Para fines de semana, buscar asignación con sábado o domingo habilitado
        currentAssignment = assignments.find(a => 
          a.schedule && 
          ((a.schedule.saturday && a.schedule.saturday.enabled) || 
           (a.schedule.sunday && a.schedule.sunday.enabled))
        );
      } else {
        // Para días laborables, buscar asignación con días de semana habilitados
        currentAssignment = assignments.find(a => 
          a.schedule && 
          (a.schedule.monday && a.schedule.monday.enabled) ||
          (a.schedule.tuesday && a.schedule.tuesday.enabled) ||
          (a.schedule.wednesday && a.schedule.wednesday.enabled) ||
          (a.schedule.thursday && a.schedule.thursday.enabled) ||
          (a.schedule.friday && a.schedule.friday.enabled)
        );
      }
      
      if (currentAssignment && currentAssignment.schedule && currentAssignment.schedule[dayKey]) {
        const daySchedule = currentAssignment.schedule[dayKey];
        if (daySchedule?.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
          let dayHours = 0;
          daySchedule.timeSlots.forEach(slot => {
            const [startHour, startMin] = slot.start.split(':').map(Number);
            const [endHour, endMin] = slot.end.split(':').map(Number);
            const startTime = startHour + startMin / 60;
            const endTime = endHour + endMin / 60;
            dayHours += Math.max(0, endTime - startTime);
          });
          
          // Determinar qué trabajadora es
          if (isHoliday || isWeekend) {
            weekendWorkerHours += dayHours;
            console.log(`     👤 Graciela (fines de semana/festivos): ${dayHours}h`);
          } else {
            laborableWorkerHours += dayHours;
            console.log(`     👤 Rosa María (laborables): ${dayHours}h`);
          }
          totalHours += dayHours;
        }
      }
    }

    console.log('\n🎯 RESUMEN FINAL:');
    console.log(`   📊 Total horas asignadas en julio: ${totalHours}h`);
    console.log(`   👤 Horas trabajadora laborables: ${laborableWorkerHours}h`);
    console.log(`   👤 Horas trabajadora fines de semana: ${weekendWorkerHours}h`);
    console.log(`   📋 Horas mensuales asignadas al usuario: ${jose.monthly_hours}h`);
    
    const difference = totalHours - jose.monthly_hours;
    if (difference > 0) {
      console.log(`   ⚠️  EXCESO: ${difference}h por encima de lo asignado`);
    } else if (difference < 0) {
      console.log(`   📋 DÉFICIT: ${Math.abs(difference)}h por debajo de lo asignado`);
    } else {
      console.log(`   ✅ PERFECTO: Horas exactas`);
    }

    console.log('\n💡 Este es el cálculo que debería mostrar el dashboard de la trabajadora.');

  } catch (error) {
    console.error('❌ Error durante el cálculo:', error);
  }
}

testJoseMartinezCalculation(); 