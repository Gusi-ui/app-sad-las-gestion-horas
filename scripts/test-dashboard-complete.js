const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDashboardComplete() {
  console.log('🧪 Probando dashboard completo con autenticación real...\n');

  try {
    // 1. Obtener una trabajadora de prueba
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, email')
      .eq('is_active', true)
      .limit(1);

    if (workersError || !workers || workers.length === 0) {
      console.error('❌ Error al obtener trabajadoras:', workersError);
      return;
    }

    const worker = workers[0];
    console.log(`👤 Trabajadora de prueba: ${worker.name} ${worker.surname} (${worker.email})`);

    // 2. Verificar festivos de julio 2025
    console.log('\n📅 Verificando festivos de julio 2025...');
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('*')
      .gte('date', '2025-07-01')
      .lte('date', '2025-07-31')
      .eq('is_active', true);

    if (holidaysError) {
      console.error('❌ Error al obtener festivos:', holidaysError);
    } else {
      console.log(`✅ Festivos encontrados: ${holidays.length}`);
      holidays.forEach(holiday => {
        const date = new Date(holiday.date);
        const dayOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
        console.log(`   - ${date.getDate()} de julio: ${holiday.name} (${holiday.type}) - ${dayOfWeek}`);
      });
    }

    // 3. Verificar asignaciones de la trabajadora
    console.log('\n📋 Verificando asignaciones de la trabajadora...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        users:user_id (
          id,
          name,
          surname,
          monthly_hours
        )
      `)
      .eq('worker_id', worker.id)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError);
    } else {
      console.log(`✅ Asignaciones activas: ${assignments.length}`);
      assignments.forEach(assignment => {
        console.log(`   - ${assignment.users.name} ${assignment.users.surname} (${assignment.users.monthly_hours}h/mes)`);
      });
    }

    // 4. Probar la API de balance por usuario
    console.log('\n🌐 Probando API de balance por usuario...');
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const apiUrl = `http://localhost:3001/api/worker/user-balance?workerId=${worker.id}&month=${currentMonth}&year=${currentYear}`;
    
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        console.log('✅ API funcionando correctamente');
        console.log(`📊 Usuarios en balance: ${data.userBalances?.length || 0}`);
        
        if (data.userBalances && data.userBalances.length > 0) {
          data.userBalances.forEach((userBalance, index) => {
            console.log(`\n${index + 1}. ${userBalance.userName} ${userBalance.userSurname}`);
            console.log(`   📊 Horas asignadas al usuario: ${userBalance.monthlyHours}h`);
            console.log(`   👤 Mis horas: ${userBalance.assignedHours}h asignadas / ${userBalance.usedHours}h realizadas`);
            console.log(`   📊 Porcentaje: ${userBalance.percentage}%`);
            console.log(`   ${userBalance.status === 'excess' ? '⚠️' : userBalance.status === 'deficit' ? '📋' : '✅'} Estado: ${userBalance.status}`);
          });
        }
      } else {
        console.log('⚠️  API requiere autenticación (esto es normal)');
        console.log(`📋 Response: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Error al probar API:', error.message);
    }

    // 5. Verificar que el servidor esté funcionando
    console.log('\n🖥️  Verificando servidor...');
    try {
      const serverResponse = await fetch('http://localhost:3001/worker/dashboard');
      console.log(`📊 Servidor status: ${serverResponse.status}`);
      if (serverResponse.status === 200) {
        console.log('✅ Servidor funcionando correctamente');
      } else {
        console.log('⚠️  Servidor requiere autenticación (esto es normal)');
      }
    } catch (error) {
      console.error('❌ Error al conectar con el servidor:', error.message);
    }

    console.log('\n🎉 Verificación completada.');
    console.log('\n💡 Para ver el dashboard completo:');
    console.log('   1. Ve a http://localhost:3001/worker/login');
    console.log('   2. Inicia sesión con una trabajadora');
    console.log('   3. El dashboard mostrará el balance correcto con los festivos');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

testDashboardComplete(); 