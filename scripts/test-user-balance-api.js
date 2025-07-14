const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserBalanceAPI() {
  console.log('🧪 Probando la API de balance por usuario...\n');

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

    // 2. Crear un token de sesión para la trabajadora
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: worker.email,
      password: 'password123' // Asumiendo que existe esta contraseña
    });

    if (authError) {
      console.log('⚠️  No se pudo autenticar, probando sin autenticación...');
      // Continuar sin autenticación para probar la estructura
    } else {
      console.log('✅ Autenticación exitosa');
    }

    // 3. Probar la API
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const apiUrl = `http://localhost:3001/api/worker/user-balance?workerId=${worker.id}&month=${currentMonth}&year=${currentYear}`;
    
    console.log(`\n🌐 Probando API: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ API funcionando correctamente');
      
      if (data.userBalances && data.userBalances.length > 0) {
        console.log(`\n📊 Balance encontrado para ${data.userBalances.length} usuarios:`);
        
        data.userBalances.forEach((userBalance, index) => {
          console.log(`\n${index + 1}. ${userBalance.userName} ${userBalance.userSurname}`);
          console.log(`   📍 Dirección: ${userBalance.userAddress || 'No especificada'}`);
          console.log(`   ⏰ Horas asignadas al usuario: ${userBalance.monthlyHours}h`);
          console.log(`   👤 Mis horas: ${userBalance.assignedHours}h asignadas / ${userBalance.usedHours}h realizadas`);
          console.log(`   📊 Porcentaje completado: ${userBalance.percentage}%`);
          console.log(`   ${userBalance.status === 'excess' ? '⚠️' : userBalance.status === 'deficit' ? '📋' : '✅'} Estado: ${userBalance.status}`);
          
          if (userBalance.remainingHours > 0) {
            console.log(`   📋 Horas pendientes en total: ${userBalance.remainingHours}h`);
          } else if (userBalance.remainingHours < 0) {
            console.log(`   ⚠️  Exceso de horas en total: ${Math.abs(userBalance.remainingHours)}h`);
          } else {
            console.log(`   ✅ Balance perfecto`);
          }
        });

        console.log(`\n🎯 RESUMEN GENERAL:`);
        console.log(`   👤 Trabajadora: ${data.workerName}`);
        console.log(`   📊 Total mis horas asignadas: ${data.totalAssignedHours}h`);
        console.log(`   ✅ Total mis horas realizadas: ${data.totalUsedHours}h`);
        console.log(`   ${data.totalRemainingHours > 0 ? '📋' : '⚠️'} Total mis horas ${data.totalRemainingHours > 0 ? 'pendientes' : 'de exceso'}: ${Math.abs(data.totalRemainingHours)}h`);
        console.log(`   ${data.overallStatus === 'excess' ? '⚠️' : data.overallStatus === 'deficit' ? '📋' : '✅'} Estado general: ${data.overallStatus}`);
      } else {
        console.log('⚠️  No se encontraron balances de usuarios');
      }
    } else {
      console.log('❌ Error en la API:', data.error);
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

testUserBalanceAPI(); 