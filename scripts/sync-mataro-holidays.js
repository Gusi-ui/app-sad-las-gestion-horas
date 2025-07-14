const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MATARO_HOLIDAYS_URL = 'https://www.mataro.cat/es/la-ciudad/festivos-locales';

function parseDate(day, month, year) {
  // day: '28', month: 'julio', year: '2025' => '2025-07-28'
  const months = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
    'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };
  return `${year}-${months[month.toLowerCase()]}-${day.padStart(2, '0')}`;
}

async function fetchMataroHolidays() {
  console.log('🌐 Descargando festivos desde la web oficial...');
  const res = await fetch(MATARO_HOLIDAYS_URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  const holidays = [];
  let currentYear = null;

  $('h2, h3, table').each((i, el) => {
    if ($(el).is('h2, h3')) {
      // Buscar el año en el título
      const text = $(el).text();
      const match = text.match(/(\d{4})/);
      if (match) {
        currentYear = match[1];
      }
    } else if ($(el).is('table') && currentYear) {
      // Parsear la tabla de festivos
      $(el).find('tbody tr').each((j, row) => {
        const tds = $(row).find('td');
        if (tds.length >= 3) {
          let dayText = $(tds[0]).text().trim();
          let name = $(tds[1]).text().trim();
          // Día puede ser "1 de enero" o "28 de julio"
          const dayMatch = dayText.match(/(\d{1,2}) de ([a-zA-Záéíóúñ]+)/i);
          if (dayMatch) {
            const day = dayMatch[1];
            const month = dayMatch[2];
            const date = parseDate(day, month, currentYear);
            holidays.push({
              date,
              name,
              type: name.toLowerCase().includes('santes') || name.toLowerCase().includes('feria') ? 'local' : 'national',
              region: 'Catalunya',
              city: 'Mataró',
              is_active: true
            });
          }
        }
      });
    }
  });
  return holidays;
}

async function upsertHolidays(holidays) {
  console.log(`🗂️  Insertando/actualizando ${holidays.length} festivos en la base de datos...`);
  for (const holiday of holidays) {
    // Upsert por fecha (usando el índice único sobre date)
    const { error } = await supabase
      .from('holidays')
      .upsert([
        {
          date: holiday.date,
          name: holiday.name,
          type: holiday.type,
          region: holiday.region,
          city: holiday.city,
          is_active: true
        }
      ], { onConflict: 'date' });
    if (error) {
      console.error(`❌ Error al insertar festivo ${holiday.date} - ${holiday.name}:`, error.message);
    } else {
      console.log(`✅ Festivo ${holiday.date} - ${holiday.name} insertado/actualizado.`);
    }
  }
}

(async () => {
  try {
    const holidays = await fetchMataroHolidays();
    if (!holidays.length) {
      console.error('❌ No se encontraron festivos en la web.');
      process.exit(1);
    }
    await upsertHolidays(holidays);
    console.log('🎉 Sincronización de festivos completada.');
  } catch (err) {
    console.error('❌ Error durante la sincronización:', err);
    process.exit(1);
  }
})(); 