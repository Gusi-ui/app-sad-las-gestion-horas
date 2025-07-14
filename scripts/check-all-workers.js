const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAllWorkers() {
  try {
    // Verificar todas las trabajadoras
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, worker_type, is_active, email')
      .order('name');

    if (workersError) {
      console.error('Error fetching workers:', workersError);
      return;
    }

// // console.log('Todas las trabajadoras:');
// // console.log('=======================');
    if (workers.length === 0) {
// // console.log('No hay trabajadoras en la base de datos.');
    } else {
      workers.forEach((worker, index) => {
        const status = worker.is_active ? 'ACTIVA' : 'INACTIVA';
// // console.log(`${index + 1}. ${worker.name} ${worker.surname} (${worker.worker_type}) - ${status} - ID: ${worker.id}`);
// // console.log(`   Email: ${worker.email}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllWorkers(); 