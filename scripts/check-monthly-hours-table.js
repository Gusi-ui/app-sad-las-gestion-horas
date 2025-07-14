require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMonthlyHoursTable() {
  try {
// // console.log('🔍 Verificando tabla monthly_hours...\n');

    // 1. Verificar si la tabla existe usando SQL directo
// // console.log('1. Verificando existencia de la tabla...');
    const { data: tableExists, error: tableError } = await supabase
      .rpc('check_table_exists', { table_name: 'monthly_hours' });

    if (tableError) {
      // Si no existe la función, probar directamente
      try {
        const { data, error } = await supabase
          .from('monthly_hours')
          .select('*')
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
// // console.log('❌ La tabla monthly_hours NO existe');
// // console.log('💡 Necesitas crear la tabla primero');
          return;
        } else if (error) {
// // console.log('❌ Error al verificar tabla:', error.message);
          return;
        } else {
// // console.log('✅ La tabla monthly_hours existe');
        }
      } catch (err) {
// // console.log('❌ La tabla monthly_hours NO existe');
// // console.log('💡 Necesitas crear la tabla primero');
        return;
      }
    } else {
// // console.log('✅ La tabla monthly_hours existe');
    }

    // 2. Verificar estructura de la tabla
// // console.log('\n2. Verificando estructura de la tabla...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'monthly_hours' });

    if (columnsError) {
      // Si no existe la función, intentar una consulta simple
      try {
        const { data: sampleData, error: sampleError } = await supabase
          .from('monthly_hours')
          .select('*')
          .limit(1);

        if (sampleError) {
// // console.log('❌ Error al consultar tabla:', sampleError.message);
          return;
        }

// // console.log('📋 Estructura de la tabla (basada en datos de muestra):');
        if (sampleData && sampleData.length > 0) {
          Object.keys(sampleData[0]).forEach(key => {
// // console.log(`   - ${key}: ${typeof sampleData[0][key]}`);
          });
        }
      } catch (err) {
// // console.log('❌ Error al verificar estructura:', err.message);
        return;
      }
    } else {
// // console.log('📋 Columnas de la tabla monthly_hours:');
      columns.forEach(col => {
// // console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }

    // 3. Verificar datos existentes
// // console.log('\n3. Verificando datos existentes...');
    const { data: existingData, error: dataError } = await supabase
      .from('monthly_hours')
      .select('*')
      .limit(5);

    if (dataError) {
// // console.log('❌ Error al consultar datos:', dataError.message);
      return;
    }

// // console.log(`📊 Datos existentes: ${existingData?.length || 0} registros`);
    if (existingData && existingData.length > 0) {
// // console.log('Ejemplo de registro:');
// // console.log(JSON.stringify(existingData[0], null, 2));
    }

    // 4. Probar inserción de un registro de prueba
// // console.log('\n4. Probando inserción de registro de prueba...');
    const testData = {
      user_id: 'test-user-id',
      month: 7,
      year: 2025,
      total_hours: 90.5,
      laborable_hours: 77.0,
      holiday_hours: 13.5,
      assigned_hours: 86,
      difference: 4.5,
      holiday_info: {
        holiday_days: [28],
        laborable_days: [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 29, 30, 31],
        holiday_weekend_days: [5, 6, 12, 13, 19, 20, 26, 27, 28],
        workers: [
          {
            worker_id: 'test-worker-id',
            worker_name: 'Test Worker',
            worker_type: 'laborable',
            laborable_hours: 77.0,
            holiday_hours: 0,
            total_hours: 77.0
          }
        ]
      }
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('monthly_hours')
      .insert([testData])
      .select();

    if (insertError) {
// // console.log('❌ Error al insertar registro de prueba:', insertError.message);
// // console.log('Detalles del error:', insertError.details);
// // console.log('Hint:', insertError.hint);
    } else {
// // console.log('✅ Inserción de prueba exitosa');
      
      // Limpiar el registro de prueba
      if (insertResult && insertResult.length > 0) {
        await supabase
          .from('monthly_hours')
          .delete()
          .eq('id', insertResult[0].id);
// // console.log('🧹 Registro de prueba eliminado');
      }
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    if (error.details) {
      console.error('Detalles:', error.details);
    }
  }
}

// Ejecutar la verificación
checkMonthlyHoursTable(); 