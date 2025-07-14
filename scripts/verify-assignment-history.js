const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAssignmentHistory() {
// // console.log('🔍 Verificando tabla de historial de asignaciones...\n');

  try {
    // 1. Verificar que la tabla existe
// // console.log('1️⃣ Verificando existencia de la tabla...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'assignment_history');

    if (tableError) {
// // console.log('⚠️ No se pudo verificar la tabla (esto es normal en algunos entornos)');
    } else if (tables && tables.length > 0) {
// // console.log('✅ Tabla assignment_history existe');
    } else {
// // console.log('❌ Tabla assignment_history NO existe');
// // console.log('📝 Ejecuta el SQL en Supabase Dashboard:');
// // console.log('🔗 https://supabase.com/dashboard/project/[TU_PROJECT]/sql/new');
      return;
    }

    // 2. Verificar estructura de la tabla
// // console.log('\n2️⃣ Verificando estructura de la tabla...');
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'assignment_history')
      .order('ordinal_position');

    if (columnError) {
// // console.log('⚠️ No se pudo verificar la estructura');
    } else {
// // console.log('📋 Columnas encontradas:');
      columns.forEach(col => {
// // console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    }

    // 3. Verificar políticas RLS
// // console.log('\n3️⃣ Verificando políticas RLS...');
    const { data: policies, error: policyError } = await supabase
      .from('information_schema.policies')
      .select('policy_name, permissive, roles, cmd')
      .eq('table_schema', 'public')
      .eq('table_name', 'assignment_history');

    if (policyError) {
// // console.log('⚠️ No se pudo verificar las políticas');
    } else {
// // console.log('🔒 Políticas encontradas:');
      policies.forEach(policy => {
// // console.log(`   - ${policy.policy_name}: ${policy.cmd} (${policy.permissive ? 'permissive' : 'restrictive'})`);
      });
    }

    // 4. Verificar índices
// // console.log('\n4️⃣ Verificando índices...');
    const { data: indexes, error: indexError } = await supabase
      .from('information_schema.indexes')
      .select('index_name, index_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'assignment_history');

    if (indexError) {
// // console.log('⚠️ No se pudo verificar los índices');
    } else {
// // console.log('📊 Índices encontrados:');
      indexes.forEach(index => {
// // console.log(`   - ${index.index_name}: ${index.index_type}`);
      });
    }

    // 5. Probar inserción de prueba
// // console.log('\n5️⃣ Probando inserción de prueba...');
    
    // Obtener una asignación de prueba
    const { data: testAssignment } = await supabase
      .from('assignments')
      .select('id, worker_id')
      .limit(1)
      .single();

    if (testAssignment) {
      const { data: testWorker } = await supabase
        .from('workers')
        .select('id')
        .neq('id', testAssignment.worker_id)
        .limit(1)
        .single();

      if (testWorker) {
        const { data: testUser } = await supabase.auth.getUser();
        
        const { data: insertData, error: insertError } = await supabase
          .from('assignment_history')
          .insert({
            assignment_id: testAssignment.id,
            previous_worker_id: testAssignment.worker_id,
            new_worker_id: testWorker.id,
            changed_by: testUser.user?.id || '00000000-0000-0000-0000-000000000000',
            change_reason: 'Prueba de verificación del sistema'
          })
          .select()
          .single();

        if (insertError) {
// // console.log('❌ Error al insertar registro de prueba:', insertError.message);
        } else {
// // console.log('✅ Inserción de prueba exitosa');
// // console.log(`   - ID: ${insertData.id}`);
// // console.log(`   - Asignación: ${insertData.assignment_id}`);
// // console.log(`   - Trabajador anterior: ${insertData.previous_worker_id}`);
// // console.log(`   - Nuevo trabajador: ${insertData.new_worker_id}`);
          
          // Limpiar el registro de prueba
          await supabase
            .from('assignment_history')
            .delete()
            .eq('id', insertData.id);
          
// // console.log('🧹 Registro de prueba eliminado');
        }
      } else {
// // console.log('⚠️ No se encontró trabajadora para la prueba');
      }
    } else {
// // console.log('⚠️ No se encontró asignación para la prueba');
    }

// // console.log('\n✅ Verificación completada');
// // console.log('🎉 La tabla assignment_history está lista para usar');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

verifyAssignmentHistory(); 