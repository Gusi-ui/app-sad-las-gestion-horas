const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWorkersSchema() {
  try {
// // console.log('🔍 Verificando estructura de la tabla workers...\n');
    
    // Intentar obtener información de la tabla
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .limit(1);

    if (workersError) {
      console.error('Error al consultar tabla workers:', workersError);
      return;
    }

    if (workers && workers.length > 0) {
// // console.log('📋 Estructura de la tabla workers (basada en datos existentes):');
      const firstWorker = workers[0];
      Object.keys(firstWorker).forEach(field => {
// // console.log(`   - ${field}: ${typeof firstWorker[field]} = ${firstWorker[field]}`);
      });
    } else {
// // console.log('📋 Tabla workers está vacía');
    }

    // Intentar crear una trabajadora con campos mínimos
// // console.log('\n🧪 Probando inserción con campos mínimos...');
    
    const testWorker = {
      name: 'Test',
      surname: 'Worker',
      email: 'test@example.com',
      phone: '+34 600 000 000'
    };

    const { data: testResult, error: testError } = await supabase
      .from('workers')
      .insert([testWorker])
      .select();

    if (testError) {
      console.error('❌ Error con campos mínimos:', testError);
      
      // Intentar con solo campos básicos
// // console.log('\n🧪 Probando con solo campos básicos...');
      const basicWorker = {
        name: 'Test',
        surname: 'Worker'
      };

      const { data: basicResult, error: basicError } = await supabase
        .from('workers')
        .insert([basicWorker])
        .select();

      if (basicError) {
        console.error('❌ Error con campos básicos:', basicError);
      } else {
// // console.log('✅ Inserción básica exitosa');
// // console.log('📋 Campos que funcionan:', Object.keys(basicWorker));
      }
    } else {
// // console.log('✅ Inserción mínima exitosa');
// // console.log('📋 Campos que funcionan:', Object.keys(testWorker));
      
      // Limpiar el registro de prueba
      if (testResult && testResult.length > 0) {
        await supabase
          .from('workers')
          .delete()
          .eq('id', testResult[0].id);
// // console.log('🧹 Registro de prueba eliminado');
      }
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

checkWorkersSchema(); 