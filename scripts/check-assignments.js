const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAssignments() {
  try {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        workers(name, surname, worker_type),
        users(name, surname)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error:', error);
      return;
    }

// // console.log('Últimas asignaciones creadas:');
// // console.log('==============================');
    
    assignments.forEach((assignment, index) => {
// // console.log(`\n${index + 1}. Asignación ID: ${assignment.id}`);
// // console.log(`   Usuario: ${assignment.users.name} ${assignment.users.surname}`);
// // console.log(`   Trabajadora: ${assignment.workers.name} ${assignment.workers.surname} (${assignment.workers.worker_type})`);
// // console.log(`   Horas por semana: ${assignment.assigned_hours_per_week}h`);
// // console.log(`   Estado: ${assignment.status}`);
// // console.log(`   Fecha inicio: ${assignment.start_date}`);
      
      if (assignment.specific_schedule && Object.keys(assignment.specific_schedule).length > 0) {
// // console.log(`   Horarios específicos:`);
        Object.entries(assignment.specific_schedule).forEach(([day, slots]) => {
          if (slots && slots.length > 0) {
            const dayNames = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };
// // console.log(`     ${dayNames[day]}: ${slots.join(', ')}`);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAssignments(); 