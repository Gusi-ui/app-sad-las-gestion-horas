const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testMigration() {
// // console.log('🔍 Verificando migración de holiday_info...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Verificar que la columna existe usando SQL directo
// // console.log('1. Verificando que la columna holiday_info existe...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'monthly_balances' 
            AND column_name = 'holiday_info'
        `
      });

    if (columnsError) {
// // console.log('⚠️ No se pudo verificar con RPC, intentando inserción directa...');
    } else if (columns && columns.length > 0) {
// // console.log('✅ Columna holiday_info encontrada:', columns[0]);
    } else {
// // console.log('❌ Columna holiday_info NO encontrada');
// // console.log('💡 Ejecuta la migración en Supabase Dashboard');
      return;
    }

    // 2. Verificar que se puede insertar un registro de prueba
// // console.log('\n2. Probando inserción con holiday_info...');
    const testData = {
      user_id: 'test-user-id',
      worker_id: 'test-worker-id',
      month: 1,
      year: 2025,
      assigned_hours: 100,
      scheduled_hours: 80,
      balance: 20,
      status: 'positive',
      message: 'Test balance',
      planning: [],
      holiday_info: {
        totalHolidays: 2,
        holidayHours: 16,
        workingDays: 20,
        workingHours: 64
      }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('monthly_balances')
      .insert([testData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error al insertar datos de prueba:', insertError);
      if (insertError.message.includes('holiday_info')) {
// // console.log('💡 La columna holiday_info no existe. Ejecuta la migración en Supabase Dashboard');
      }
      return;
    }

// // console.log('✅ Inserción exitosa con holiday_info:', insertData.holiday_info);

    // 3. Limpiar datos de prueba
// // console.log('\n3. Limpiando datos de prueba...');
    const { error: deleteError } = await supabase
      .from('monthly_balances')
      .delete()
      .eq('user_id', 'test-user-id')
      .eq('worker_id', 'test-worker-id');

    if (deleteError) {
      console.error('⚠️ Error al limpiar datos de prueba:', deleteError);
    } else {
// // console.log('✅ Datos de prueba limpiados');
    }

    // 4. Verificar que hay festivos en la base de datos
// // console.log('\n4. Verificando festivos en la base de datos...');
    const { data: holidays, error: holidaysError } = await supabase
      .from('local_holidays')
      .select('*')
      .limit(5);

    if (holidaysError) {
      console.error('❌ Error al obtener festivos:', holidaysError);
      return;
    }

// // console.log(`✅ ${holidays.length} festivos encontrados en la base de datos`);
    if (holidays.length > 0) {
// // console.log('📅 Ejemplos de festivos:', holidays.slice(0, 3));
    }

// // console.log('\n🎉 ¡Migración verificada exitosamente!');
// // console.log('✅ La columna holiday_info está disponible');
// // console.log('✅ Se pueden insertar datos con holiday_info');
// // console.log('✅ Los festivos están disponibles en la base de datos');
// // console.log('\n🚀 El sistema está listo para producción');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

testMigration(); 