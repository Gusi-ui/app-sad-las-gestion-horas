const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createWorkersWithServiceKey() {
  try {
// // console.log('👥 Creando trabajadoras con clave de servicio...\n');
    
    // Definir las trabajadoras conocidas
    const workers = [
      {
        name: 'Rosa',
        surname: 'Robles',
        email: 'rosa.robles@example.com',
        worker_type: 'laborable'
      },
      {
        name: 'Graciela',
        surname: 'García',
        email: 'graciela.garcia@example.com',
        worker_type: 'holiday_weekend'
      },
      {
        name: 'Carmen',
        surname: 'López',
        email: 'carmen.lopez@example.com',
        worker_type: 'laborable'
      }
    ];

// // console.log('📋 Trabajadoras a crear:');
    workers.forEach((worker, index) => {
// // console.log(`   ${index + 1}. ${worker.name} ${worker.surname}`);
// // console.log(`      Email: ${worker.email}`);
// // console.log(`      Tipo: ${worker.worker_type}`);
    });
// // console.log('');

    // Crear las trabajadoras
    const { data: createdWorkers, error: createError } = await supabase
      .from('workers')
      .insert(workers)
      .select();

    if (createError) {
      console.error('❌ Error al crear trabajadoras:', createError);
      return;
    }

// // console.log('✅ Trabajadoras creadas correctamente:');
    createdWorkers.forEach(worker => {
// // console.log(`   - ${worker.name} ${worker.surname} (ID: ${worker.id})`);
// // console.log(`     Email: ${worker.email}`);
// // console.log(`     Tipo: ${worker.worker_type}`);
    });
// // console.log('');

    // Verificar que se crearon correctamente
    const { data: allWorkers, error: fetchError } = await supabase
      .from('workers')
      .select('*')
      .order('name');

    if (fetchError) {
      console.error('Error al verificar trabajadoras:', fetchError);
      return;
    }

// // console.log(`📊 Total trabajadoras en la base de datos: ${allWorkers.length}`);
// // console.log('💡 Ahora puedes crear las asignaciones entre usuarios y trabajadoras');

    // Guardar los IDs para usar en las asignaciones
// // console.log('\n📝 IDs de trabajadoras para asignaciones:');
    createdWorkers.forEach(worker => {
// // console.log(`   ${worker.name} ${worker.surname}: ${worker.id}`);
    });

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

createWorkersWithServiceKey(); 