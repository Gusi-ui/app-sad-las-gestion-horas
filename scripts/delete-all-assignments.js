const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAllAssignments() {
  try {
// // console.log('🗑️ Eliminando todas las asignaciones de la base de datos...\n');
    
    // 1. Obtener todas las asignaciones antes de eliminar
    const { data: allAssignments, error: fetchError } = await supabase
      .from('assignments')
      .select(`
        id,
        user_id,
        worker_id,
        assigned_hours_per_week,
        users(name, surname),
        workers(name, surname)
      `);

    if (fetchError) {
      console.error('Error al obtener asignaciones:', fetchError);
      return;
    }

// // console.log(`📊 Asignaciones encontradas: ${allAssignments?.length || 0}`);
    
    if (allAssignments && allAssignments.length > 0) {
// // console.log('\n📋 Asignaciones que se van a eliminar:');
      allAssignments.forEach((assignment, index) => {
// // console.log(`   ${index + 1}. ${assignment.users?.name} ${assignment.users?.surname} → ${assignment.workers?.name} ${assignment.workers?.surname}`);
// // console.log(`      Horas/semana: ${assignment.assigned_hours_per_week}h`);
// // console.log(`      ID: ${assignment.id}`);
      });
    } else {
// // console.log('✅ No hay asignaciones para eliminar');
      return;
    }

    // 2. Eliminar todas las asignaciones
// // console.log('\n🗑️ Procediendo con la eliminación...');
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todas

    if (deleteError) {
      console.error('❌ Error al eliminar asignaciones:', deleteError);
      return;
    }

// // console.log(`✅ ${allAssignments.length} asignaciones eliminadas correctamente`);

    // 3. Verificar que se eliminaron
    const { data: remainingAssignments, error: verifyError } = await supabase
      .from('assignments')
      .select('id');

    if (verifyError) {
      console.error('Error al verificar eliminación:', verifyError);
      return;
    }

// // console.log(`📊 Asignaciones restantes: ${remainingAssignments?.length || 0}`);
    
    if (remainingAssignments && remainingAssignments.length > 0) {
// // console.log('⚠️  Aún quedan asignaciones en la base de datos');
    } else {
// // console.log('✅ Todas las asignaciones han sido eliminadas');
    }

    // 4. También eliminar balances de julio 2025 para empezar limpio
// // console.log('\n🗑️ Eliminando balances de julio 2025...');
    const { error: balanceDeleteError } = await supabase
      .from('monthly_hours')
      .delete()
      .eq('year', 2025)
      .eq('month', 7);

    if (balanceDeleteError) {
      console.error('Error al eliminar balances:', balanceDeleteError);
    } else {
// // console.log('✅ Balances de julio 2025 eliminados');
    }

// // console.log('\n🎉 Base de datos limpia y lista para datos reales');
// // console.log('💡 Ahora puedes crear asignaciones reales desde la interfaz de administración');

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

deleteAllAssignments(); 