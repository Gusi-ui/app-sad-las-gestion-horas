const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBalanceTables() {
  console.log('🔍 Verificando tablas de balances...\n');
  
  const tablesToCheck = [
    'monthly_balances',
    'monthly_hours',
    'monthly_plans',
    'balances',
    'hours_balance',
    'worker_balances',
    'user_balances'
  ];
  
  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabla ${tableName}:`, error.message);
      } else {
        console.log(`✅ Tabla ${tableName}: Existe`);
      }
    } catch (error) {
      console.log(`❌ Error verificando ${tableName}:`, error.message);
    }
  }
  
  // Verificar si existe alguna tabla que contenga "monthly" o "balance"
  console.log('\n📋 Verificando tablas con "monthly" o "balance"...');
  
  try {
    // Intentar obtener información de la tabla information_schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%monthly%');
    
    if (!error && tables) {
      console.log('✅ Tablas con "monthly":', tables.map(t => t.table_name));
    }
    
    const { data: balanceTables, error: balanceError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%balance%');
    
    if (!balanceError && balanceTables) {
      console.log('✅ Tablas con "balance":', balanceTables.map(t => t.table_name));
    }
    
  } catch (error) {
    console.log('ℹ️  No se pudieron listar las tablas automáticamente');
  }
}

checkBalanceTables(); 