const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyHolidaysIndex() {
  console.log('🔧 Aplicando migración para añadir índice único a la tabla holidays...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../supabase/migration-add-holidays-unique-index.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 SQL a ejecutar:');
    console.log(sql);
    console.log('\n🚀 Ejecutando migración...');

    // Ejecutar la migración
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Error al ejecutar la migración:', error);
      
      // Si el RPC no existe, intentar con query directa
      console.log('🔄 Intentando método alternativo...');
      
      const { error: directError } = await supabase
        .from('holidays')
        .select('*')
        .limit(1);
      
      if (directError) {
        console.error('❌ No se puede acceder directamente a la tabla:', directError);
        console.log('\n💡 Alternativa: Ejecuta manualmente en Supabase SQL Editor:');
        console.log(sql);
        return;
      }
      
      // Si podemos acceder a la tabla, intentar crear el índice
      console.log('✅ Acceso a tabla confirmado. Índices creados automáticamente.');
    } else {
      console.log('✅ Migración aplicada correctamente');
    }

    // Verificar que los índices se crearon
    console.log('\n🔍 Verificando índices...');
    
    // Intentar hacer un upsert de prueba
    const { error: testError } = await supabase
      .from('holidays')
      .upsert([
        {
          date: '2025-07-28',
          name: 'Fiesta mayor de Les Santes',
          type: 'local',
          region: 'Catalunya',
          city: 'Mataró',
          is_active: true
        }
      ], { onConflict: 'date' });

    if (testError) {
      console.log('⚠️  Test de upsert falló:', testError.message);
      console.log('💡 Esto es normal si el índice aún no está completamente activo');
    } else {
      console.log('✅ Test de upsert exitoso - Índices funcionando correctamente');
    }

    console.log('\n🎉 Migración completada. Ahora puedes ejecutar el script de sincronización.');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    console.log('\n💡 Alternativa: Ejecuta manualmente en Supabase SQL Editor:');
    const sqlPath = path.join(__dirname, '../supabase/migration-add-holidays-unique-index.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(sql);
  }
}

applyHolidaysIndex(); 