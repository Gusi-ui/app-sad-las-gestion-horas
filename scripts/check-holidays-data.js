const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkHolidaysData() {
  console.log('🔍 Verificando datos de festivos en la base de datos...\n');

  try {
    // Obtener todos los festivos
    const { data: holidays, error } = await supabase
      .from('holidays')
      .select('*')
      .order('date');

    if (error) {
      console.error('❌ Error al obtener festivos:', error);
      return;
    }

    if (!holidays || holidays.length === 0) {
      console.log('⚠️  No se encontraron festivos en la base de datos');
      return;
    }

    console.log(`✅ Se encontraron ${holidays.length} festivos:\n`);

    // Agrupar por año
    const holidaysByYear = {};
    holidays.forEach(holiday => {
      const year = new Date(holiday.date).getFullYear();
      if (!holidaysByYear[year]) {
        holidaysByYear[year] = [];
      }
      holidaysByYear[year].push(holiday);
    });

    Object.keys(holidaysByYear).sort().forEach(year => {
      console.log(`📅 ${year}:`);
      holidaysByYear[year].forEach(holiday => {
        const date = new Date(holiday.date);
        const dayOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
        console.log(`   - ${holiday.date} (${dayOfWeek}): ${holiday.name} - ${holiday.type}`);
      });
      console.log('');
    });

    // Verificar festivos específicos mencionados
    console.log('🔍 Verificando festivos específicos:');
    
    // San Juan 2024 (24 de junio, martes)
    const sanJuan2024 = holidays.find(h => h.date === '2024-06-24');
    if (sanJuan2024) {
      console.log(`✅ San Juan 2024 encontrado: ${sanJuan2024.name} (${sanJuan2024.type})`);
    } else {
      console.log('❌ San Juan 2024 no encontrado');
    }

    // Verificar festivos de 2025
    const holidays2025 = holidays.filter(h => h.date.startsWith('2025-'));
    console.log(`\n📊 Festivos 2025: ${holidays2025.length} encontrados`);
    
    if (holidays2025.length > 0) {
      holidays2025.forEach(holiday => {
        const date = new Date(holiday.date);
        const dayOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
        console.log(`   - ${holiday.date} (${dayOfWeek}): ${holiday.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkHolidaysData(); 