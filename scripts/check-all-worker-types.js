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

async function checkAllWorkerTypes() {
  try {
    console.log('🔍 Verificando tipos de todas las trabajadoras...\n');

    // 1. Obtener todas las trabajadoras
    const { data: workers, error: fetchError } = await supabase
      .from('workers')
      .select('id, name, surname, worker_type, availability_days')
      .order('name');

    if (fetchError) {
      throw fetchError;
    }

    if (!workers || workers.length === 0) {
      console.log('❌ No se encontraron trabajadoras');
      return;
    }

    console.log(`📊 Total de trabajadoras: ${workers.length}\n`);

    let needsUpdate = 0;
    let updated = 0;

    // 2. Verificar cada trabajadora
    for (const worker of workers) {
      console.log(`👤 ${worker.name} ${worker.surname}:`);
      console.log(`   ID: ${worker.id}`);
      console.log(`   Tipo actual: ${worker.worker_type || '❌ NO DEFINIDO'}`);
      console.log(`   Días disponibles: ${worker.availability_days?.join(', ') || 'No definidos'}`);

      // 3. Determinar el tipo basado en los días disponibles
      let suggestedType = 'laborable';
      
      if (worker.availability_days && worker.availability_days.length > 0) {
        const hasWeekend = worker.availability_days.includes('saturday') || worker.availability_days.includes('sunday');
        const hasWeekdays = worker.availability_days.some(day => 
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day)
        );

        if (hasWeekend && hasWeekdays) {
          suggestedType = 'both';
        } else if (hasWeekend) {
          suggestedType = 'holiday_weekend';
        } else {
          suggestedType = 'laborable';
        }
      }

      console.log(`   Tipo sugerido: ${suggestedType}`);

      // 4. Verificar si necesita actualización
      if (!worker.worker_type || worker.worker_type !== suggestedType) {
        needsUpdate++;
        console.log(`   ⚠️  NECESITA ACTUALIZACIÓN`);
        
        // Preguntar si actualizar
        if (process.argv.includes('--auto-update')) {
          console.log(`   🔄 Actualizando automáticamente...`);
          
          const { error: updateError } = await supabase
            .from('workers')
            .update({ worker_type: suggestedType })
            .eq('id', worker.id);

          if (updateError) {
            console.log(`   ❌ Error al actualizar: ${updateError.message}`);
          } else {
            updated++;
            console.log(`   ✅ Actualizada correctamente`);
          }
        }
      } else {
        console.log(`   ✅ Tipo correcto`);
      }
      
      console.log('');
    }

    // 5. Resumen
    console.log('📋 RESUMEN:');
    console.log(`   Total trabajadoras: ${workers.length}`);
    console.log(`   Necesitan actualización: ${needsUpdate}`);
    console.log(`   Actualizadas: ${updated}`);
    console.log(`   Correctas: ${workers.length - needsUpdate}`);

    if (needsUpdate > 0 && !process.argv.includes('--auto-update')) {
      console.log('\n💡 Para actualizar automáticamente, ejecuta:');
      console.log('   node scripts/check-all-worker-types.js --auto-update');
    }

    if (updated > 0) {
      console.log('\n🎉 Actualizaciones completadas exitosamente!');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    if (error.details) {
      console.error('Detalles:', error.details);
    }
  }
}

// Ejecutar la verificación
checkAllWorkerTypes(); 