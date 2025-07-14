const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkExistingWorkers() {
  try {
// // console.log('🔍 Verificando trabajadoras existentes...\n');

    // Verificar tabla workers
// // console.log('📋 Tabla "workers":');
// // console.log('==================');
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .order('name');

    if (workersError) {
// // console.log('   Error:', workersError.message);
    } else if (workers.length === 0) {
// // console.log('   No hay trabajadoras en la tabla workers');
    } else {
      workers.forEach((worker, index) => {
        const status = worker.is_active ? 'ACTIVA' : 'INACTIVA';
// // console.log(`   ${index + 1}. ${worker.name} ${worker.surname} (${worker.worker_type}) - ${status}`);
// // console.log(`      Email: ${worker.email}`);
// // console.log(`      ID: ${worker.id}`);
      });
    }

// // console.log('\n' + '='.repeat(50) + '\n');

    // Verificar tabla worker_profiles
// // console.log('📋 Tabla "worker_profiles":');
// // console.log('==========================');
    const { data: workerProfiles, error: workerProfilesError } = await supabase
      .from('worker_profiles')
      .select('*')
      .order('name');

    if (workerProfilesError) {
// // console.log('   Error:', workerProfilesError.message);
    } else if (workerProfiles.length === 0) {
// // console.log('   No hay trabajadoras en la tabla worker_profiles');
    } else {
      workerProfiles.forEach((worker, index) => {
// // console.log(`   ${index + 1}. ${worker.name} ${worker.surname}`);
// // console.log(`      Email: ${worker.email}`);
// // console.log(`      ID: ${worker.id}`);
      });
    }

// // console.log('\n' + '='.repeat(50) + '\n');

    // Verificar tabla auth.users (si es accesible)
// // console.log('📋 Tabla "auth.users" (trabajadoras):');
// // console.log('=====================================');
    const { data: authUsers, error: authUsersError } = await supabase
      .from('auth.users')
      .select('*')
      .like('email', '%@%')
      .order('email');

    if (authUsersError) {
// // console.log('   Error:', authUsersError.message);
    } else if (authUsers.length === 0) {
// // console.log('   No hay usuarios en auth.users');
    } else {
// // console.log(`   Total usuarios en auth: ${authUsers.length}`);
      authUsers.slice(0, 10).forEach((user, index) => {
// // console.log(`   ${index + 1}. ${user.email} (${user.id})`);
      });
      if (authUsers.length > 10) {
// // console.log(`   ... y ${authUsers.length - 10} más`);
      }
    }

// // console.log('\n' + '='.repeat(50) + '\n');

    // Resumen
// // console.log('📊 RESUMEN:');
// // console.log('===========');
    const totalWorkers = (workers || []).length;
    const totalWorkerProfiles = (workerProfiles || []).length;
    
// // console.log(`   Trabajadoras en tabla "workers": ${totalWorkers}`);
// // console.log(`   Trabajadoras en tabla "worker_profiles": ${totalWorkerProfiles}`);
    
    if (totalWorkers === 0 && totalWorkerProfiles === 0) {
// // console.log('\n   ✅ No hay trabajadoras existentes. Puedes crear las nuevas sin problemas.');
    } else {
// // console.log('\n   ⚠️  Hay trabajadoras existentes. Verifica antes de crear nuevas para evitar duplicados.');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkExistingWorkers(); 