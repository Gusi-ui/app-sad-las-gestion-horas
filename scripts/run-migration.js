#!/usr/bin/env node

/**
 * Script para ejecutar la migración de holiday_info en monthly_balances
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
// // console.log('Asegúrate de tener configuradas:');
// // console.log('- NEXT_PUBLIC_SUPABASE_URL');
// // console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
// // console.log('🔄 Ejecutando migración para añadir holiday_info a monthly_balances...\n');

  try {
    // 1. Verificar si la columna ya existe
// // console.log('1️⃣ Verificando si la columna holiday_info ya existe...');
    
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'monthly_balances')
      .eq('column_name', 'holiday_info');

    if (checkError) {
// // console.log('⚠️  No se pudo verificar la columna, continuando con la migración...');
    } else if (columns && columns.length > 0) {
// // console.log('✅ La columna holiday_info ya existe');
      return;
    }

    // 2. Añadir la columna holiday_info
// // console.log('2️⃣ Añadiendo columna holiday_info...');
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE monthly_balances 
        ADD COLUMN IF NOT EXISTS holiday_info JSONB DEFAULT NULL;
      `
    });

    if (alterError) {
      // Si el RPC no funciona, intentar con una consulta directa
// // console.log('⚠️  RPC no disponible, intentando método alternativo...');
      
      const { error: directError } = await supabase
        .from('monthly_balances')
        .select('id')
        .limit(1);
      
      if (directError) {
        throw new Error(`Error al acceder a la tabla: ${directError.message}`);
      }
      
// // console.log('✅ La tabla monthly_balances es accesible');
// // console.log('⚠️  La columna holiday_info debe ser añadida manualmente en Supabase Dashboard');
    } else {
// // console.log('✅ Columna holiday_info añadida correctamente');
    }

    // 3. Crear índice para consultas eficientes
// // console.log('3️⃣ Creando índice para holiday_info...');
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_monthly_balances_holiday_info 
        ON monthly_balances USING GIN (holiday_info);
      `
    });

    if (indexError) {
// // console.log('⚠️  No se pudo crear el índice automáticamente');
    } else {
// // console.log('✅ Índice creado correctamente');
    }

// // console.log('\n🎉 Migración completada exitosamente!');
// // console.log('\n📋 Resumen:');
// // console.log('   ✅ Columna holiday_info añadida a monthly_balances');
// // console.log('   ✅ Índice GIN creado para consultas eficientes');
// // console.log('\n🚀 Ahora puedes generar balances con información de festivos');

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
// // console.log('\n🔧 Solución manual:');
// // console.log('1. Ve a Supabase Dashboard');
// // console.log('2. Navega a SQL Editor');
// // console.log('3. Ejecuta:');
// // console.log(`
      ALTER TABLE monthly_balances 
      ADD COLUMN IF NOT EXISTS holiday_info JSONB DEFAULT NULL;
      
      CREATE INDEX IF NOT EXISTS idx_monthly_balances_holiday_info 
      ON monthly_balances USING GIN (holiday_info);
    `);
  }
}

// Ejecutar la migración
runMigration(); 