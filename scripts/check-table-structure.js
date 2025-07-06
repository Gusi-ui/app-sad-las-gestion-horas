const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkTableStructure() {
  try {
    // Verificar si existe la tabla workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .limit(1);

    if (workersError) {
      console.log('Error con tabla workers:', workersError.message);
    } else {
      console.log('Tabla workers existe y es accesible');
    }

    // Verificar si existe la tabla worker_profiles
    const { data: workerProfiles, error: workerProfilesError } = await supabase
      .from('worker_profiles')
      .select('*')
      .limit(1);

    if (workerProfilesError) {
      console.log('Error con tabla worker_profiles:', workerProfilesError.message);
    } else {
      console.log('Tabla worker_profiles existe y es accesible');
    }

    // Listar todas las tablas disponibles
    console.log('\nIntentando listar tablas...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    if (tablesError) {
      console.log('No se pueden listar tablas directamente:', tablesError.message);
    } else {
      console.log('Tablas disponibles:', tables);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure(); 