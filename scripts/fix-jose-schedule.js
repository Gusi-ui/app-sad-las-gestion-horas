const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno desde el archivo .env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixJoseSchedule() {
  try {
// // console.log('🔧 Corrigiendo horario de Jose Martínez\n');

    const joseUserId = '9af4d980-414c-4e9b-8400-3f6021755d45';
    const rosaWorkerId = '1661b7b6-20d1-4eab-bdd3-462e9603d27a';
    
    // Horario correcto: 3.5 horas en dos tramos
    const correctSchedule = {
      monday: [
        { start: "08:00", end: "09:30" },    // 1.5 horas
        { start: "13:00", end: "15:00" }     // 2.0 horas
      ],
      tuesday: [
        { start: "08:00", end: "09:30" },
        { start: "13:00", end: "15:00" }
      ],
      wednesday: [
        { start: "08:00", end: "09:30" },
        { start: "13:00", end: "15:00" }
      ],
      thursday: [
        { start: "08:00", end: "09:30" },
        { start: "13:00", end: "15:00" }
      ],
      friday: [
        { start: "08:00", end: "09:30" },
        { start: "13:00", end: "15:00" }
      ],
      saturday: [],
      sunday: []
    };

// // console.log('📋 Horario correcto a aplicar:');
    Object.entries(correctSchedule).forEach(([day, slots]) => {
      if (slots.length > 0) {
// // console.log(`   ${day}:`);
        slots.forEach((slot, index) => {
          const startHour = parseInt(slot.start.split(':')[0]) + parseInt(slot.start.split(':')[1]) / 60;
          const endHour = parseInt(slot.end.split(':')[0]) + parseInt(slot.end.split(':')[1]) / 60;
          const duration = endHour - startHour;
// // console.log(`     Tramo ${index + 1}: ${slot.start} - ${slot.end} (${duration}h)`);
        });
        const totalDayHours = slots.reduce((sum, slot) => {
          const startHour = parseInt(slot.start.split(':')[0]) + parseInt(slot.start.split(':')[1]) / 60;
          const endHour = parseInt(slot.end.split(':')[0]) + parseInt(slot.end.split(':')[1]) / 60;
          return sum + (endHour - startHour);
        }, 0);
// // console.log(`     Total: ${totalDayHours}h`);
      }
    });

    // Actualizar la asignación
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('worker_id', rosaWorkerId)
      .eq('user_id', joseUserId)
      .single();

    if (assignmentError) {
      console.error('❌ Error al obtener la asignación:', assignmentError.message);
      return;
    }

// // console.log(`\n🔄 Actualizando asignación ID: ${assignment.id}`);

    const { data: updateResult, error: updateError } = await supabase
      .from('assignments')
      .update({
        specific_schedule: correctSchedule,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment.id)
      .select();

    if (updateError) {
      console.error('❌ Error al actualizar:', updateError.message);
      return;
    }

// // console.log('✅ Horario actualizado correctamente');
// // console.log('Resultado:', updateResult[0]);

    // Verificar el resultado
// // console.log('\n🔍 Verificando resultado:');
    const updatedSchedule = updateResult[0].specific_schedule;
    Object.entries(updatedSchedule).forEach(([day, slots]) => {
      if (Array.isArray(slots) && slots.length > 0) {
// // console.log(`   ${day}:`);
        slots.forEach((slot, index) => {
// // console.log(`     Tramo ${index + 1}: ${slot.start} - ${slot.end}`);
        });
        
        // Calcular horas totales del día
        const totalDayHours = slots.reduce((sum, slot) => {
          const startHour = parseInt(slot.start.split(':')[0]) + parseInt(slot.start.split(':')[1]) / 60;
          const endHour = parseInt(slot.end.split(':')[0]) + parseInt(slot.end.split(':')[1]) / 60;
          return sum + (endHour - startHour);
        }, 0);
// // console.log(`     Total horas: ${totalDayHours}h`);
      }
    });

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

fixJoseSchedule(); 