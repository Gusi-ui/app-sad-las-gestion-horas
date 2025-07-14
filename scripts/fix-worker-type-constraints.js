const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fixWorkerTypeConstraints() {
  try {
// // console.log('🔧 Arreglando restricciones de worker_type...\n');

    // 1. Verificar estructura real de worker_profiles
// // console.log('📋 Verificando estructura de worker_profiles:');
// // console.log('=============================================');
    
    // Intentar diferentes estructuras
    const possibleStructures = [
      { first_name: 'Test', last_name: 'Test', email: 'test@test.com', worker_type: 'laborable' },
      { worker_name: 'Test', worker_surname: 'Test', email: 'test@test.com', worker_type: 'laborable' },
      { name: 'Test', surname: 'Test', email: 'test@test.com', worker_type: 'laborable' }
    ];

    for (let i = 0; i < possibleStructures.length; i++) {
      const structure = possibleStructures[i];
      try {
        const { error } = await supabase
          .from('worker_profiles')
          .insert([structure]);
        
        if (error) {
// // console.log(`   ❌ Estructura ${i + 1}: ${error.message}`);
          if (error.message.includes('name')) {
// // console.log(`      La tabla no tiene columna 'name'`);
          }
        } else {
// // console.log(`   ✅ Estructura ${i + 1}: Funciona`);
          // Limpiar
          await supabase
            .from('worker_profiles')
            .delete()
            .eq('email', 'test@test.com');
          break;
        }
      } catch (e) {
// // console.log(`   ❌ Estructura ${i + 1}: Error inesperado`);
      }
    }

// // console.log('\n' + '='.repeat(60) + '\n');

    // 2. Verificar qué valores están permitidos en worker_profiles
// // console.log('🔍 Verificando valores permitidos en worker_profiles:');
// // console.log('===================================================');
    
    const testValues = ['laborable', 'holiday_weekend', 'both', 'worker', 'admin'];
    
    for (const value of testValues) {
      try {
        // Usar la estructura que sabemos que funciona
        const { error } = await supabase
          .from('worker_profiles')
          .insert([{
            first_name: `Test_${value}`,
            last_name: 'Test',
            email: `test_${value}@test.com`,
            worker_type: value
          }]);
        
        if (error) {
// // console.log(`   ❌ "${value}": ${error.message}`);
          if (error.code === '23514') {
// // console.log(`      ❌ VALOR NO PERMITIDO - Restricción check constraint`);
          }
        } else {
// // console.log(`   ✅ "${value}": PERMITIDO`);
          // Limpiar
          await supabase
            .from('worker_profiles')
            .delete()
            .eq('email', `test_${value}@test.com`);
        }
      } catch (e) {
// // console.log(`   ❌ "${value}": Error inesperado`);
      }
    }

// // console.log('\n' + '='.repeat(60) + '\n');

    // 3. Verificar si necesitamos actualizar las restricciones
// // console.log('🔧 Recomendaciones:');
// // console.log('===================');
// // console.log('   1. Si "laborable" no está permitido, necesitamos actualizar');
// // console.log('      la restricción check constraint en worker_profiles');
// // console.log('');
// // console.log('   2. Los valores que deberían estar permitidos son:');
// // console.log('      - laborable');
// // console.log('      - holiday_weekend');
// // console.log('      - both');
// // console.log('');
// // console.log('   3. Si hay problemas, podemos:');
// // console.log('      - Actualizar la restricción en Supabase Dashboard');
// // console.log('      - O crear una migración SQL');

  } catch (error) {
    console.error('Error general:', error);
  }
}

fixWorkerTypeConstraints(); 