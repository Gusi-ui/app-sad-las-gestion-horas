require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWorkerEdit() {
  try {
// // console.log('🔍 Probando actualización de tipo de trabajadora...\n');

    // 1. Buscar una trabajadora existente
// // console.log('1. Buscando trabajadoras existentes...');
    const { data: workers, error: fetchError } = await supabase
      .from('workers')
      .select('id, name, surname, worker_type')
      .limit(5);

    if (fetchError) {
      throw fetchError;
    }

    if (!workers || workers.length === 0) {
// // console.log('❌ No se encontraron trabajadoras');
      return;
    }

// // console.log('Trabajadoras encontradas:');
    workers.forEach(worker => {
// // console.log(`  - ${worker.name} ${worker.surname} (ID: ${worker.id}) - Tipo: ${worker.worker_type || 'No definido'}`);
    });

    // 2. Seleccionar la primera trabajadora para la prueba
    const testWorker = workers[0];
// // console.log(`\n2. Usando trabajadora: ${testWorker.name} ${testWorker.surname}`);

    // 3. Actualizar el tipo de trabajadora
    const newWorkerType = testWorker.worker_type === 'laborable' ? 'holiday_weekend' : 'laborable';
// // console.log(`3. Actualizando tipo de ${testWorker.worker_type || 'No definido'} a ${newWorkerType}...`);

    const { data: updatedWorker, error: updateError } = await supabase
      .from('workers')
      .update({ worker_type: newWorkerType })
      .eq('id', testWorker.id)
      .select('id, name, surname, worker_type')
      .single();

    if (updateError) {
      throw updateError;
    }

// // console.log('✅ Actualización exitosa!');
// // console.log(`   Trabajadora: ${updatedWorker.name} ${updatedWorker.surname}`);
// // console.log(`   Nuevo tipo: ${updatedWorker.worker_type}`);

    // 4. Verificar que el cambio se guardó correctamente
// // console.log('\n4. Verificando cambio en la base de datos...');
    const { data: verifyWorker, error: verifyError } = await supabase
      .from('workers')
      .select('id, name, surname, worker_type')
      .eq('id', testWorker.id)
      .single();

    if (verifyError) {
      throw verifyError;
    }

    if (verifyWorker.worker_type === newWorkerType) {
// // console.log('✅ Verificación exitosa - El tipo se actualizó correctamente');
    } else {
// // console.log('❌ Error en verificación - El tipo no se actualizó');
    }

    // 5. Revertir el cambio para no afectar los datos
// // console.log('\n5. Revirtiendo cambio...');
    const originalType = testWorker.worker_type || 'laborable';
    const { error: revertError } = await supabase
      .from('workers')
      .update({ worker_type: originalType })
      .eq('id', testWorker.id);

    if (revertError) {
// // console.log('⚠️  Error al revertir cambio:', revertError.message);
    } else {
// // console.log('✅ Cambio revertido correctamente');
    }

// // console.log('\n🎉 Prueba completada exitosamente!');
// // console.log('   El formulario de edición debería funcionar correctamente.');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    if (error.details) {
      console.error('Detalles:', error.details);
    }
  }
}

// Ejecutar la prueba
testWorkerEdit(); 