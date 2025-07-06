const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testWorkerProfilesInsert() {
  try {
    console.log('🧪 Probando inserción en worker_profiles...\n');

    // 1. Probar con la estructura corregida
    console.log('📋 Probando estructura corregida:');
    console.log('==================================');
    
    const testValues = ['laborable', 'holiday_weekend', 'both', 'worker', 'admin'];
    
    for (const value of testValues) {
      try {
        const testId = `00000000-0000-0000-0000-${Math.random().toString(36).substr(2, 12)}`;
        const testEmail = `test_${value}_${Date.now()}@test.com`;
        
        const { error } = await supabase
          .from('worker_profiles')
          .insert({
            id: testId,
            email: testEmail,
            worker_type: value,
            created_at: new Date().toISOString()
          });
        
        if (error) {
          console.log(`   ❌ "${value}": ${error.message}`);
          if (error.code === '23514') {
            console.log(`      ❌ VALOR NO PERMITIDO - Restricción check constraint`);
          }
        } else {
          console.log(`   ✅ "${value}": PERMITIDO`);
          // Limpiar
          await supabase
            .from('worker_profiles')
            .delete()
            .eq('id', testId);
        }
      } catch (e) {
        console.log(`   ❌ "${value}": Error inesperado`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Verificar qué valores están permitidos actualmente
    console.log('🔍 Verificando restricción actual:');
    console.log('==================================');
    console.log('   Si "laborable" no está permitido, necesitamos actualizar');
    console.log('   la restricción check constraint en worker_profiles');
    console.log('');
    console.log('   SQL para actualizar la restricción:');
    console.log('   ALTER TABLE worker_profiles DROP CONSTRAINT IF EXISTS worker_profiles_worker_type_check;');
    console.log('   ALTER TABLE worker_profiles ADD CONSTRAINT worker_profiles_worker_type_check');
    console.log('   CHECK (worker_type IN (\'laborable\', \'holiday_weekend\', \'both\'));');

  } catch (error) {
    console.error('Error general:', error);
  }
}

testWorkerProfilesInsert(); 