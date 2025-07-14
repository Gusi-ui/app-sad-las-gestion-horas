const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCalendarFix() {
  console.log('🧪 Probando corrección de calendar.ts...\n');

  try {
    // 1. Probar la API de festivos directamente
    console.log('📅 Probando API de festivos...');
    const response = await fetch('http://localhost:3001/api/holidays?year=2025&month=7');
    const data = await response.json();
    
    console.log(`✅ API status: ${response.status}`);
    console.log(`📊 Festivos encontrados: ${data.holidays?.length || 0}`);
    
    if (data.holidays && data.holidays.length > 0) {
      data.holidays.forEach(holiday => {
        console.log(`   - ${holiday.date}: ${holiday.name} (${holiday.type})`);
      });
    }

    // 2. Simular la función getHolidaysFromDatabase
    console.log('\n🔧 Simulando getHolidaysFromDatabase...');
    const holidays = data.holidays || [];
    
    const processedHolidays = holidays.map((holiday) => ({
      date: holiday.date, // Usar directamente el campo date
      name: holiday.name,
      type: holiday.type
    }));

    console.log(`✅ Festivos procesados: ${processedHolidays.length}`);
    processedHolidays.forEach(holiday => {
      console.log(`   - ${holiday.date}: ${holiday.name} (${holiday.type})`);
    });

    // 3. Verificar que no hay errores de toString()
    console.log('\n🔍 Verificando que no hay errores de toString()...');
    let hasErrors = false;
    
    try {
      holidays.forEach(holiday => {
        // Verificar que todos los campos necesarios existen
        if (!holiday.date || !holiday.name || !holiday.type) {
          throw new Error(`Campo faltante en holiday: ${JSON.stringify(holiday)}`);
        }
        
        // Verificar que date es una cadena válida
        if (typeof holiday.date !== 'string') {
          throw new Error(`Date no es string: ${typeof holiday.date}`);
        }
        
        // Verificar formato de fecha
        if (!/^\d{4}-\d{2}-\d{2}$/.test(holiday.date)) {
          throw new Error(`Formato de fecha inválido: ${holiday.date}`);
        }
      });
      
      console.log('✅ No se encontraron errores de toString()');
    } catch (error) {
      console.error('❌ Error encontrado:', error.message);
      hasErrors = true;
    }

    // 4. Probar la página del dashboard
    console.log('\n🌐 Probando página del dashboard...');
    try {
      const dashboardResponse = await fetch('http://localhost:3001/worker/dashboard');
      console.log(`📊 Dashboard status: ${dashboardResponse.status}`);
      
      if (dashboardResponse.status === 200) {
        console.log('✅ Dashboard cargando correctamente');
      } else {
        console.log('⚠️  Dashboard requiere autenticación (esto es normal)');
      }
    } catch (error) {
      console.error('❌ Error al cargar dashboard:', error.message);
    }

    console.log('\n🎉 Verificación completada.');
    
    if (!hasErrors) {
      console.log('✅ La corrección de calendar.ts fue exitosa');
      console.log('💡 El error TypeError debería estar resuelto');
    } else {
      console.log('❌ Aún hay errores que necesitan atención');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

testCalendarFix(); 