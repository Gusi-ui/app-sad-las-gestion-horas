const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMonthlyBalancesStructure() {
  console.log('🔍 Verificando estructura de monthly_balances...\n');
  
  try {
    // Verificar si existe la tabla
    const { data: balances, error } = await supabase
      .from('monthly_balances')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accediendo a monthly_balances:', error.message);
      return;
    }
    
    console.log('✅ Tabla monthly_balances: Existe');
    
    // Obtener una muestra de datos para ver la estructura
    const { data: sampleData, error: sampleError } = await supabase
      .from('monthly_balances')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.log('❌ Error obteniendo muestra:', sampleError.message);
    } else if (sampleData && sampleData.length > 0) {
      console.log('📋 Estructura de la tabla:');
      console.log('Columnas disponibles:', Object.keys(sampleData[0]));
      console.log('\n📊 Muestra de datos:');
      sampleData.forEach((row, index) => {
        console.log(`Registro ${index + 1}:`, row);
      });
    } else {
      console.log('ℹ️  La tabla está vacía');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkMonthlyBalancesStructure(); 