const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHolidaysStructure() {
  console.log('🔍 Verificando estructura de la tabla holidays...\n');

  try {
    // 1. Verificar la estructura de la tabla
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('*')
      .limit(5);

    if (holidaysError) {
      console.error('Error al obtener festivos:', holidaysError);
      return;
    }

    console.log('📋 Estructura de la tabla holidays:');
    if (holidays && holidays.length > 0) {
      const firstHoliday = holidays[0];
      console.log('Columnas disponibles:');
      Object.keys(firstHoliday).forEach(key => {
        console.log(`   - ${key}: ${typeof firstHoliday[key]} (${firstHoliday[key]})`);
      });
    } else {
      console.log('   - No hay festivos en la tabla');
    }

    // 2. Intentar obtener festivos con diferentes consultas
    console.log('\n🔍 Probando diferentes consultas...');

    // Consulta 1: Sin filtros de año/mes
    const { data: allHolidays, error: allError } = await supabase
      .from('holidays')
      .select('*')
      .limit(10);

    if (allError) {
      console.error('Error al obtener todos los festivos:', allError);
    } else {
      console.log(`✅ Consulta sin filtros: ${allHolidays?.length || 0} festivos encontrados`);
      if (allHolidays && allHolidays.length > 0) {
        console.log('   Primeros festivos:');
        allHolidays.slice(0, 3).forEach(holiday => {
          console.log(`   - ${JSON.stringify(holiday)}`);
        });
      }
    }

    // Consulta 2: Intentar con extract
    const { data: holidays2025, error: extractError } = await supabase
      .from('holidays')
      .select('*')
      .filter('date', 'gte', '2025-01-01')
      .filter('date', 'lt', '2026-01-01')
      .limit(10);

    if (extractError) {
      console.error('Error al obtener festivos de 2025:', extractError);
    } else {
      console.log(`✅ Consulta con filtro de fecha: ${holidays2025?.length || 0} festivos de 2025 encontrados`);
    }

    // 3. Verificar si hay festivos de julio 2025
    const { data: july2025Holidays, error: julyError } = await supabase
      .from('holidays')
      .select('*')
      .filter('date', 'gte', '2025-07-01')
      .filter('date', 'lt', '2025-08-01')
      .limit(10);

    if (julyError) {
      console.error('Error al obtener festivos de julio 2025:', julyError);
    } else {
      console.log(`✅ Consulta julio 2025: ${july2025Holidays?.length || 0} festivos encontrados`);
      if (july2025Holidays && july2025Holidays.length > 0) {
        console.log('   Festivos de julio 2025:');
        july2025Holidays.forEach(holiday => {
          const date = new Date(holiday.date);
          console.log(`   - ${date.getDate()}/${date.getMonth() + 1}: ${holiday.name || 'Sin nombre'}`);
        });
      }
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('Error en la verificación:', error);
  }
}

checkHolidaysStructure(); 