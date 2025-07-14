#!/usr/bin/env node

/**
 * Script para ejecutar la migración de worker_type
 * Agrega la columna worker_type a la tabla workers
 */

const fs = require('fs');
const path = require('path');

async function runMigration() {
// // console.log('🔄 Ejecutando migración: Agregar worker_type a tabla workers...\n');

  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../supabase/migration-add-worker-type.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// // console.log('📄 Contenido de la migración:');
// // console.log('=' .repeat(50));
// // console.log(migrationSQL);
// // console.log('=' .repeat(50));
// // console.log('');

// // console.log('⚠️  IMPORTANTE: Esta migración debe ejecutarse manualmente en Supabase Dashboard');
// // console.log('');
// // console.log('📋 Pasos para ejecutar la migración:');
// // console.log('1. Ve a https://supabase.com/dashboard');
// // console.log('2. Selecciona tu proyecto');
// // console.log('3. Ve a SQL Editor');
// // console.log('4. Copia y pega el contenido de la migración');
// // console.log('5. Ejecuta la consulta');
// // console.log('');
// // console.log('🔍 Después de ejecutar la migración, verifica que:');
// // console.log('   - La columna worker_type existe en la tabla workers');
// // console.log('   - Todas las trabajadoras tienen worker_type = "laborable" por defecto');
// // console.log('   - Puedes actualizar manualmente las trabajadoras que trabajan festivos/fines de semana');
// // console.log('');
// // console.log('📝 Para actualizar trabajadoras manualmente:');
// // console.log('   UPDATE workers SET worker_type = "holiday_weekend" WHERE name = "Nombre Trabajadora";');
// // console.log('   UPDATE workers SET worker_type = "both" WHERE name = "Nombre Trabajadora";');
// // console.log('');
// // console.log('✅ Una vez completada la migración, el sistema de reasignación funcionará correctamente.');

  } catch (error) {
    console.error('❌ Error leyendo archivo de migración:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration }; 