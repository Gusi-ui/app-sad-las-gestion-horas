const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno desde el archivo .env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkJoseSchedule() {
  try {
// // console.log('🔍 Verificando horario específico de Jose Martínez\n');

    const joseUserId = '9af4d980-414c-4e9b-8400-3f6021755d45';
    
    // Obtener asignaciones de Jose
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*, workers(*)')
      .eq('user_id', joseUserId);

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError.message);
      return;
    }

    assignments.forEach(assignment => {
// // console.log(`📋 Asignación: ${assignment.workers.name} ${assignment.workers.surname}`);
// // console.log(`   ID: ${assignment.id}`);
// // console.log(`   Horario específico:`);
      
      if (assignment.specific_schedule) {
        Object.entries(assignment.specific_schedule).forEach(([day, schedule]) => {
          if (Array.isArray(schedule) && schedule.length > 0) {
// // console.log(`   ${day}:`);
            schedule.forEach((slot, index) => {
              if (typeof slot === 'string') {
// // console.log(`     Tramo ${index + 1}: ${slot}`);
              } else if (typeof slot === 'object' && slot.start && slot.end) {
// // console.log(`     Tramo ${index + 1}: ${slot.start} - ${slot.end}`);
              }
            });
            
            // Calcular horas del día
            let dayHours = 0;
            if (typeof schedule[0] === 'string' && typeof schedule[1] === 'string') {
              // Formato antiguo: ["09:00", "12:30"]
              const start = schedule[0];
              const end = schedule[1];
              const startHour = parseInt(start.split(':')[0]) + parseInt(start.split(':')[1]) / 60;
              const endHour = parseInt(end.split(':')[0]) + parseInt(end.split(':')[1]) / 60;
              dayHours = Math.max(0, endHour - startHour);
            } else if (typeof schedule[0] === 'object') {
              // Formato nuevo: [{start: "09:00", end: "12:30"}]
              schedule.forEach(slot => {
                const startHour = parseInt(slot.start.split(':')[0]) + parseInt(slot.start.split(':')[1]) / 60;
                const endHour = parseInt(slot.end.split(':')[0]) + parseInt(slot.end.split(':')[1]) / 60;
                dayHours += Math.max(0, endHour - startHour);
              });
            }
// // console.log(`     Total horas: ${dayHours}h`);
          }
        });
      } else {
// // console.log('   No hay horario específico configurado');
      }
// // console.log('');
    });

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkJoseSchedule(); 