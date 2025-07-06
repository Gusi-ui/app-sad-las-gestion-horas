#!/usr/bin/env node

/**
 * Script para verificar los festivos reales de Mataró en la base de datos
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkMataroHolidays() {
  console.log('🏛️ Verificando festivos de Mataró en la base de datos...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Verificar festivos de julio 2025
    console.log('📅 Festivos de Julio 2025 en Mataró:');
    const { data: julyHolidays, error: julyError } = await supabase
      .from('local_holidays')
      .select('*')
      .eq('year', 2025)
      .eq('month', 7)
      .order('day');

    if (julyError) {
      console.error('❌ Error al obtener festivos de julio:', julyError);
      return;
    }

    if (julyHolidays && julyHolidays.length > 0) {
      console.log(`✅ Encontrados ${julyHolidays.length} festivos en julio 2025:`);
      julyHolidays.forEach(holiday => {
        const date = new Date(2025, 6, holiday.day); // month - 1 porque Date usa 0-indexed
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
        console.log(`   - ${holiday.day} de julio (${dayName}): ${holiday.name}`);
      });
    } else {
      console.log('❌ No se encontraron festivos configurados para julio 2025');
    }

    // Verificar festivos de junio 2025
    console.log('\n📅 Festivos de Junio 2025 en Mataró:');
    const { data: juneHolidays, error: juneError } = await supabase
      .from('local_holidays')
      .select('*')
      .eq('year', 2025)
      .eq('month', 6)
      .order('day');

    if (juneError) {
      console.error('❌ Error al obtener festivos de junio:', juneError);
      return;
    }

    if (juneHolidays && juneHolidays.length > 0) {
      console.log(`✅ Encontrados ${juneHolidays.length} festivos en junio 2025:`);
      juneHolidays.forEach(holiday => {
        const date = new Date(2025, 5, holiday.day); // month - 1 porque Date usa 0-indexed
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
        console.log(`   - ${holiday.day} de junio (${dayName}): ${holiday.name}`);
      });
    } else {
      console.log('❌ No se encontraron festivos configurados para junio 2025');
    }

    // Verificar todos los festivos de 2025
    console.log('\n📅 Todos los festivos de 2025 en Mataró:');
    const { data: allHolidays, error: allError } = await supabase
      .from('local_holidays')
      .select('*')
      .eq('year', 2025)
      .order('month')
      .order('day');

    if (allError) {
      console.error('❌ Error al obtener todos los festivos:', allError);
      return;
    }

    if (allHolidays && allHolidays.length > 0) {
      console.log(`✅ Total de festivos en 2025: ${allHolidays.length}`);
      
      // Agrupar por mes
      const holidaysByMonth = {};
      allHolidays.forEach(holiday => {
        if (!holidaysByMonth[holiday.month]) {
          holidaysByMonth[holiday.month] = [];
        }
        holidaysByMonth[holiday.month].push(holiday);
      });

      Object.keys(holidaysByMonth).sort().forEach(month => {
        const monthName = new Date(2025, month - 1).toLocaleDateString('es-ES', { month: 'long' });
        console.log(`\n   ${monthName}:`);
        holidaysByMonth[month].forEach(holiday => {
          const date = new Date(2025, month - 1, holiday.day);
          const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
          console.log(`     - ${holiday.day} (${dayName}): ${holiday.name}`);
        });
      });
    } else {
      console.log('❌ No se encontraron festivos configurados para 2025');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

checkMataroHolidays(); 