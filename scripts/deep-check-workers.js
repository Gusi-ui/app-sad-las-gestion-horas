const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function deepCheckWorkers() {
  try {
    console.log('🔍 Verificación profunda de trabajadoras...\n');

    // 1. Verificar tabla workers con más detalles
    console.log('📋 Tabla "workers" (detallado):');
    console.log('================================');
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .order('created_at', { ascending: false });

    if (workersError) {
      console.log('   Error:', workersError.message);
    } else {
      console.log(`   Total trabajadoras en tabla "workers": ${workers.length}`);
      if (workers.length > 0) {
        workers.forEach((worker, index) => {
          const status = worker.is_active ? 'ACTIVA' : 'INACTIVA';
          console.log(`   ${index + 1}. ${worker.name} ${worker.surname}`);
          console.log(`      ID: ${worker.id}`);
          console.log(`      Email: ${worker.email}`);
          console.log(`      Tipo: ${worker.worker_type}`);
          console.log(`      Estado: ${status}`);
          console.log(`      Creada: ${worker.created_at}`);
          console.log('');
        });
      } else {
        console.log('   No hay trabajadoras en la tabla workers');
      }
    }

    console.log('='.repeat(60) + '\n');

    // 2. Verificar si hay trabajadoras con nombres similares
    console.log('🔍 Buscando trabajadoras con nombres similares:');
    console.log('===============================================');
    
    if (workers && workers.length > 0) {
      const rosaWorkers = workers.filter(w => 
        w.name.toLowerCase().includes('rosa') || 
        w.surname.toLowerCase().includes('robles')
      );
      
      if (rosaWorkers.length > 0) {
        console.log(`   Encontradas ${rosaWorkers.length} trabajadora(s) con "Rosa" o "Robles":`);
        rosaWorkers.forEach((worker, index) => {
          console.log(`   ${index + 1}. ${worker.name} ${worker.surname} (ID: ${worker.id})`);
        });
      } else {
        console.log('   No se encontraron trabajadoras con "Rosa" o "Robles"');
      }
    }

    console.log('='.repeat(60) + '\n');

    // 3. Verificar tabla worker_profiles con estructura correcta
    console.log('📋 Tabla "worker_profiles" (intento con estructura):');
    console.log('==================================================');
    
    // Intentar diferentes estructuras de columnas
    const possibleColumns = [
      'id, name, surname, email',
      'id, first_name, last_name, email',
      'id, worker_name, worker_surname, email',
      '*'
    ];

    for (const columns of possibleColumns) {
      try {
        const { data: profiles, error: profileError } = await supabase
          .from('worker_profiles')
          .select(columns)
          .limit(5);

        if (!profileError && profiles && profiles.length > 0) {
          console.log(`   ✅ Encontradas ${profiles.length} trabajadora(s) en worker_profiles con columnas: ${columns}`);
          profiles.forEach((profile, index) => {
            console.log(`      ${index + 1}. ${JSON.stringify(profile)}`);
          });
          break;
        }
      } catch (e) {
        // Continuar con el siguiente intento
      }
    }

    console.log('='.repeat(60) + '\n');

    // 4. Verificar si hay problemas de caché
    console.log('🔄 Verificación de caché:');
    console.log('==========================');
    console.log('   Si ves trabajadoras en la interfaz pero no en los scripts,');
    console.log('   puede ser un problema de caché del navegador o de la aplicación.');
    console.log('');
    console.log('   Soluciones:');
    console.log('   1. Refrescar la página (Ctrl+F5 o Cmd+Shift+R)');
    console.log('   2. Limpiar caché del navegador');
    console.log('   3. Reiniciar el servidor de desarrollo');

  } catch (error) {
    console.error('Error:', error);
  }
}

deepCheckWorkers(); 