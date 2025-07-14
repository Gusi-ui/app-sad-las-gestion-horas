const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWorkersData() {
  try {
// // // console.log('🔍 Verificando datos de trabajadoras...\n');
    
    // 1. Verificar tabla workers
// // // console.log('1. Verificando tabla workers...');
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*');

    if (workersError) {
      console.error('Error al obtener trabajadoras:', workersError);
    } else {
// // // console.log(`📊 Trabajadoras en tabla 'workers': ${workers?.length || 0}`);
      if (workers && workers.length > 0) {
        workers.forEach(worker => {
// // // console.log(`   - ${worker.name} ${worker.surname} (${worker.email})`);
        });
      }
    }
// // // console.log('');

    // 2. Verificar tabla worker_profiles (por si acaso)
// // // console.log('2. Verificando tabla worker_profiles...');
    const { data: workerProfiles, error: profilesError } = await supabase
      .from('worker_profiles')
      .select('*');

    if (profilesError) {
// // // console.log('Tabla worker_profiles no existe o error:', profilesError.message);
    } else {
// // // console.log(`📊 Perfiles en tabla 'worker_profiles': ${workerProfiles?.length || 0}`);
      if (workerProfiles && workerProfiles.length > 0) {
        workerProfiles.forEach(profile => {
// // // console.log(`   - ${profile.name} ${profile.surname} (${profile.email})`);
        });
      }
    }
// // // console.log('');

    // 3. Verificar tabla auth.users (usuarios autenticados)
// // // console.log('3. Verificando usuarios autenticados...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
// // // console.log('Error al obtener usuarios autenticados:', authError.message);
    } else {
// // // console.log(`📊 Usuarios autenticados: ${authUsers?.users?.length || 0}`);
      if (authUsers?.users) {
        authUsers.users.forEach(user => {
// // // console.log(`   - ${user.email} (${user.id})`);
        });
      }
    }
// // // console.log('');

    // 4. Verificar si hay referencias a trabajadoras en otras tablas
// // // console.log('4. Verificando referencias a trabajadoras...');
    
    // En assignments
    const { data: assignmentWorkers, error: assignmentError } = await supabase
      .from('assignments')
      .select('worker_id')
      .not('worker_id', 'is', null);

    if (assignmentError) {
// // // console.log('Error al verificar worker_id en assignments:', assignmentError.message);
    } else {
      const uniqueWorkerIds = [...new Set(assignmentWorkers?.map(a => a.worker_id) || [])];
// // // console.log(`📊 IDs de trabajadoras referenciados en assignments: ${uniqueWorkerIds.length}`);
      uniqueWorkerIds.forEach(id => // // console.log(`   - ${id}`));
    }
// // // console.log('');

    // 5. Verificar estructura de tabla workers
// // // console.log('5. Verificando estructura de tabla workers...');
    const { data: sampleWorker, error: sampleError } = await supabase
      .from('workers')
      .select('*')
      .limit(1);

    if (sampleError) {
// // // console.log('Error al verificar estructura:', sampleError.message);
    } else if (sampleWorker && sampleWorker.length > 0) {
// // // console.log('🏗️ Campos en tabla workers:');
      Object.keys(sampleWorker[0]).forEach(field => {
// // // console.log(`   - ${field}: ${typeof sampleWorker[0][field]}`);
      });
    } else {
// // // console.log('📋 Tabla workers está vacía, mostrando estructura esperada:');
// // // console.log('   - id: string (UUID)');
// // // console.log('   - name: string');
// // // console.log('   - surname: string');
// // // console.log('   - email: string');
// // // console.log('   - worker_type: string (laborable, holiday_weekend, both)');
// // // console.log('   - created_at: timestamp');
// // // console.log('   - updated_at: timestamp');
    }
// // // console.log('');

    // 6. Información sobre trabajadoras conocidas
// // // console.log('6. Trabajadoras conocidas del sistema:');
// // // console.log('   👤 Rosa Robles - Trabajadora laborable para José Martínez');
// // // console.log('   👤 Graciela - Trabajadora de festivos y fines de semana');
// // // console.log('   👤 Trabajadora de María Caparros (martes y jueves)');
// // // console.log('');

// // // console.log('💡 Para continuar necesitamos:');
// // // console.log('   1. Crear las trabajadoras en la tabla workers');
// // // console.log('   2. Asignarles los tipos correctos (laborable, holiday_weekend, both)');
// // // console.log('   3. Crear las asignaciones correspondientes');

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

checkWorkersData(); 