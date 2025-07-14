const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function verifySystemStatus() {
  try {
// // console.log('🔍 Verificando estado completo del sistema...\n');

    // 1. Verificar trabajadoras
// // console.log('👷 TRABAJADORAS:');
// // console.log('=================');
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .order('name');

    if (workersError) {
// // console.log(`   ❌ Error: ${workersError.message}`);
    } else {
// // console.log(`   ✅ Total trabajadoras: ${workers.length}`);
      workers.forEach((worker, index) => {
// // console.log(`   ${index + 1}. ${worker.name} ${worker.surname}`);
// // console.log(`      Email: ${worker.email}`);
// // console.log(`      Tipo: ${worker.worker_type}`);
// // console.log(`      Días: ${worker.availability_days?.join(', ') || 'No configurado'}`);
// // console.log(`      Estado: ${worker.is_active ? 'ACTIVA' : 'INACTIVA'}`);
// // console.log('');
      });
    }

// // console.log('='.repeat(60) + '\n');

    // 2. Verificar usuarios
// // console.log('👤 USUARIOS:');
// // console.log('============');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (usersError) {
// // console.log(`   ❌ Error: ${usersError.message}`);
    } else {
// // console.log(`   ✅ Total usuarios: ${users.length}`);
      users.forEach((user, index) => {
// // console.log(`   ${index + 1}. ${user.name} ${user.surname}`);
// // console.log(`      Email: ${user.email}`);
// // console.log(`      Dirección: ${user.address || 'No especificada'}`);
// // console.log(`      Teléfono: ${user.phone || 'No especificado'}`);
// // console.log('');
      });
    }

// // console.log('='.repeat(60) + '\n');

    // 3. Verificar asignaciones
// // console.log('📋 ASIGNACIONES:');
// // console.log('================');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        users (name, surname, email),
        workers (name, surname, email, worker_type)
      `)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
// // console.log(`   ❌ Error: ${assignmentsError.message}`);
    } else {
// // console.log(`   ✅ Total asignaciones: ${assignments.length}`);
      assignments.forEach((assignment, index) => {
// // console.log(`   ${index + 1}. ${assignment.users?.name} ${assignment.users?.surname}`);
// // console.log(`      Trabajadora: ${assignment.workers?.name} ${assignment.workers?.surname} (${assignment.workers?.worker_type})`);
// // console.log(`      Horario: ${JSON.stringify(assignment.schedule)}`);
// // console.log(`      Creada: ${new Date(assignment.created_at).toLocaleDateString()}`);
// // console.log('');
      });
    }

// // console.log('='.repeat(60) + '\n');

    // 4. Verificar balances mensuales
// // console.log('💰 BALANCES MENSUALES:');
// // console.log('======================');
    const { data: balances, error: balancesError } = await supabase
      .from('monthly_hours')
      .select('*')
      .order('created_at', { ascending: false });

    if (balancesError) {
// // console.log(`   ❌ Error: ${balancesError.message}`);
    } else {
// // console.log(`   ✅ Total balances: ${balances.length}`);
      balances.forEach((balance, index) => {
// // console.log(`   ${index + 1}. Usuario ID: ${balance.user_id}`);
// // console.log(`      Mes/Año: ${balance.month}/${balance.year}`);
// // console.log(`      Horas asignadas: ${balance.assigned_hours}h`);
// // console.log(`      Horas utilizadas: ${balance.used_hours}h`);
// // console.log(`      Balance: ${balance.balance_hours}h`);
// // console.log(`      Creado: ${new Date(balance.created_at).toLocaleDateString()}`);
// // console.log('');
      });
    }

// // console.log('='.repeat(60) + '\n');

    // 5. Verificar festivos
// // console.log('🎉 FESTIVOS:');
// // console.log('============');
    const { data: holidays, error: holidaysError } = await supabase
      .from('local_holidays')
      .select('*')
      .order('date');

    if (holidaysError) {
// // console.log(`   ❌ Error: ${holidaysError.message}`);
    } else {
// // console.log(`   ✅ Total festivos: ${holidays.length}`);
      holidays.forEach((holiday, index) => {
// // console.log(`   ${index + 1}. ${holiday.name}`);
// // console.log(`      Fecha: ${holiday.date}`);
// // console.log(`      Tipo: ${holiday.type}`);
// // console.log('');
      });
    }

// // console.log('='.repeat(60) + '\n');

    // 6. Resumen del sistema
// // console.log('📊 RESUMEN DEL SISTEMA:');
// // console.log('========================');
// // console.log(`   👷 Trabajadoras: ${workers?.length || 0}`);
// // console.log(`   👤 Usuarios: ${users?.length || 0}`);
// // console.log(`   📋 Asignaciones: ${assignments?.length || 0}`);
// // console.log(`   💰 Balances: ${balances?.length || 0}`);
// // console.log(`   🎉 Festivos: ${holidays?.length || 0}`);
// // console.log('');
// // console.log('   ✅ Sistema listo para pruebas');
// // console.log('   🔧 Próximo paso: Generar balances para Julio 2025');

  } catch (error) {
    console.error('Error general:', error);
  }
}

verifySystemStatus(); 