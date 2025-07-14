const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Función para generar UUID válido
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createWorkersOnly() {
  try {
// // console.log('👷 Creando trabajadoras solo en tabla workers...\n');

    // Datos de las trabajadoras
    const workers = [
      {
        name: 'Rosa',
        surname: 'Robles',
        email: 'rosa.robles@test.com',
        phone: '123456789',
        worker_type: 'laborable',
        availability_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        hourly_rate: 15.00,
        max_weekly_hours: 40,
        specializations: ['cuidado_personal', 'limpieza'],
        is_active: true
      },
      {
        name: 'Graciela',
        surname: 'Martínez',
        email: 'graciela.martinez@test.com',
        phone: '987654321',
        worker_type: 'holiday_weekend',
        availability_days: ['saturday', 'sunday'],
        hourly_rate: 18.00,
        max_weekly_hours: 20,
        specializations: ['cuidado_personal', 'acompañamiento'],
        is_active: true
      },
      {
        name: 'Carmen',
        surname: 'García',
        email: 'carmen.garcia@test.com',
        phone: '555666777',
        worker_type: 'both',
        availability_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        hourly_rate: 16.50,
        max_weekly_hours: 50,
        specializations: ['cuidado_personal', 'limpieza', 'acompañamiento'],
        is_active: true
      }
    ];

// // console.log('📋 Trabajadoras a crear:');
// // console.log('========================');
    workers.forEach((worker, index) => {
// // console.log(`${index + 1}. ${worker.name} ${worker.surname}`);
// // console.log(`   Email: ${worker.email}`);
// // console.log(`   Tipo: ${worker.worker_type}`);
// // console.log(`   Días: ${worker.availability_days.join(', ')}`);
// // console.log('');
    });

// // console.log('='.repeat(60) + '\n');

    // Crear cada trabajadora solo en workers
    for (let i = 0; i < workers.length; i++) {
      const worker = workers[i];
// // console.log(`🔧 Creando ${worker.name} ${worker.surname}...`);
      
      try {
        // Generar UUID válido
        const workerId = generateUUID();
// // console.log(`   ID generado: ${workerId}`);
        
        // Crear solo en workers (omitir worker_profiles por ahora)
        const { error: workersError } = await supabase
          .from('workers')
          .insert({
            id: workerId,
            name: worker.name,
            surname: worker.surname,
            phone: worker.phone,
            email: worker.email,
            is_active: worker.is_active,
            hire_date: new Date().toISOString(),
            hourly_rate: worker.hourly_rate,
            max_weekly_hours: worker.max_weekly_hours,
            specializations: worker.specializations,
            availability_days: worker.availability_days,
            worker_type: worker.worker_type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (workersError) {
// // console.log(`   ❌ Error en workers: ${workersError.message}`);
          continue;
        }

// // console.log(`   ✅ ${worker.name} ${worker.surname} creada exitosamente`);
// // console.log('');

      } catch (error) {
// // console.log(`   ❌ Error inesperado: ${error.message}`);
// // console.log('');
      }
    }

// // console.log('='.repeat(60) + '\n');

    // Verificar que se crearon correctamente
// // console.log('🔍 Verificando trabajadoras creadas...');
// // console.log('=====================================');
    
    const { data: createdWorkers, error: fetchError } = await supabase
      .from('workers')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
// // console.log(`   ❌ Error obteniendo trabajadoras: ${fetchError.message}`);
    } else {
// // console.log(`   ✅ Total trabajadoras en la base de datos: ${createdWorkers.length}`);
      createdWorkers.forEach((worker, index) => {
// // console.log(`   ${index + 1}. ${worker.name} ${worker.surname} (${worker.worker_type})`);
// // console.log(`      Email: ${worker.email}`);
// // console.log(`      Días: ${worker.availability_days?.join(', ') || 'No configurado'}`);
// // console.log('');
      });
    }

// // console.log('='.repeat(60) + '\n');

    // Instrucciones para el siguiente paso
// // console.log('📝 Próximos pasos:');
// // console.log('==================');
// // console.log('   1. Ve a la interfaz de administración (/dashboard/workers)');
// // console.log('   2. Verifica que las trabajadoras aparecen en la lista');
// // console.log('   3. Prueba crear asignaciones para estas trabajadoras');
// // console.log('   4. Una vez que todo funcione, arregla el problema de Auth');
// // console.log('');
// // console.log('   ⚠️ Nota: Las trabajadoras están solo en la tabla workers');
// // console.log('      worker_profiles se puede arreglar más tarde cuando');
// // console.log('      se solucione el problema de RLS');

  } catch (error) {
    console.error('Error general:', error);
  }
}

createWorkersOnly(); 