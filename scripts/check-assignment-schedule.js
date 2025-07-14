const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAssignmentSchedule() {
  console.log('🔍 Verificando estructura de horarios en asignaciones...\n');

  try {
    // Obtener Jose Martínez
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .ilike('name', '%Jose%')
      .ilike('surname', '%Martínez%');

    if (usersError || !users || users.length === 0) {
      console.error('❌ No se encontró Jose Martínez');
      return;
    }

    const jose = users[0];
    console.log(`👤 Usuario: ${jose.name} ${jose.surname}\n`);

    // Obtener asignaciones
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', jose.id)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError);
      return;
    }

    console.log(`📋 Asignaciones encontradas: ${assignments.length}\n`);

    assignments.forEach((assignment, index) => {
      console.log(`\n${index + 1}. Asignación ID: ${assignment.id}`);
      console.log(`   Worker ID: ${assignment.worker_id}`);
      console.log(`   Status: ${assignment.status}`);
      console.log(`   Schedule:`, JSON.stringify(assignment.schedule, null, 2));
      
      // Verificar si schedule tiene la estructura esperada
      if (assignment.schedule) {
        console.log(`   📊 Estructura del schedule:`);
        Object.keys(assignment.schedule).forEach(day => {
          const daySchedule = assignment.schedule[day];
          console.log(`     ${day}:`, JSON.stringify(daySchedule, null, 4));
        });
      } else {
        console.log(`   ⚠️  No hay schedule definido`);
      }
    });

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

checkAssignmentSchedule(); 