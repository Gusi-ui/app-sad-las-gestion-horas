const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fixWorkerProfilesConstraint() {
  try {
    console.log('🔧 Arreglando completamente la restricción de worker_profiles...\n');

    // 1. Verificar estado actual
    console.log('📋 Estado actual de worker_profiles:');
    console.log('=====================================');
    
    const { data: currentData, error: currentError } = await supabase
      .from('worker_profiles')
      .select('*');

    if (currentError) {
      console.log('   ❌ Error obteniendo datos:', currentError.message);
      return;
    }

    console.log(`   Total registros: ${currentData.length}`);
    if (currentData.length > 0) {
      const types = [...new Set(currentData.map(r => r.worker_type))];
      console.log('   Tipos actuales:', types);
      
      currentData.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}, Email: ${record.email}, Type: ${record.worker_type}`);
      });
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Verificar si hay valores problemáticos
    console.log('🔍 Verificando valores problemáticos:');
    console.log('=====================================');
    
    const problematicTypes = currentData.filter(r => 
      !['laborable', 'holiday_weekend', 'both'].includes(r.worker_type)
    );

    if (problematicTypes.length > 0) {
      console.log(`   ❌ Encontrados ${problematicTypes.length} registros con tipos problemáticos:`);
      problematicTypes.forEach(record => {
        console.log(`      - ID: ${record.id}, Type: "${record.worker_type}"`);
      });
      
      console.log('\n   🔧 Recomendación: Actualizar estos valores antes de cambiar la restricción');
      console.log('   SQL para actualizar:');
      console.log('   UPDATE worker_profiles SET worker_type = \'laborable\' WHERE worker_type NOT IN (\'laborable\', \'holiday_weekend\', \'both\');');
    } else {
      console.log('   ✅ Todos los valores son válidos');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 3. Probar inserción con valores válidos
    console.log('🧪 Probando inserción con valores válidos:');
    console.log('===========================================');
    
    const testValues = ['laborable', 'holiday_weekend', 'both'];
    
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
            console.log(`      ❌ RESTRICCIÓN BLOQUEANDO - Necesitas actualizar la restricción`);
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

    // 4. Instrucciones finales
    console.log('📝 INSTRUCCIONES PARA ARREGLAR:');
    console.log('================================');
    console.log('');
    console.log('   1. Ve a Supabase Dashboard > SQL Editor');
    console.log('');
    console.log('   2. Ejecuta estos comandos en orden:');
    console.log('');
    console.log('   -- Paso 1: Actualizar valores problemáticos');
    console.log('   UPDATE worker_profiles SET worker_type = \'laborable\' WHERE worker_type NOT IN (\'laborable\', \'holiday_weekend\', \'both\');');
    console.log('');
    console.log('   -- Paso 2: Eliminar restricción actual');
    console.log('   ALTER TABLE worker_profiles DROP CONSTRAINT IF EXISTS worker_profiles_worker_type_check;');
    console.log('');
    console.log('   -- Paso 3: Agregar nueva restricción');
    console.log('   ALTER TABLE worker_profiles ADD CONSTRAINT worker_profiles_worker_type_check');
    console.log('   CHECK (worker_type IN (\'laborable\', \'holiday_weekend\', \'both\'));');
    console.log('');
    console.log('   3. Verifica que funciona:');
    console.log('   SELECT DISTINCT worker_type FROM worker_profiles;');

  } catch (error) {
    console.error('Error general:', error);
  }
}

fixWorkerProfilesConstraint(); 