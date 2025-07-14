const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkWorkerProfilesStructure() {
  try {
// // console.log('🔍 Verificando estructura real de worker_profiles...\n');

    // 1. Intentar obtener información de la estructura
// // console.log('📋 Intentando obtener estructura:');
// // console.log('==================================');
    
    // Intentar con select * limit 0 para ver la estructura
    const { data: structureTest, error: structureError } = await supabase
      .from('worker_profiles')
      .select('*')
      .limit(0);

    if (structureError) {
// // console.log('   ❌ Error accediendo a la estructura:', structureError.message);
    } else {
// // console.log('   ✅ Tabla accesible');
    }

// // console.log('\n' + '='.repeat(60) + '\n');

    // 2. Intentar diferentes combinaciones de columnas
// // console.log('🔍 Probando diferentes columnas:');
// // console.log('=================================');
    
    const possibleColumns = [
      'id',
      'email',
      'worker_type',
      'created_at',
      'updated_at',
      'user_id',
      'profile_id',
      'worker_id'
    ];

    for (const column of possibleColumns) {
      try {
        const { error } = await supabase
          .from('worker_profiles')
          .select(column)
          .limit(1);
        
        if (error) {
// // console.log(`   ❌ "${column}": ${error.message}`);
        } else {
// // console.log(`   ✅ "${column}": Existe`);
        }
      } catch (e) {
// // console.log(`   ❌ "${column}": Error inesperado`);
      }
    }

// // console.log('\n' + '='.repeat(60) + '\n');

    // 3. Verificar si hay datos existentes
// // console.log('📊 Verificando datos existentes:');
// // console.log('=================================');
    
    try {
      const { data: existingData, error: dataError } = await supabase
        .from('worker_profiles')
        .select('*')
        .limit(5);

      if (dataError) {
// // console.log('   ❌ Error obteniendo datos:', dataError.message);
      } else if (existingData && existingData.length > 0) {
// // console.log(`   ✅ Encontrados ${existingData.length} registros`);
// // console.log('   Estructura del primer registro:');
// // console.log('   ', JSON.stringify(existingData[0], null, 2));
      } else {
// // console.log('   ℹ️ No hay datos en la tabla');
      }
    } catch (e) {
// // console.log('   ❌ Error inesperado obteniendo datos');
    }

// // console.log('\n' + '='.repeat(60) + '\n');

    // 4. Verificar si la tabla realmente existe
// // console.log('🏗️ Verificando existencia de tabla:');
// // console.log('====================================');
    
    // Intentar una consulta simple
    try {
      const { count, error: countError } = await supabase
        .from('worker_profiles')
        .select('*', { count: 'exact', head: true });

      if (countError) {
// // console.log('   ❌ Error contando registros:', countError.message);
      } else {
// // console.log(`   ✅ Tabla existe. Total registros: ${count}`);
      }
    } catch (e) {
// // console.log('   ❌ Error verificando existencia de tabla');
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

checkWorkerProfilesStructure(); 