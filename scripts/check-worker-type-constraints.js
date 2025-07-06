const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkWorkerTypeConstraints() {
  try {
    console.log('🔍 Verificando restricciones de worker_type...\n');

    // 1. Verificar tabla workers
    console.log('📋 Tabla "workers":');
    console.log('==================');
    
    // Intentar insertar diferentes valores para worker_type
    const testValues = ['laborable', 'holiday_weekend', 'both', 'worker', 'admin'];
    
    for (const value of testValues) {
      try {
        const { error } = await supabase
          .from('workers')
          .insert([{
            name: `Test_${value}`,
            surname: 'Test',
            email: `test_${value}@test.com`,
            worker_type: value,
            is_active: true
          }]);
        
        if (error) {
          console.log(`   ❌ "${value}": ${error.message}`);
          if (error.code === '23514') {
            console.log(`      Error de restricción check constraint`);
          }
        } else {
          console.log(`   ✅ "${value}": Permitido`);
          // Limpiar el registro de prueba
          await supabase
            .from('workers')
            .delete()
            .eq('email', `test_${value}@test.com`);
        }
      } catch (e) {
        console.log(`   ❌ "${value}": Error inesperado`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Verificar tabla worker_profiles
    console.log('📋 Tabla "worker_profiles":');
    console.log('===========================');
    
    for (const value of testValues) {
      try {
        const { error } = await supabase
          .from('worker_profiles')
          .insert([{
            name: `Test_${value}`,
            surname: 'Test',
            email: `test_${value}@test.com`,
            worker_type: value
          }]);
        
        if (error) {
          console.log(`   ❌ "${value}": ${error.message}`);
          if (error.code === '23514') {
            console.log(`      Error de restricción check constraint`);
          }
        } else {
          console.log(`   ✅ "${value}": Permitido`);
          // Limpiar el registro de prueba
          await supabase
            .from('worker_profiles')
            .delete()
            .eq('email', `test_${value}@test.com`);
        }
      } catch (e) {
        console.log(`   ❌ "${value}": Error inesperado`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 3. Verificar estructura actual
    console.log('🏗️ Estructura actual:');
    console.log('=====================');
    
    // Verificar qué valores están permitidos actualmente
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('worker_type')
      .limit(10);
    
    if (!workersError && workers && workers.length > 0) {
      const types = [...new Set(workers.map(w => w.worker_type))];
      console.log('   Tipos encontrados en workers:', types);
    } else {
      console.log('   No hay datos en workers para verificar tipos');
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('worker_profiles')
      .select('worker_type')
      .limit(10);
    
    if (!profilesError && profiles && profiles.length > 0) {
      const types = [...new Set(profiles.map(p => p.worker_type))];
      console.log('   Tipos encontrados en worker_profiles:', types);
    } else {
      console.log('   No hay datos en worker_profiles para verificar tipos');
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

checkWorkerTypeConstraints(); 