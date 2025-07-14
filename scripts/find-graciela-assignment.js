const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findGracielaAssignment() {
  try {
// // console.log('🔍 Buscando asignación de Graciela...');
    
    // Buscar trabajadora Graciela
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname')
      .ilike('name', '%graciela%');

    if (workersError) {
      console.error('❌ Error al buscar trabajadoras:', workersError);
      return;
    }

// // console.log('👥 Trabajadoras encontradas:');
    workers.forEach(worker => {
// // console.log(`  - ${worker.name} ${worker.surname} (ID: ${worker.id})`);
    });

    if (workers.length === 0) {
// // console.log('❌ No se encontró ninguna trabajadora llamada Graciela');
      return;
    }

    // Buscar asignaciones de Graciela
    const gracielaId = workers[0].id;
// // console.log(`\n🔍 Buscando asignaciones de ${workers[0].name} ${workers[0].surname}...`);
    
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        worker:workers(name, surname),
        user:users(name, surname)
      `)
      .eq('worker_id', gracielaId);

    if (assignmentsError) {
      console.error('❌ Error al buscar asignaciones:', assignmentsError);
      return;
    }

// // console.log(`📋 Asignaciones encontradas: ${assignments.length}`);
    assignments.forEach(assignment => {
// // console.log(`\n  🆔 ID: ${assignment.id}`);
// // console.log(`  👤 Trabajadora: ${assignment.worker?.name} ${assignment.worker?.surname}`);
// // console.log(`  👥 Usuario: ${assignment.user?.name} ${assignment.user?.surname}`);
// // console.log(`  📅 Fecha inicio: ${assignment.start_date}`);
// // console.log(`  📅 Fecha fin: ${assignment.end_date || 'Sin fecha fin'}`);
// // console.log(`  🏷️  Tipo: ${assignment.assignment_type || 'NULL'}`);
// // console.log(`  📊 Estado: ${assignment.status}`);
// // console.log(`  ⏰ Horas/semana: ${assignment.assigned_hours_per_week}`);
    });

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la función
findGracielaAssignment(); 