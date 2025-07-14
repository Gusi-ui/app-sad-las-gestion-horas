const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkWorkerProfilesSimple() {
  try {
    // Verificar worker_profiles
    const { data: workerProfiles, error: workerProfilesError } = await supabase
      .from('worker_profiles')
      .select('*');

    if (workerProfilesError) {
      console.error('Error con worker_profiles:', workerProfilesError.message);
    } else {
// // console.log('Trabajadoras en worker_profiles:');
// // console.log('=================================');
      if (workerProfiles.length === 0) {
// // console.log('No hay trabajadoras en worker_profiles.');
      } else {
        workerProfiles.forEach((worker, index) => {
// // console.log(`${index + 1}. ${worker.name} ${worker.surname} - Email: ${worker.email}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkWorkerProfilesSimple(); 