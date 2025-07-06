const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno desde el archivo .env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkGracielaWorkerType() {
  try {
    console.log('🔍 Verificando tipo de trabajadora de Graciela...\n');

    // Buscar Graciela Petry
    const { data: graciela, error: gracielaError } = await supabase
      .from('workers')
      .select('*')
      .eq('name', 'Graciela')
      .eq('surname', 'Petry')
      .single();

    if (gracielaError || !graciela) {
      console.error('❌ No se encontró Graciela Petry:', gracielaError?.message);
      return;
    }

    console.log('✅ Graciela Petry encontrada:', {
      id: graciela.id,
      name: graciela.name,
      surname: graciela.surname,
      email: graciela.email,
      worker_type: graciela.worker_type || 'No definido'
    });

    // Verificar si necesita actualización
    if (graciela.worker_type !== 'holiday_weekend' && graciela.worker_type !== 'both') {
      console.log('\n⚠️  Graciela necesita actualización de tipo de trabajadora');
      console.log(`- Tipo actual: ${graciela.worker_type || 'No definido'}`);
      console.log(`- Tipo requerido: holiday_weekend o both`);
      
      // Preguntar si actualizar
      console.log('\n¿Quieres actualizar el tipo de trabajadora de Graciela a "holiday_weekend"? (s/n)');
      
      // Por ahora, vamos a actualizar automáticamente
      const { data: updateResult, error: updateError } = await supabase
        .from('workers')
        .update({ worker_type: 'holiday_weekend' })
        .eq('id', graciela.id)
        .select();

      if (updateError) {
        console.error('❌ Error al actualizar:', updateError.message);
        return;
      }

      console.log('✅ Graciela actualizada correctamente a holiday_weekend');
      console.log('Resultado:', updateResult[0]);
    } else {
      console.log('✅ Graciela ya tiene el tipo correcto');
    }

    // Verificar todas las trabajadoras
    console.log('\n📋 Lista de todas las trabajadoras:');
    const { data: allWorkers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .order('name');

    if (workersError) {
      console.error('❌ Error al obtener trabajadoras:', workersError.message);
      return;
    }

    allWorkers.forEach(worker => {
      console.log(`- ${worker.name} ${worker.surname}: ${worker.worker_type || 'No definido'}`);
    });

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkGracielaWorkerType(); 