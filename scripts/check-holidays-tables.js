const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkHolidayTables() {
  console.log('🔍 Verificando tablas de festivos...\n');
  
  try {
    // Verificar si existe la tabla local_holidays
    const { data: localHolidays, error: localError } = await supabase
      .from('local_holidays')
      .select('count')
      .limit(1);
    
    if (localError) {
      console.log('❌ Tabla local_holidays:', localError.message);
    } else {
      console.log('✅ Tabla local_holidays: Existe');
    }
    
    // Verificar si existe la tabla holidays
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('count')
      .limit(1);
    
    if (holidaysError) {
      console.log('❌ Tabla holidays:', holidaysError.message);
    } else {
      console.log('✅ Tabla holidays: Existe');
    }
    
    // Verificar si existe la tabla festivos
    const { data: festivos, error: festivosError } = await supabase
      .from('festivos')
      .select('count')
      .limit(1);
    
    if (festivosError) {
      console.log('❌ Tabla festivos:', festivosError.message);
    } else {
      console.log('✅ Tabla festivos: Existe');
    }
    
    // Listar todas las tablas que contengan "holiday" o "festivo"
    console.log('\n📋 Buscando tablas relacionadas con festivos...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (tablesError) {
      console.log('❌ Error obteniendo nombres de tablas:', tablesError.message);
    } else if (tables) {
      const holidayTables = tables.filter(table => 
        table.toLowerCase().includes('holiday') || 
        table.toLowerCase().includes('festivo') ||
        table.toLowerCase().includes('local')
      );
      
      if (holidayTables.length > 0) {
        console.log('✅ Tablas encontradas:', holidayTables);
      } else {
        console.log('ℹ️  No se encontraron tablas específicas de festivos');
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkHolidayTables(); 