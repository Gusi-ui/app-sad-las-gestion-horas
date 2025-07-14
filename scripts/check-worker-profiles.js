const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkWorkerProfiles() {
  try {
    // Verificar worker_profiles
    const { data: workerProfiles, error: workerProfilesError } = await supabase
      .from('worker_profiles')
      .select('*')
      .order('name');

    if (workerProfilesError) {
      console.error('Error fetching worker_profiles:', workerProfilesError);
      return;
    }

// // console.log('Trabajadoras en worker_profiles:');
// // console.log('=================================');
    if (workerProfiles.length === 0) {
// // console.log('No hay trabajadoras en worker_profiles.');
    } else {
      workerProfiles.forEach((worker, index) => {
// // console.log(`${index + 1}. ${worker.name} ${worker.surname} - Email: ${worker.email}`);
      });
    }

// // console.log('\n' + '='.repeat(50) + '\n');

    // Verificar workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .order('name');

    if (workersError) {
      console.error('Error fetching workers:', workersError);
      return;
    }

// // console.log('Trabajadoras en workers:');
// // console.log('========================');
    if (workers.length === 0) {
// // console.log('No hay trabajadoras en workers.');
    } else {
      workers.forEach((worker, index) => {
// // console.log(`${index + 1}. ${worker.name} ${worker.surname} (${worker.worker_type}) - ${worker.is_active ? 'ACTIVA' : 'INACTIVA'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkWorkerProfiles(); 