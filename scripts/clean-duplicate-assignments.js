const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanDuplicateAssignments() {
  try {
    console.log('🧹 Limpiando asignaciones duplicadas...\n');
    
    // 1. Obtener todas las asignaciones
    const { data: allAssignments, error: fetchError } = await supabase
      .from('assignments')
      .select(`
        id,
        user_id,
        worker_id,
        assigned_hours_per_week,
        specific_schedule,
        start_date,
        status,
        created_at,
        users(name, surname),
        workers(name, surname, worker_type)
      `)
      .order('created_at');

    if (fetchError) {
      console.error('Error al obtener asignaciones:', fetchError);
      return;
    }

    console.log(`📊 Total asignaciones encontradas: ${allAssignments.length}`);

    // 2. Identificar duplicaciones
    const duplicates = [];
    const seen = new Set();

    allAssignments.forEach(assignment => {
      const key = `${assignment.user_id}-${assignment.worker_id}`;
      if (seen.has(key)) {
        duplicates.push(assignment);
      } else {
        seen.add(key);
      }
    });

    console.log(`🚨 Asignaciones duplicadas encontradas: ${duplicates.length}`);

    if (duplicates.length === 0) {
      console.log('✅ No hay duplicaciones que limpiar');
      return;
    }

    // 3. Mostrar duplicaciones
    console.log('\n📋 Duplicaciones encontradas:');
    duplicates.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ${assignment.users?.name} ${assignment.users?.surname} → ${assignment.workers?.name} ${assignment.workers?.surname}`);
      console.log(`      ID: ${assignment.id}`);
      console.log(`      Horas/semana: ${assignment.assigned_hours_per_week}h`);
      console.log(`      Creada: ${assignment.created_at}`);
    });

    // 4. Eliminar duplicaciones (mantener la más reciente)
    console.log('\n🗑️ Eliminando duplicaciones...');
    
    const duplicateIds = duplicates.map(d => d.id);
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .in('id', duplicateIds);

    if (deleteError) {
      console.error('❌ Error al eliminar duplicaciones:', deleteError);
      return;
    }

    console.log(`✅ ${duplicates.length} duplicaciones eliminadas`);

    // 5. Verificar resultado
    const { data: remainingAssignments, error: remainingError } = await supabase
      .from('assignments')
      .select(`
        id,
        user_id,
        worker_id,
        assigned_hours_per_week,
        users(name, surname),
        workers(name, surname, worker_type)
      `)
      .order('created_at');

    if (remainingError) {
      console.error('Error al verificar asignaciones restantes:', remainingError);
      return;
    }

    console.log(`\n📊 Asignaciones restantes: ${remainingAssignments.length}`);
    console.log('\n📋 Resumen final de asignaciones:');
    remainingAssignments.forEach(assignment => {
      console.log(`   - ${assignment.users?.name} ${assignment.users?.surname} → ${assignment.workers?.name} ${assignment.workers?.surname}`);
      console.log(`     Horas/semana: ${assignment.assigned_hours_per_week}h`);
    });

    console.log('\n💡 Ahora puedes regenerar los balances sin duplicaciones');

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

cleanDuplicateAssignments(); 