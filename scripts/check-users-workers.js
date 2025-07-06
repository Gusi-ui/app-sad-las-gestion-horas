const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkUsersAndWorkers() {
  try {
    // Verificar usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, surname, monthly_hours, is_active')
      .eq('is_active', true)
      .order('name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log('Usuarios activos:');
    console.log('==================');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} ${user.surname} (${user.monthly_hours}h/mes) - ID: ${user.id}`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // Verificar trabajadoras
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, worker_type, is_active')
      .eq('is_active', true)
      .order('name');

    if (workersError) {
      console.error('Error fetching workers:', workersError);
      return;
    }

    console.log('Trabajadoras activas:');
    console.log('=====================');
    workers.forEach((worker, index) => {
      console.log(`${index + 1}. ${worker.name} ${worker.surname} (${worker.worker_type}) - ID: ${worker.id}`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // Verificar asignaciones existentes
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, user_id, worker_id, assigned_hours_per_week, status, created_at')
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return;
    }

    console.log('Asignaciones existentes:');
    console.log('========================');
    if (assignments.length === 0) {
      console.log('No hay asignaciones en la base de datos.');
    } else {
      assignments.forEach((assignment, index) => {
        console.log(`${index + 1}. Usuario: ${assignment.user_id} | Trabajadora: ${assignment.worker_id} | ${assignment.assigned_hours_per_week}h/sem | ${assignment.status}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsersAndWorkers(); 