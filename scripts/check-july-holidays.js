const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkJulyHolidays() {
  console.log('🔍 Verificando festivos de julio 2025...\n');

  try {
    // Obtener todos los festivos de julio 2025
    const { data: holidays, error } = await supabase
      .from('holidays')
      .select('*')
      .gte('date', '2025-07-01')
      .lte('date', '2025-07-31')
      .eq('is_active', true)
      .order('date');

    if (error) {
      console.error('❌ Error al obtener festivos:', error);
      return;
    }

    console.log(`📅 Festivos encontrados en julio 2025: ${holidays.length}\n`);

    if (holidays.length === 0) {
      console.log('⚠️  No se encontraron festivos para julio 2025');
      console.log('\n📋 Festivos que deberían estar:');
      console.log('   - 28 de julio: Fiesta mayor de Les Santes (local)');
      return;
    }

    holidays.forEach(holiday => {
      const date = new Date(holiday.date);
      const dayOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
      console.log(`   ${date.getDate()} de julio: ${holiday.name} (${holiday.type}) - ${dayOfWeek}`);
    });

    // Verificar específicamente el 28 de julio
    const july28 = holidays.find(h => h.date === '2025-07-28');
    if (july28) {
      console.log(`\n✅ 28 de julio encontrado: ${july28.name} (${july28.type})`);
    } else {
      console.log('\n❌ 28 de julio NO encontrado - Fiesta mayor de Les Santes');
    }

    // Verificar festivos nacionales que deberían estar
    const nationalHolidays = holidays.filter(h => h.type === 'national');
    const localHolidays = holidays.filter(h => h.type === 'local');
    
    console.log(`\n📊 Resumen:`);
    console.log(`   - Festivos nacionales: ${nationalHolidays.length}`);
    console.log(`   - Festivos locales: ${localHolidays.length}`);
    console.log(`   - Total: ${holidays.length}`);

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

checkJulyHolidays(); 