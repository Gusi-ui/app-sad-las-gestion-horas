const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDuplicates() {
  try {
    console.log('🧹 Limpiando duplicados de balances mensuales...\n');
    
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

    console.log(`📊 Total de balances encontrados: ${balances.length}\n`);

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
    
    if (duplicates.length === 0) {
      console.log('✅ No se encontraron duplicados para limpiar');
      return;
    }

    console.log(`⚠️  Encontrados ${duplicates.length} grupos con duplicados\n`);

    // Obtener información de usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, surname');

    if (usersError) {
      console.error('Error al obtener usuarios:', usersError);
      return;
    }

    const idsToDelete = [];

    duplicates.forEach(([key, balances]) => {
      const [userId, year, month] = key.split('-');
      const user = users.find(u => u.id === userId);
      const userName = user ? `${user.name} ${user.surname}` : `Usuario ${userId}`;
      
      console.log(`👤 ${userName} | Mes: ${month}/${year}`);
      console.log(`   Manteniendo el registro más reciente: ${balances[0].id}`);
      
      // Mantener el primer registro (más reciente) y eliminar el resto
      for (let i = 1; i < balances.length; i++) {
        idsToDelete.push(balances[i].id);
        console.log(`   Eliminando: ${balances[i].id}`);
      }
      console.log('');
    });

    if (idsToDelete.length === 0) {
      console.log('✅ No hay registros para eliminar');
      return;
    }

    console.log(`🗑️  Eliminando ${idsToDelete.length} registros duplicados...\n`);

    // Eliminar los duplicados
    const { error: deleteError } = await supabase
      .from('monthly_hours')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('❌ Error al eliminar duplicados:', deleteError);
      return;
    }

    console.log('✅ Duplicados eliminados correctamente\n');

    // Verificar resultado
    const { data: remainingBalances, error: remainingError } = await supabase
      .from('monthly_hours')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (remainingError) {
      console.error('Error al verificar balances restantes:', remainingError);
      return;
    }

    console.log(`📊 Balances restantes: ${remainingBalances.length}\n`);

    // Mostrar resumen final
    const finalGrouped = {};
    remainingBalances.forEach(balance => {
      const key = `${balance.user_id}-${balance.year}-${balance.month}`;
      if (!finalGrouped[key]) {
        finalGrouped[key] = [];
      }
      finalGrouped[key].push(balance);
    });

    const finalDuplicates = Object.entries(finalGrouped).filter(([key, balances]) => balances.length > 1);
    
    if (finalDuplicates.length === 0) {
      console.log('✅ Verificación completada: No quedan duplicados');
    } else {
      console.log(`⚠️  Aún quedan ${finalDuplicates.length} grupos con duplicados`);
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

cleanDuplicates(); 