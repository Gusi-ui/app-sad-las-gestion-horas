const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAssignmentsFixed() {
  try {
// // console.log('📋 Creando asignaciones con campos obligatorios...\n');
    
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

    // 2. Obtener trabajadoras
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, worker_type')
      .eq('is_active', true)
      .order('name');

    if (workersError) {
      console.error('Error al obtener trabajadoras:', workersError);
      return;
    }

    // 3. Definir asignaciones con todos los campos obligatorios
    const assignments = [
      // José Martínez Blánquez - Rosa Robles (laborable)
      {
        user_id: '9af4d980-414c-4e9b-8400-3f6021755d45', // José Martínez
        worker_id: '6d86ea4e-237f-4557-a319-e1ea38aeed65', // Rosa Robles
        assigned_hours_per_week: 17.5, // 3.5h × 5 días
        specific_schedule: {
          monday: ['08:00-09:30', '13:00-15:00'],
          tuesday: ['08:00-09:30', '13:00-15:00'],
          wednesday: ['08:00-09:30', '13:00-15:00'],
          thursday: ['08:00-09:30', '13:00-15:00'],
          friday: ['08:00-09:30', '13:00-15:00']
        },
        start_date: new Date().toISOString().split('T')[0], // Fecha actual
        status: 'active'
      },
      
      // José Martínez Blánquez - Graciela Petry (festivos y fines de semana)
      {
        user_id: '9af4d980-414c-4e9b-8400-3f6021755d45', // José Martínez
        worker_id: '8f62ad20-4df1-4b51-86ca-f9373c06a731', // Graciela Petry
        assigned_hours_per_week: 4.5, // 1.5h × 3 días (sábado, domingo, festivos)
        specific_schedule: {
          saturday: ['08:00-09:30'],
          sunday: ['08:00-09:30']
        },
        start_date: new Date().toISOString().split('T')[0], // Fecha actual
        status: 'active'
      },

      // María Caparros - Carmen López (laborable)
      {
        user_id: 'd004a547-9a2f-4a7f-94bd-3ba192306008', // María Caparros
        worker_id: '9cecd9b4-622d-45ee-a0ce-f29f53d6309e', // Carmen López
        assigned_hours_per_week: 3.5, // 1h 45min × 2 días (martes y jueves)
        specific_schedule: {
          tuesday: ['08:00-09:45'],
          thursday: ['08:00-09:45']
        },
        start_date: new Date().toISOString().split('T')[0], // Fecha actual
        status: 'active'
      }
    ];

// // console.log('📋 Asignaciones a crear:');
    assignments.forEach((assignment, index) => {
      const user = users.find(u => u.id === assignment.user_id);
      const worker = workers.find(w => w.id === assignment.worker_id);
      
// // console.log(`   ${index + 1}. ${user?.name} ${user?.surname} → ${worker?.name} ${worker?.surname}`);
// // console.log(`      Horas/semana: ${assignment.assigned_hours_per_week}h`);
// // console.log(`      Fecha inicio: ${assignment.start_date}`);
// // console.log(`      Estado: ${assignment.status}`);
    });
// // console.log('');

    // 4. Crear las asignaciones
    const { data: createdAssignments, error: createError } = await supabase
      .from('assignments')
      .insert(assignments)
      .select();

    if (createError) {
      console.error('❌ Error al crear asignaciones:', createError);
      return;
    }

// // console.log('✅ Asignaciones creadas correctamente:');
    createdAssignments.forEach(assignment => {
      const user = users.find(u => u.id === assignment.user_id);
      const worker = workers.find(w => w.id === assignment.worker_id);
      
// // console.log(`   - ${user?.name} ${user?.surname} → ${worker?.name} ${worker?.surname}`);
// // console.log(`     ID: ${assignment.id}`);
// // console.log(`     Horas/semana: ${assignment.assigned_hours_per_week}h`);
    });
// // console.log('');

    // 5. Verificar asignaciones creadas
    const { data: allAssignments, error: allError } = await supabase
      .from('assignments')
      .select(`
        id,
        user_id,
        worker_id,
        assigned_hours_per_week,
        specific_schedule,
        start_date,
        status,
        users(name, surname),
        workers(name, surname, worker_type)
      `)
      .order('created_at');

    if (allError) {
      console.error('Error al verificar asignaciones:', allError);
      return;
    }

// // console.log(`📊 Total asignaciones en la base de datos: ${allAssignments.length}`);
// // console.log('💡 Ahora puedes regenerar los balances con datos reales');

    // Mostrar resumen de asignaciones
// // console.log('\n📋 Resumen de asignaciones:');
    allAssignments.forEach(assignment => {
// // console.log(`   - ${assignment.users?.name} ${assignment.users?.surname} → ${assignment.workers?.name} ${assignment.workers?.surname} (${assignment.workers?.worker_type})`);
// // console.log(`     Horas/semana: ${assignment.assigned_hours_per_week}h`);
// // console.log(`     Estado: ${assignment.status}`);
    });

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

createAssignmentsFixed(); 