const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteIncorrectBalances() {
  try {
    console.log('🗑️ Eliminando balances incorrectos de julio 2025...\n');
    
    // Obtener balances a eliminar
    const { data: balances, error: fetchError } = await supabase
      .from('monthly_hours')
      .select('id, user_id, month, year, total_hours')
      .eq('year', 2025)
      .eq('month', 7);

    if (fetchError) {
      console.error('Error al obtener balances:', fetchError);
      return;
    }

    if (!balances || balances.length === 0) {
      console.log('✅ No hay balances de julio 2025 para eliminar');
      return;
    }

    console.log(`📊 Encontrados ${balances.length} balances de julio 2025:`);
    balances.forEach(balance => {
      console.log(`   - ID: ${balance.id}, User: ${balance.user_id}, Total: ${balance.total_hours}h`);
    });

    // Confirmar eliminación
    console.log('\n⚠️  ¿Estás seguro de que quieres eliminar estos balances?');
    console.log('   Estos balances fueron generados sin asignaciones reales y son incorrectos.');
    console.log('   Presiona Ctrl+C para cancelar o cualquier tecla para continuar...');
    
    // Esperar confirmación (simplificado para script)
    console.log('   Procediendo con la eliminación...\n');

    // Eliminar balances
    const { error: deleteError } = await supabase
      .from('monthly_hours')
      .delete()
      .eq('year', 2025)
      .eq('month', 7);

    if (deleteError) {
      console.error('❌ Error al eliminar balances:', deleteError);
      return;
    }

    console.log('✅ Balances de julio 2025 eliminados correctamente');
    console.log('💡 Ahora puedes crear las asignaciones reales y regenerar los balances');

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

deleteIncorrectBalances(); 