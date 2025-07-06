const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verificando configuración de autenticación...\n');

console.log('📋 Variables de entorno:');
console.log('=========================');
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Configurado' : '❌ Faltante'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✅ Configurado' : '❌ Faltante'}`);

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ ERROR: Faltan variables de entorno necesarias');
  console.log('   Asegúrate de que .env.local contenga:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key');
  process.exit(1);
}

// Crear cliente con service role
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  try {
    console.log('\n🧪 Probando autenticación...');
    console.log('=============================');
    
    // 1. Probar crear un usuario de prueba
    const testEmail = `test_${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`   Intentando crear usuario: ${testEmail}`);
    
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (userError) {
      console.log(`   ❌ Error creando usuario: ${userError.message}`);
      console.log(`   Código: ${userError.code}`);
      console.log(`   Status: ${userError.status}`);
      
      if (userError.message.includes('Database error')) {
        console.log('\n🔧 Posibles soluciones:');
        console.log('   1. Verificar que la Service Role Key sea correcta');
        console.log('   2. Verificar que la URL de Supabase sea correcta');
        console.log('   3. Verificar que el proyecto esté activo en Supabase');
        console.log('   4. Verificar que Auth esté habilitado en el proyecto');
      }
    } else {
      console.log(`   ✅ Usuario creado exitosamente: ${userData.user.id}`);
      
      // Limpiar el usuario de prueba
      await supabase.auth.admin.deleteUser(userData.user.id);
      console.log('   🧹 Usuario de prueba eliminado');
    }
    
  } catch (error) {
    console.log(`   ❌ Error inesperado: ${error.message}`);
  }
}

testAuth(); 