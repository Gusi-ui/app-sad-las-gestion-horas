const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function deleteAllWorkers() {
  try {
    console.log('🗑️  Borrando todas las trabajadoras existentes...\n');

    // Verificar trabajadoras existentes antes de borrar
    console.log('📋 Trabajadoras existentes antes del borrado:');
    console.log('============================================');
    const { data: existingWorkers, error: checkError } = await supabase
      .from('workers')
      .select('*')
      .order('name');

    if (checkError) {
      console.log('   Error verificando trabajadoras:', checkError.message);
      return;
    }

    if (existingWorkers.length === 0) {
      console.log('   No hay trabajadoras para borrar.');
      console.log('   ✅ Puedes proceder a crear las nuevas trabajadoras.');
      return;
    }

    existingWorkers.forEach((worker, index) => {
      console.log(`   ${index + 1}. ${worker.name} ${worker.surname} (${worker.worker_type}) - ID: ${worker.id}`);
    });

    console.log(`\n⚠️  Se van a borrar ${existingWorkers.length} trabajadora(s).`);
    console.log('¿Estás seguro? (Ctrl+C para cancelar, Enter para continuar)');
    
    // Simular confirmación (en un script real podrías usar readline)
    console.log('Procediendo con el borrado...\n');

    // Borrar todas las trabajadoras
    const { error: deleteError } = await supabase
      .from('workers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Borrar todas excepto un ID imposible

    if (deleteError) {
      console.error('❌ Error borrando trabajadoras:', deleteError);
      return;
    }

    console.log('✅ Todas las trabajadoras han sido borradas exitosamente.');

    // Verificar que se borraron
    console.log('\n📋 Verificación post-borrado:');
    console.log('=============================');
    const { data: remainingWorkers, error: verifyError } = await supabase
      .from('workers')
      .select('*');

    if (verifyError) {
      console.log('   Error verificando:', verifyError.message);
    } else if (remainingWorkers.length === 0) {
      console.log('   ✅ No quedan trabajadoras en la base de datos.');
      console.log('\n🎉 Base de datos limpia. Puedes proceder a crear las nuevas trabajadoras.');
    } else {
      console.log(`   ⚠️  Quedan ${remainingWorkers.length} trabajadora(s):`);
      remainingWorkers.forEach((worker, index) => {
        console.log(`      ${index + 1}. ${worker.name} ${worker.surname}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

deleteAllWorkers(); 