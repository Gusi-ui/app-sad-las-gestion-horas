const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createRealAssignments() {
  try {
    console.log('📝 Creando asignaciones reales...\n');
    
    // 1. Obtener usuarios activos
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, surname, monthly_hours')
      .eq('is_active', true)
      .order('name');

    if (usersError) {
      console.error('Error al obtener usuarios:', usersError);
      return;
    }

    console.log(`📊 Usuarios activos encontrados: ${users.length}`);

    // 2. Obtener trabajadoras
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, email, worker_type')
      .order('name');

    if (workersError) {
      console.error('Error al obtener trabajadoras:', workersError);
      return;
    }

    console.log(`👥 Trabajadoras encontradas: ${workers.length}`);
    workers.forEach(worker => {
      console.log(`   - ${worker.name} ${worker.surname} (${worker.worker_type})`);
    });
    console.log('');

    // 3. Definir asignaciones reales basándose en la información conocida
    const realAssignments = [
      // José Martínez Blánquez - Rosa Robles (laborable)
      {
        user_id: '9af4d980-414c-4e9b-8400-3f6021755d45', // José Martínez
        worker_id: '3f6021755d45-414c-4e9b-8400-9af4d980', // Rosa Robles (ID ficticio, necesitamos el real)
        assigned_hours_per_week: 17.5, // 3.5h × 5 días
        specific_schedule: {
          monday: ['08:00-09:30', '13:00-15:00'],
          tuesday: ['08:00-09:30', '13:00-15:00'],
          wednesday: ['08:00-09:30', '13:00-15:00'],
          thursday: ['08:00-09:30', '13:00-15:00'],
          friday: ['08:00-09:30', '13:00-15:00']
        },
        description: 'Servicio diario de lunes a viernes'
      },
      
      // José Martínez Blánquez - Graciela (festivos y fines de semana)
      {
        user_id: '9af4d980-414c-4e9b-8400-3f6021755d45', // José Martínez
        worker_id: 'graciela-id', // Graciela (ID ficticio, necesitamos el real)
        assigned_hours_per_week: 4.5, // 1.5h × 3 días (sábado, domingo, festivos)
        specific_schedule: {
          saturday: ['08:00-09:30'],
          sunday: ['08:00-09:30']
        },
        description: 'Servicio fines de semana y festivos'
      },

      // María Caparros - Trabajadora asignada
      {
        user_id: 'd004a547-9a2f-4a7f-94bd-3ba192306008', // María Caparros
        worker_id: 'maria-worker-id', // Trabajadora de María (ID ficticio)
        assigned_hours_per_week: 3.5, // 1h 45min × 2 días (martes y jueves)
        specific_schedule: {
          tuesday: ['08:00-09:45'],
          thursday: ['08:00-09:45']
        },
        description: 'Servicio martes y jueves'
      }
    ];

    console.log('📋 Asignaciones a crear:');
    realAssignments.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Usuario: ${assignment.user_id}`);
      console.log(`      Worker: ${assignment.worker_id}`);
      console.log(`      Hours/week: ${assignment.assigned_hours_per_week}h`);
      console.log(`      Schedule: ${JSON.stringify(assignment.specific_schedule)}`);
    });
    console.log('');

    // 4. Verificar que los IDs de trabajadoras existen
    console.log('🔍 Verificando IDs de trabajadoras...');
    const workerIds = [...new Set(realAssignments.map(a => a.worker_id))];
    
    for (const workerId of workerIds) {
      if (workerId.includes('ficticio') || workerId.includes('-id')) {
        console.log(`   ⚠️  ID ficticio encontrado: ${workerId}`);
        console.log(`   Necesitamos el ID real de la trabajadora correspondiente`);
      } else {
        const worker = workers.find(w => w.id === workerId);
        if (worker) {
          console.log(`   ✅ ${worker.name} ${worker.surname} (${workerId})`);
        } else {
          console.log(`   ❌ Trabajadora no encontrada: ${workerId}`);
        }
      }
    }
    console.log('');

    // 5. Mostrar trabajadoras disponibles para asignar
    console.log('👥 Trabajadoras disponibles:');
    workers.forEach((worker, index) => {
      console.log(`   ${index + 1}. ${worker.name} ${worker.surname}`);
      console.log(`      ID: ${worker.id}`);
      console.log(`      Email: ${worker.email}`);
      console.log(`      Type: ${worker.worker_type}`);
      console.log('');
    });

    console.log('💡 Para continuar, necesitamos:');
    console.log('   1. Los IDs reales de las trabajadoras');
    console.log('   2. Confirmar los horarios exactos de cada asignación');
    console.log('   3. Verificar que las horas semanales son correctas');

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

createRealAssignments(); 