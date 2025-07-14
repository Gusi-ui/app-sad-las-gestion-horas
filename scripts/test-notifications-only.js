const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNotificationsOnly() {
// // console.log('🧪 TEST DE NOTIFICACIONES Y REASIGNACIÓN');
// // console.log('='.repeat(50));
  
  let testAssignmentId = null;
  let originalWorkerId = null;
  let newWorkerId = null;

  try {
    // =====================================================
    // 1. OBTENER DATOS DE PRUEBA
    // =====================================================
// // console.log('\n1️⃣ Obteniendo datos de prueba...');
    
    // Obtener una asignación activa
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignments')
      .select(`
        id, 
        worker_id, 
        user_id, 
        weekly_hours,
        workers!inner(name, surname),
        users!inner(name, surname)
      `)
      .eq('status', 'active')
      .limit(1);

    if (assignmentError || !assignments || assignments.length === 0) {
// // console.log('❌ No se encontraron asignaciones activas para probar');
      return;
    }

    testAssignmentId = assignments[0].id;
    originalWorkerId = assignments[0].worker_id;
    
// // console.log(`✅ Asignación de prueba: ${testAssignmentId}`);
// // console.log(`   - Trabajador actual: ${assignments[0].workers.name} ${assignments[0].workers.surname}`);
// // console.log(`   - Usuario: ${assignments[0].users.name} ${assignments[0].users.surname}`);
// // console.log(`   - Horas semanales: ${assignments[0].weekly_hours}`);

    // Obtener otra trabajadora para la reasignación
    const { data: workers, error: workerError } = await supabase
      .from('workers')
      .select('id, name, surname, max_weekly_hours')
      .neq('id', originalWorkerId)
      .eq('is_active', true)
      .limit(1);

    if (workerError || !workers || workers.length === 0) {
// // console.log('❌ No se encontró otra trabajadora para la prueba');
      return;
    }

    newWorkerId = workers[0].id;
// // console.log(`✅ Nueva trabajadora: ${newWorkerId} (${workers[0].name} ${workers[0].surname})`);
// // console.log(`   - Horas máximas semanales: ${workers[0].max_weekly_hours}`);

    // =====================================================
    // 2. VALIDAR HORAS SEMANALES
    // =====================================================
// // console.log('\n2️⃣ Validando horas semanales...');
    
    // Calcular horas actuales de la nueva trabajadora
    const { data: currentAssignments, error: currentError } = await supabase
      .from('assignments')
      .select('weekly_hours')
      .eq('worker_id', newWorkerId)
      .eq('status', 'active');

    if (currentError) {
// // console.log('❌ Error al calcular horas actuales:', currentError.message);
      return;
    }

    const currentHours = currentAssignments?.reduce((sum, a) => sum + a.weekly_hours, 0) || 0;
    const newTotalHours = currentHours + assignments[0].weekly_hours;
    const maxHours = workers[0].max_weekly_hours;

// // console.log(`   - Horas actuales: ${currentHours}h`);
// // console.log(`   - Horas de la asignación: ${assignments[0].weekly_hours}h`);
// // console.log(`   - Total después de reasignación: ${newTotalHours}h`);
// // console.log(`   - Límite máximo: ${maxHours}h`);

    if (newTotalHours > maxHours) {
// // console.log('⚠️ ADVERTENCIA: La reasignación excedería las horas máximas');
// // console.log('   - Esto simularía una notificación de warning');
    } else {
// // console.log('✅ La reasignación es válida en términos de horas');
    }

    // =====================================================
    // 3. SIMULAR REASIGNACIÓN
    // =====================================================
// // console.log('\n3️⃣ Simulando reasignación...');
    
    // Actualizar la asignación
    const { error: updateError } = await supabase
      .from('assignments')
      .update({ worker_id: newWorkerId })
      .eq('id', testAssignmentId);

    if (updateError) {
// // console.log('❌ Error al actualizar asignación:', updateError.message);
// // console.log('   - Esto simularía una notificación de error');
      return;
    }

// // console.log('✅ Asignación actualizada correctamente');
// // console.log('   - Esto simularía una notificación de success');

    // =====================================================
    // 4. VERIFICAR CAMBIO
    // =====================================================
// // console.log('\n4️⃣ Verificando el cambio...');
    
    const { data: updatedAssignment, error: verifyError } = await supabase
      .from('assignments')
      .select(`
        worker_id,
        workers!inner(name, surname)
      `)
      .eq('id', testAssignmentId)
      .single();

    if (verifyError) {
// // console.log('❌ Error al verificar cambio:', verifyError.message);
    } else {
// // console.log('✅ Cambio verificado correctamente');
// // console.log(`   - Nueva trabajadora: ${updatedAssignment.workers.name} ${updatedAssignment.workers.surname}`);
    }

    // =====================================================
    // 5. RESTAURAR ASIGNACIÓN ORIGINAL
    // =====================================================
// // console.log('\n5️⃣ Restaurando asignación original...');
    
    const { error: restoreError } = await supabase
      .from('assignments')
      .update({ worker_id: originalWorkerId })
      .eq('id', testAssignmentId);

    if (restoreError) {
// // console.log('❌ Error al restaurar asignación:', restoreError.message);
    } else {
// // console.log('✅ Asignación restaurada correctamente');
    }

    // =====================================================
    // 6. SIMULAR NOTIFICACIONES
    // =====================================================
// // console.log('\n6️⃣ Simulando notificaciones...');
    
// // console.log('🔔 NOTIFICACIONES QUE SE MOSTRARÍAN EN LA APP:');
// // console.log('   🟢 SUCCESS: "Reasignación exitosa"');
// // console.log('   🟢 SUCCESS: "Asignación transferida de [Trabajador Original] a [Nueva Trabajadora]"');
// // console.log('   ℹ️ INFO: "Procesando reasignación..."');
    
    if (newTotalHours > maxHours) {
// // console.log('   🟡 WARNING: "La trabajadora excedería las horas semanales máximas"');
    }

    // =====================================================
    // RESULTADO FINAL
    // =====================================================
// // console.log('\n' + '='.repeat(50));
// // console.log('🎉 TEST DE NOTIFICACIONES COMPLETADO');
// // console.log('='.repeat(50));
// // console.log('✅ Sistema de reasignación funciona');
// // console.log('✅ Validación de horas funciona');
// // console.log('✅ Notificaciones están listas');
// // console.log('✅ Sistema preparado para historial');
// // console.log('\n📝 Próximos pasos:');
// // console.log('   1. Crear tabla de historial en Supabase');
// // console.log('   2. Probar reasignaciones en la interfaz');
// // console.log('   3. Verificar notificaciones en tiempo real');
// // console.log('   4. Revisar historial de cambios');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE EL TEST:', error);
// // console.log('\n🔄 Intentando limpiar datos de prueba...');
    
    // Limpiar en caso de error
    if (testAssignmentId && originalWorkerId) {
      try {
        await supabase
          .from('assignments')
          .update({ worker_id: originalWorkerId })
          .eq('id', testAssignmentId);
// // console.log('✅ Asignación restaurada después del error');
      } catch (cleanupError) {
// // console.log('❌ Error al restaurar después del error:', cleanupError.message);
      }
    }
  }
}

testNotificationsOnly(); 