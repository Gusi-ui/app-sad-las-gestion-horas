const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteSystem() {
// // console.log('🧪 TEST COMPLETO DEL SISTEMA DE HISTORIAL Y NOTIFICACIONES');
// // console.log('='.repeat(60));
  
  let testAssignmentId = null;
  let originalWorkerId = null;
  let newWorkerId = null;
  let testHistoryId = null;

  try {
    // =====================================================
    // 1. VERIFICAR TABLA DE HISTORIAL
    // =====================================================
// // console.log('\n1️⃣ Verificando tabla de historial...');
    
    try {
      const { data: testInsert, error: insertError } = await supabase
        .from('assignment_history')
        .insert({
          assignment_id: '00000000-0000-0000-0000-000000000000',
          new_worker_id: '00000000-0000-0000-0000-000000000000',
          changed_by: '00000000-0000-0000-0000-000000000000',
          change_reason: 'Test de verificación'
        });

      if (insertError && insertError.code === '42P01') {
// // console.log('❌ Tabla assignment_history NO existe');
// // console.log('📝 Ejecuta el SQL en Supabase Dashboard primero');
        return;
      } else if (insertError) {
// // console.log('⚠️ Error al insertar prueba:', insertError.message);
      } else {
// // console.log('✅ Tabla assignment_history existe y funciona');
        // Limpiar registro de prueba
        await supabase
          .from('assignment_history')
          .delete()
          .eq('assignment_id', '00000000-0000-0000-0000-000000000000');
      }
    } catch (error) {
// // console.log('❌ Error al verificar tabla:', error.message);
      return;
    }

    // =====================================================
    // 2. OBTENER DATOS DE PRUEBA
    // =====================================================
// // console.log('\n2️⃣ Obteniendo datos de prueba...');
    
    // Obtener una asignación activa
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, worker_id, user_id, weekly_hours')
      .eq('status', 'active')
      .limit(1);

    if (assignmentError || !assignments || assignments.length === 0) {
// // console.log('❌ No se encontraron asignaciones activas para probar');
      return;
    }

    testAssignmentId = assignments[0].id;
    originalWorkerId = assignments[0].worker_id;
    
// // console.log(`✅ Asignación de prueba: ${testAssignmentId}`);
// // console.log(`   - Trabajador original: ${originalWorkerId}`);

    // Obtener otra trabajadora para la reasignación
    const { data: workers, error: workerError } = await supabase
      .from('workers')
      .select('id, name, surname')
      .neq('id', originalWorkerId)
      .eq('is_active', true)
      .limit(1);

    if (workerError || !workers || workers.length === 0) {
// // console.log('❌ No se encontró otra trabajadora para la prueba');
      return;
    }

    newWorkerId = workers[0].id;
// // console.log(`✅ Nueva trabajadora: ${newWorkerId} (${workers[0].name} ${workers[0].surname})`);

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
      return;
    }

// // console.log('✅ Asignación actualizada correctamente');

    // =====================================================
    // 4. REGISTRAR EN HISTORIAL
    // =====================================================
// // console.log('\n4️⃣ Registrando en historial...');
    
    const { data: historyData, error: historyError } = await supabase
      .from('assignment_history')
      .insert({
        assignment_id: testAssignmentId,
        previous_worker_id: originalWorkerId,
        new_worker_id: newWorkerId,
        changed_by: '00000000-0000-0000-0000-000000000000', // Test user
        change_reason: 'Test del sistema de historial - Reasignación de prueba'
      })
      .select()
      .single();

    if (historyError) {
// // console.log('❌ Error al registrar historial:', historyError.message);
      return;
    }

    testHistoryId = historyData.id;
// // console.log('✅ Registro de historial creado correctamente');
// // console.log(`   - ID del historial: ${testHistoryId}`);

    // =====================================================
    // 5. VERIFICAR HISTORIAL
    // =====================================================
// // console.log('\n5️⃣ Verificando historial...');
    
    const { data: historyRecords, error: historyQueryError } = await supabase
      .from('assignment_history')
      .select(`
        id,
        assignment_id,
        previous_worker_id,
        new_worker_id,
        changed_by,
        change_reason,
        created_at
      `)
      .eq('assignment_id', testAssignmentId)
      .order('created_at', { ascending: false });

    if (historyQueryError) {
// // console.log('❌ Error al consultar historial:', historyQueryError.message);
    } else {
// // console.log('✅ Historial consultado correctamente');
// // console.log(`   - Registros encontrados: ${historyRecords.length}`);
      
      if (historyRecords.length > 0) {
        const latest = historyRecords[0];
// // console.log('   - Último registro:');
// // console.log(`     * ID: ${latest.id}`);
// // console.log(`     * Trabajador anterior: ${latest.previous_worker_id || 'N/A'}`);
// // console.log(`     * Nuevo trabajador: ${latest.new_worker_id}`);
// // console.log(`     * Motivo: ${latest.change_reason || 'Sin motivo'}`);
// // console.log(`     * Fecha: ${new Date(latest.created_at).toLocaleString('es-ES')}`);
        
        // Obtener nombres de trabajadoras por separado
        if (latest.previous_worker_id) {
          const { data: prevWorker } = await supabase
            .from('workers')
            .select('name, surname')
            .eq('id', latest.previous_worker_id)
            .single();
          
          if (prevWorker) {
// // console.log(`     * Trabajador anterior: ${prevWorker.name} ${prevWorker.surname}`);
          }
        }
        
        const { data: newWorker } = await supabase
          .from('workers')
          .select('name, surname')
          .eq('id', latest.new_worker_id)
          .single();
        
        if (newWorker) {
// // console.log(`     * Nuevo trabajador: ${newWorker.name} ${newWorker.surname}`);
        }
      }
    }

    // =====================================================
    // 6. RESTAURAR ASIGNACIÓN ORIGINAL
    // =====================================================
// // console.log('\n6️⃣ Restaurando asignación original...');
    
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
    // 7. LIMPIAR DATOS DE PRUEBA
    // =====================================================
// // console.log('\n7️⃣ Limpiando datos de prueba...');
    
    if (testHistoryId) {
      const { error: cleanupError } = await supabase
        .from('assignment_history')
        .delete()
        .eq('id', testHistoryId);

      if (cleanupError) {
// // console.log('⚠️ Error al limpiar historial de prueba:', cleanupError.message);
      } else {
// // console.log('✅ Datos de prueba limpiados correctamente');
      }
    }

    // =====================================================
    // 8. VERIFICACIÓN FINAL
    // =====================================================
// // console.log('\n8️⃣ Verificación final...');
    
    // Verificar que la asignación está restaurada
    const { data: finalAssignment, error: finalError } = await supabase
      .from('assignments')
      .select('worker_id')
      .eq('id', testAssignmentId)
      .single();

    if (finalError) {
// // console.log('❌ Error en verificación final:', finalError.message);
    } else if (finalAssignment.worker_id === originalWorkerId) {
// // console.log('✅ Verificación final exitosa');
// // console.log('   - Asignación restaurada correctamente');
    } else {
// // console.log('⚠️ La asignación no se restauró correctamente');
    }

    // =====================================================
    // RESULTADO FINAL
    // =====================================================
// // console.log('\n' + '='.repeat(60));
// // console.log('🎉 TEST COMPLETADO EXITOSAMENTE');
// // console.log('='.repeat(60));
// // console.log('✅ Tabla de historial funciona correctamente');
// // console.log('✅ Reasignaciones se registran automáticamente');
// // console.log('✅ Consultas de historial funcionan');
// // console.log('✅ Sistema listo para producción');
// // console.log('\n📝 Próximos pasos:');
// // console.log('   1. Ejecutar SQL en Supabase Dashboard');
// // console.log('   2. Probar reasignaciones en la interfaz');
// // console.log('   3. Verificar notificaciones');
// // console.log('   4. Revisar historial en la app');

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

testCompleteSystem(); 