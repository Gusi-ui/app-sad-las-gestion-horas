#!/usr/bin/env node

/**
 * Script para configurar el nuevo proyecto Supabase
 * 
 * Uso:
 * node scripts/setup-new-supabase.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configuración del Nuevo Proyecto Supabase');
console.log('============================================\n');

// Verificar si existe .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('📁 Archivo .env.local encontrado');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verificar variables de Supabase
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasSupabaseAnonKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const hasServiceRoleKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
  
  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${hasSupabaseUrl ? 'Configurado' : '❌ Faltante'}`);
  console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasSupabaseAnonKey ? 'Configurado' : '❌ Faltante'}`);
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${hasServiceRoleKey ? 'Configurado' : '❌ Faltante'}`);
  
  if (!hasSupabaseUrl || !hasSupabaseAnonKey || !hasServiceRoleKey) {
    console.log('\n⚠️  Variables de entorno incompletas');
    console.log('Por favor, actualiza tu archivo .env.local con las nuevas credenciales de Supabase');
  }
} else {
  console.log('❌ Archivo .env.local no encontrado');
  console.log('Por favor, crea el archivo .env.local con las credenciales de Supabase');
}

console.log('\n📋 Checklist de Configuración:');
console.log('=============================');

const checklist = [
  '✅ Crear nuevo proyecto en Supabase',
  '✅ Configurar región (preferiblemente cercana a Mataró)',
  '✅ Obtener URL y claves de API',
  '✅ Actualizar .env.local con nuevas credenciales',
  '✅ Ejecutar migraciones de base de datos',
  '✅ Configurar políticas RLS',
  '✅ Probar autenticación',
  '✅ Crear workers de prueba',
  '✅ Crear asignaciones de prueba',
  '✅ Verificar cálculos de balance'
];

checklist.forEach(item => {
  console.log(item);
});

console.log('\n🗄️  Migraciones a Ejecutar (en orden):');
console.log('=====================================');

const migrations = [
  'supabase/migration-local-holidays.sql',
  'supabase/migration-add-worker-type.sql', 
  'supabase/migration-add-monthly-balances.sql',
  'supabase/migration-add-holiday-info-to-monthly-balances.sql',
  'supabase/migration-add-2024-2026-holidays.sql'
];

migrations.forEach((migration, index) => {
  const exists = fs.existsSync(path.join(process.cwd(), migration));
  console.log(`${index + 1}. ${migration} ${exists ? '✅' : '❌'}`);
});

console.log('\n🔧 Comandos Útiles:');
console.log('==================');

const commands = [
  'npm run dev                    # Iniciar servidor de desarrollo',
  'node scripts/check-auth-config.js  # Verificar configuración de auth',
  'node scripts/check-workers-data.js # Verificar datos de workers',
  'node scripts/verify-system-status.js # Verificar estado del sistema'
];

commands.forEach(cmd => {
  console.log(`$ ${cmd}`);
});

console.log('\n📝 Próximos Pasos:');
console.log('==================');
console.log('1. Crear nuevo proyecto en Supabase Dashboard');
console.log('2. Copiar URL y claves de API');
console.log('3. Actualizar .env.local');
console.log('4. Ejecutar migraciones en Supabase SQL Editor');
console.log('5. Probar la aplicación con npm run dev');
console.log('6. Crear workers y asignaciones de prueba');
console.log('7. Verificar que todo funciona correctamente');

console.log('\n🎯 ¿Necesitas ayuda con algún paso específico?');
console.log('Puedes consultar la documentación en GIT_WORKFLOW.md'); 