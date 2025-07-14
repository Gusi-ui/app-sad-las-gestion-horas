const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupTestData() {
// // console.log('🧹 LIMPIEZA DE DATOS DE PRUEBA');
// // console.log('='.repeat(50));

  try {
    // =====================================================
    // 1. LIMPIAR HISTORIAL DE PRUEBA
    // =====================================================
// // console.log('\n1️⃣ Limpiando historial de prueba...');
    
    const { data: testHistory, error: historyError } = await supabase
      .from('assignment_history')
      .select('id, change_reason')
      .or('change_reason.like.*test*,change_reason.like.*prueba*,changed_by.eq.00000000-0000-0000-0000-000000000000');

    if (historyError) {
// // console.log('⚠️ Error al consultar historial de prueba:', historyError.message);
    } else if (testHistory && testHistory.length > 0) {
      const { error: deleteHistoryError } = await supabase
        .from('assignment_history')
        .delete()
        .or('change_reason.like.*test*,change_reason.like.*prueba*,changed_by.eq.00000000-0000-0000-0000-000000000000');

      if (deleteHistoryError) {
// // console.log('❌ Error al eliminar historial de prueba:', deleteHistoryError.message);
      } else {
// // console.log(`✅ ${testHistory.length} registros de historial de prueba eliminados`);
      }
    } else {
// // console.log('✅ No se encontraron registros de historial de prueba');
    }

    // =====================================================
    // 2. VERIFICAR ASIGNACIONES DE PRUEBA
    // =====================================================
// // console.log('\n2️⃣ Verificando asignaciones de prueba...');
    
    const { data: testAssignments, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, notes')
      .or('notes.like.*test*,notes.like.*prueba*');

    if (assignmentError) {
// // console.log('⚠️ Error al consultar asignaciones de prueba:', assignmentError.message);
    } else if (testAssignments && testAssignments.length > 0) {
// // console.log(`⚠️ Se encontraron ${testAssignments.length} asignaciones con notas de prueba`);
// // console.log('   - Revisa manualmente si quieres eliminarlas');
      testAssignments.forEach(assignment => {
// // console.log(`     * ID: ${assignment.id} - Notas: ${assignment.notes}`);
      });
    } else {
// // console.log('✅ No se encontraron asignaciones de prueba');
    }

    // =====================================================
    // 3. VERIFICAR TRABAJADORAS DE PRUEBA
    // =====================================================
// // console.log('\n3️⃣ Verificando trabajadoras de prueba...');
    
    const { data: testWorkers, error: workerError } = await supabase
      .from('workers')
      .select('id, name, surname, notes')
      .or('name.like.*test*,name.like.*prueba*,notes.like.*test*,notes.like.*prueba*');

    if (workerError) {
// // console.log('⚠️ Error al consultar trabajadoras de prueba:', workerError.message);
    } else if (testWorkers && testWorkers.length > 0) {
// // console.log(`⚠️ Se encontraron ${testWorkers.length} trabajadoras de prueba`);
// // console.log('   - Revisa manualmente si quieres eliminarlas');
      testWorkers.forEach(worker => {
// // console.log(`     * ID: ${worker.id} - ${worker.name} ${worker.surname}`);
      });
    } else {
// // console.log('✅ No se encontraron trabajadoras de prueba');
    }

    // =====================================================
    // 4. VERIFICAR USUARIOS DE PRUEBA
    // =====================================================
// // console.log('\n4️⃣ Verificando usuarios de prueba...');
    
    const { data: testUsers, error: userError } = await supabase
      .from('users')
      .select('id, name, surname, notes')
      .or('name.like.*test*,name.like.*prueba*,notes.like.*test*,notes.like.*prueba*');

    if (userError) {
// // console.log('⚠️ Error al consultar usuarios de prueba:', userError.message);
    } else if (testUsers && testUsers.length > 0) {
// // console.log(`⚠️ Se encontraron ${testUsers.length} usuarios de prueba`);
// // console.log('   - Revisa manualmente si quieres eliminarlas');
      testUsers.forEach(user => {
// // console.log(`     * ID: ${user.id} - ${user.name} ${user.surname}`);
      });
    } else {
// // console.log('✅ No se encontraron usuarios de prueba');
    }

    // =====================================================
    // 5. VERIFICAR ESTADO GENERAL
    // =====================================================
// // console.log('\n5️⃣ Verificando estado general del sistema...');
    
    // Contar registros totales
    const { count: totalHistory } = await supabase
      .from('assignment_history')
      .select('*', { count: 'exact', head: true });

    const { count: totalAssignments } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true });

    const { count: totalWorkers } = await supabase
      .from('workers')
      .select('*', { count: 'exact', head: true });

    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

// // console.log('📊 Estado actual del sistema:');
// // console.log(`   - Historial: ${totalHistory || 0} registros`);
// // console.log(`   - Asignaciones: ${totalAssignments || 0} registros`);
// // console.log(`   - Trabajadoras: ${totalWorkers || 0} registros`);
// // console.log(`   - Usuarios: ${totalUsers || 0} registros`);

    // =====================================================
    // RESULTADO FINAL
    // =====================================================
// // console.log('\n' + '='.repeat(50));
// // console.log('✅ LIMPIEZA COMPLETADA');
// // console.log('='.repeat(50));
// // console.log('🎉 Sistema limpio y listo para producción');
// // console.log('\n📝 Recomendaciones:');
// // console.log('   - Revisa manualmente los datos marcados como "prueba"');
// // console.log('   - Verifica que no hay datos de test en producción');
// // console.log('   - Confirma que las asignaciones están correctas');
// // console.log('   - Prueba el sistema en un entorno de staging');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA LIMPIEZA:', error);
  }
}

cleanupTestData(); 