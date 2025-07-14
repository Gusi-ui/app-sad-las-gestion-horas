const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBalances() {
  try {
// // console.log('🔍 Debuggeando balances mensuales...\n');
    
    // Obtener todos los balances
    const { data: balances, error } = await supabase
      .from('monthly_hours')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error al obtener balances:', error);
      return;
    }

// // console.log(`📊 Total de balances encontrados: ${balances.length}\n`);

    // Agrupar por usuario y mes/año
    const groupedBalances = {};
    balances.forEach(balance => {
      const key = `${balance.user_id}-${balance.year}-${balance.month}`;
      if (!groupedBalances[key]) {
        groupedBalances[key] = [];
      }
      groupedBalances[key].push(balance);
    });

    // Encontrar duplicados
    const duplicates = Object.entries(groupedBalances).filter(([key, balances]) => balances.length > 1);
    
    if (duplicates.length > 0) {
// // console.log('⚠️  DUPLICADOS ENCONTRADOS:');
// // console.log('========================\n');
      
      duplicates.forEach(([key, balances]) => {
        const [userId, year, month] = key.split('-');
// // console.log(`👤 Usuario: ${userId} | Mes: ${month}/${year}`);
// // console.log(`📈 Número de registros: ${balances.length}`);
        
        balances.forEach((balance, index) => {
// // console.log(`  ${index + 1}. ID: ${balance.id}`);
// // console.log(`     Asignadas: ${balance.assigned_hours}h | Laborables: ${balance.laborable_hours}h | Festivos: ${balance.holiday_hours}h | Diferencia: ${balance.difference}h`);
// // console.log(`     Creado: ${balance.created_at}`);
// // console.log(`     Actualizado: ${balance.updated_at}`);
// // console.log('');
        });
// // console.log('---');
      });
    } else {
// // console.log('✅ No se encontraron duplicados');
    }

    // Mostrar resumen por usuario
// // console.log('\n📋 RESUMEN POR USUARIO:');
// // console.log('======================\n');

    const userSummary = {};
    balances.forEach(balance => {
      if (!userSummary[balance.user_id]) {
        userSummary[balance.user_id] = [];
      }
      userSummary[balance.user_id].push(balance);
    });

    // Obtener información de usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, surname, is_active');

    if (usersError) {
      console.error('Error al obtener usuarios:', usersError);
      return;
    }

    Object.entries(userSummary).forEach(([userId, userBalances]) => {
      const user = users.find(u => u.id === userId);
      const userName = user ? `${user.name} ${user.surname}` : `Usuario ${userId}`;
      const status = user?.is_active ? 'Activo' : 'Inactivo';
      
// // console.log(`👤 ${userName} (${status})`);
// // console.log(`   Total de balances: ${userBalances.length}`);
      
      // Agrupar por mes/año
      const byPeriod = {};
      userBalances.forEach(balance => {
        const key = `${balance.year}-${balance.month}`;
        if (!byPeriod[key]) {
          byPeriod[key] = [];
        }
        byPeriod[key].push(balance);
      });

      Object.entries(byPeriod).forEach(([period, periodBalances]) => {
        const [year, month] = period.split('-');
// // console.log(`   📅 ${month}/${year}: ${periodBalances.length} registro(s)`);
        
        if (periodBalances.length > 1) {
// // console.log(`      ⚠️  DUPLICADO - ${periodBalances.length} registros para este período`);
        }
        
        periodBalances.forEach((balance, index) => {
// // console.log(`      ${index + 1}. Asignadas: ${balance.assigned_hours}h | Laborables: ${balance.laborable_hours}h | Festivos: ${balance.holiday_hours}h | Diferencia: ${balance.difference}h`);
        });
      });
// // console.log('');
    });

    // Verificar balances específicos para Julio 2025
// // console.log('\n🎯 BALANCES JULIO 2025:');
// // console.log('======================\n');
    
    const july2025Balances = balances.filter(b => b.year === 2025 && b.month === 7);
// // console.log(`Total balances Julio 2025: ${july2025Balances.length}\n`);
    
    july2025Balances.forEach(balance => {
      const user = users.find(u => u.id === balance.user_id);
      const userName = user ? `${user.name} ${user.surname}` : `Usuario ${balance.user_id}`;
      
// // console.log(`👤 ${userName}`);
// // console.log(`   ID: ${balance.id}`);
// // console.log(`   Asignadas: ${balance.assigned_hours}h`);
// // console.log(`   Laborables: ${balance.laborable_hours}h`);
// // console.log(`   Festivos: ${balance.holiday_hours}h`);
// // console.log(`   Diferencia: ${balance.difference}h`);
// // console.log(`   Creado: ${balance.created_at}`);
// // console.log(`   Actualizado: ${balance.updated_at}`);
// // console.log('');
    });

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

debugBalances(); 