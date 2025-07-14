const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createWorkerAccounts() {
// // console.log('🔧 CREANDO CUENTAS DE AUTENTICACIÓN PARA TRABAJADORAS');
// // console.log('='.repeat(60));

  try {
    // 1. Obtener todas las trabajadoras sin auth_user_id
// // console.log('\n1️⃣ Obteniendo trabajadoras sin cuenta de autenticación...');
    
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, email, employee_code')
      .is('auth_user_id', null)
      .eq('is_active', true);

    if (workersError) {
      console.error('❌ Error al obtener trabajadoras:', workersError);
      return;
    }

    if (!workers || workers.length === 0) {
// // console.log('✅ Todas las trabajadoras ya tienen cuentas de autenticación');
      return;
    }

// // console.log(`📋 Encontradas ${workers.length} trabajadoras sin cuenta:`);
    workers.forEach(worker => {
// // console.log(`   - ${worker.name} ${worker.surname} (${worker.email || 'Sin email'})`);
    });

    // 2. Crear cuentas de autenticación
// // console.log('\n2️⃣ Creando cuentas de autenticación...');
    
    const results = [];
    
    for (const worker of workers) {
      try {
        // Generar email si no existe
        const email = worker.email || `${worker.employee_code.toLowerCase()}@sadlas.com`;
        
        // Generar contraseña temporal
        const tempPassword = generateTempPassword();
        
// // console.log(`\n   🔧 Creando cuenta para ${worker.name} ${worker.surname}...`);
// // console.log(`      Email: ${email}`);
// // console.log(`      Contraseña temporal: ${tempPassword}`);

        // Crear usuario en Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            role: 'worker',
            worker_id: worker.id,
            name: worker.name,
            surname: worker.surname
          }
        });

        if (authError) {
// // console.log(`   ❌ Error al crear cuenta: ${authError.message}`);
          results.push({
            worker: worker,
            success: false,
            error: authError.message
          });
          continue;
        }

        // Actualizar trabajadora con auth_user_id
        const { error: updateError } = await supabase
          .from('workers')
          .update({ auth_user_id: authUser.user.id })
          .eq('id', worker.id);

        if (updateError) {
// // console.log(`   ❌ Error al actualizar trabajadora: ${updateError.message}`);
          results.push({
            worker: worker,
            success: false,
            error: updateError.message
          });
          continue;
        }

// // console.log(`   ✅ Cuenta creada exitosamente`);
        results.push({
          worker: worker,
          success: true,
          authUser: authUser.user,
          email: email,
          tempPassword: tempPassword
        });

      } catch (error) {
// // console.log(`   ❌ Error inesperado: ${error.message}`);
        results.push({
          worker: worker,
          success: false,
          error: error.message
        });
      }
    }

    // 3. Mostrar resultados
// // console.log('\n3️⃣ Resumen de resultados:');
// // console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
// // console.log(`✅ Cuentas creadas exitosamente: ${successful.length}`);
// // console.log(`❌ Cuentas fallidas: ${failed.length}`);
    
    if (successful.length > 0) {
// // console.log('\n📋 CUENTAS CREADAS:');
// // console.log('='.repeat(60));
      successful.forEach(result => {
// // console.log(`\n👤 ${result.worker.name} ${result.worker.surname}`);
// // console.log(`   📧 Email: ${result.email}`);
// // console.log(`   🔑 Contraseña temporal: ${result.tempPassword}`);
// // console.log(`   🆔 Auth User ID: ${result.authUser.id}`);
// // console.log(`   📝 Código empleado: ${result.worker.employee_code}`);
      });
    }
    
    if (failed.length > 0) {
// // console.log('\n❌ CUENTAS FALLIDAS:');
// // console.log('='.repeat(60));
      failed.forEach(result => {
// // console.log(`\n👤 ${result.worker.name} ${result.worker.surname}`);
// // console.log(`   ❌ Error: ${result.error}`);
      });
    }

    // 4. Instrucciones para las trabajadoras
// // console.log('\n4️⃣ INSTRUCCIONES PARA LAS TRABAJADORAS:');
// // console.log('='.repeat(60));
// // console.log('📧 Envía esta información a cada trabajadora:');
// // console.log('\n🔗 URL de acceso: https://tu-dominio.com/worker/login');
// // console.log('\n📋 Credenciales individuales (ver arriba)');
// // console.log('\n⚠️  IMPORTANTE:');
// // console.log('   - Deben cambiar la contraseña en el primer acceso');
// // console.log('   - Solo pueden acceder a su información personal');
// // console.log('   - El email debe ser único para cada trabajadora');

  } catch (error) {
    console.error('\n❌ ERROR GENERAL:', error);
  }
}

function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

createWorkerAccounts(); 