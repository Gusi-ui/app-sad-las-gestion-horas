const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
// // console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'No definida');
// // console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Definida' : 'No definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMonthlyHoursTable() {
  try {
// // console.log('🔍 Verificando tabla monthly_hours...');
    
    // Verificar si la tabla existe
    const { data, error } = await supabase
      .from('monthly_hours')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error al acceder a la tabla monthly_hours:', error);
      
      // Verificar qué tablas existen
// // console.log('\n📋 Verificando tablas disponibles...');
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (tablesError) {
        console.error('Error al obtener lista de tablas:', tablesError);
      } else {
// // console.log('Tablas disponibles:', tables?.map(t => t.table_name) || []);
      }
      
      return;
    }
    
// // console.log('✅ Tabla monthly_hours encontrada');
// // console.log('📊 Datos de ejemplo:', data);
    
    // Verificar estructura de la tabla
    const { data: structure, error: structureError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'monthly_hours')
      .eq('table_schema', 'public');
    
    if (structureError) {
      console.error('Error al obtener estructura de la tabla:', structureError);
    } else {
// // console.log('\n🏗️ Estructura de la tabla:');
      structure?.forEach(col => {
// // console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    // Contar registros
    const { count, error: countError } = await supabase
      .from('monthly_hours')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error al contar registros:', countError);
    } else {
// // console.log(`\n📈 Total de registros: ${count}`);
    }
    
  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

checkMonthlyHoursTable(); 