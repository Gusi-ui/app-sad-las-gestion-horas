const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createWorkersFinal() {
  try {
// // console.log('👥 Creando trabajadoras con estructura correcta...\n');
    
    // Definir las trabajadoras conocidas con la estructura correcta
    const workers = [
      {
        name: 'Rosa',
        surname: 'Robles',
        email: 'rosa.robles@example.com',
        phone: '600123456',
        worker_type: 'laborable',
        is_active: true,
        hourly_rate: 12.00,
        max_weekly_hours: 40,
        availability_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        hire_date: new Date().toISOString().split('T')[0]
      },
      {
        name: 'Carmen',
        surname: 'López',
        email: 'carmen.lopez@example.com',
        phone: '600345678',
        worker_type: 'laborable',
        is_active: true,
        hourly_rate: 12.50,
        max_weekly_hours: 35,
        availability_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        hire_date: new Date().toISOString().split('T')[0]
      }
    ];

// // console.log('📋 Trabajadoras a crear:');
    workers.forEach((worker, index) => {
// // console.log(`   ${index + 1}. ${worker.name} ${worker.surname}`);
// // console.log(`      Email: ${worker.email}`);
// // console.log(`      Teléfono: ${worker.phone}`);
// // console.log(`      Tipo: ${worker.worker_type}`);
// // console.log(`      Tarifa por hora: €${worker.hourly_rate}`);
// // console.log(`      Días disponibles: ${worker.availability_days.join(', ')}`);
    });
// // console.log('');

    // Verificar trabajadoras existentes
    const { data: existingWorkers, error: fetchError } = await supabase
      .from('workers')
      .select('name, surname, email, worker_type')
      .order('name');

    if (fetchError) {
      console.error('Error al obtener trabajadoras existentes:', fetchError);
      return;
    }

// // console.log('📊 Trabajadoras existentes:');
    existingWorkers.forEach(worker => {
// // console.log(`   - ${worker.name} ${worker.surname} (${worker.worker_type})`);
    });
// // console.log('');

    // Filtrar trabajadoras que no existen
    const workersToCreate = workers.filter(newWorker => 
      !existingWorkers.some(existing => 
        existing.email === newWorker.email || 
        (existing.name === newWorker.name && existing.surname === newWorker.surname)
      )
    );

    if (workersToCreate.length === 0) {
// // console.log('✅ Todas las trabajadoras ya existen');
      return;
    }

// // console.log(`📝 Creando ${workersToCreate.length} trabajadoras nuevas...`);

    // Crear las trabajadoras
    const { data: createdWorkers, error: createError } = await supabase
      .from('workers')
      .insert(workersToCreate)
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

    // Obtener todas las trabajadoras para asignaciones
    const { data: allWorkers, error: allError } = await supabase
      .from('workers')
      .select('id, name, surname, email, worker_type')
      .order('name');

    if (allError) {
      console.error('Error al obtener todas las trabajadoras:', allError);
      return;
    }

// // console.log(`📊 Total trabajadoras en la base de datos: ${allWorkers.length}`);
// // console.log('💡 Ahora puedes crear las asignaciones entre usuarios y trabajadoras');

    // Mostrar IDs para asignaciones
// // console.log('\n📝 IDs de trabajadoras para asignaciones:');
    allWorkers.forEach(worker => {
// // console.log(`   ${worker.name} ${worker.surname}: ${worker.id}`);
    });

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

createWorkersFinal(); 