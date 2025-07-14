require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyJuly2025Balances() {
  try {
// // console.log('🔍 Verificando balances de Julio 2025 generados...\n');

    // 1. Obtener todos los balances de julio 2025
    const { data: balances, error: balancesError } = await supabase
      .from('monthly_hours')
      .select(`
        id,
        user_id,
        month,
        year,
        total_hours,
        laborable_hours,
        holiday_hours,
        assigned_hours,
        difference,
        holiday_info,
        created_at,
        updated_at,
        users!inner(
          id,
          name,
          surname,
          monthly_hours
        )
      `)
      .eq('month', 7)
      .eq('year', 2025)
      .order('users(name)');

    if (balancesError) {
      throw balancesError;
    }

    if (!balances || balances.length === 0) {
// // console.log('❌ No se encontraron balances para Julio 2025');
      return;
    }

// // console.log(`✅ Encontrados ${balances.length} balances para Julio 2025\n`);

    // 2. Mostrar resumen de cada balance
    let totalAssignedHours = 0;
    let totalComputedHours = 0;
    let totalDifference = 0;

    for (const balance of balances) {
      const user = balance.users;
// // console.log(`👤 ${user.name} ${user.surname}:`);
// // console.log(`   📊 Horas asignadas: ${balance.assigned_hours || 0}h`);
// // console.log(`   📅 Horas laborables: ${balance.laborable_hours?.toFixed(1) || 0}h`);
// // console.log(`   🌟 Horas festivos: ${balance.holiday_hours?.toFixed(1) || 0}h`);
// // console.log(`   📈 Total computado: ${balance.total_hours?.toFixed(1) || 0}h`);
      
      const difference = balance.difference || 0;
      const differenceText = difference > 0 ? `+${difference.toFixed(1)}h` : `${difference.toFixed(1)}h`;
// // console.log(`   ⚖️  Diferencia: ${differenceText}`);
      
      if (balance.holiday_info) {
        const info = balance.holiday_info;
// // console.log(`   📅 Días laborables: ${info.laborable_days?.length || 0}`);
// // console.log(`   🌟 Días festivos/fines de semana: ${info.holiday_weekend_days?.length || 0}`);
        
        if (info.workers && info.workers.length > 0) {
// // console.log(`   👥 Trabajadoras involucradas:`);
          info.workers.forEach(worker => {
// // console.log(`      - ${worker.worker_name} (${worker.worker_type}): ${worker.total_hours?.toFixed(1) || 0}h`);
          });
        }
      }
      
// // console.log(`   📅 Creado: ${new Date(balance.created_at).toLocaleString()}`);
// // console.log('');

      totalAssignedHours += balance.assigned_hours || 0;
      totalComputedHours += balance.total_hours || 0;
      totalDifference += balance.difference || 0;
    }

    // 3. Resumen general
// // console.log('📋 RESUMEN GENERAL:');
// // console.log(`   👥 Total usuarios: ${balances.length}`);
// // console.log(`   📊 Total horas asignadas: ${totalAssignedHours.toFixed(1)}h`);
// // console.log(`   📈 Total horas computadas: ${totalComputedHours.toFixed(1)}h`);
// // console.log(`   ⚖️  Diferencia total: ${totalDifference > 0 ? '+' : ''}${totalDifference.toFixed(1)}h`);
// // console.log('');

    // 4. Verificar casos especiales
// // console.log('🔍 CASOS ESPECIALES:');
    
    // Usuario con reasignación (José Martínez)
    const joseBalance = balances.find(b => b.users.name.includes('Jose') || b.users.name.includes('José'));
    if (joseBalance) {
// // console.log(`   ✅ José Martínez: ${joseBalance.total_hours?.toFixed(1)}h computadas`);
      if (joseBalance.holiday_hours > 0) {
// // console.log(`      🌟 Incluye ${joseBalance.holiday_hours.toFixed(1)}h de festivos/fines de semana`);
      }
    }

    // Usuarios con diferencias significativas
    const significantDifferences = balances.filter(b => Math.abs(b.difference || 0) > 1);
    if (significantDifferences.length > 0) {
// // console.log(`   ⚠️  Usuarios con diferencias > 1h: ${significantDifferences.length}`);
      significantDifferences.forEach(b => {
// // console.log(`      - ${b.users.name} ${b.users.surname}: ${b.difference > 0 ? '+' : ''}${b.difference?.toFixed(1)}h`);
      });
    } else {
// // console.log(`   ✅ Todas las diferencias son menores a 1h`);
    }

// // console.log('\n🎉 Verificación completada exitosamente!');
// // console.log('   Los balances están listos para ser utilizados en la aplicación.');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    if (error.details) {
      console.error('Detalles:', error.details);
    }
  }
}

// Ejecutar la verificación
verifyJuly2025Balances(); 