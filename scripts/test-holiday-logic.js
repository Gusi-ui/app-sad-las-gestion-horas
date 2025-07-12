const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Funciones de utilidad para festivos (simulando las del frontend)
function isWeekend(date) {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Domingo = 0, Sábado = 6
}

function isWorkingDay(date, holidays) {
  const dayOfWeek = date.getDay();
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekendDay) return false;
  
  // Verificar si es festivo
  const dateString = date.toISOString().split('T')[0];
  const isHoliday = holidays.some(holiday => holiday.date === dateString);
  
  return !isHoliday;
}

function isHolidayDay(date, holidays) {
  const dayOfWeek = date.getDay();
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekendDay) return true;
  
  // Verificar si es festivo
  const dateString = date.toISOString().split('T')[0];
  const isHoliday = holidays.some(holiday => holiday.date === dateString);
  
  return isHoliday;
}

function getWorkerTypeForDay(dayInfo) {
  if (dayInfo.isHolidayDay) {
    return 'festivos';
  } else if (dayInfo.isWorkingDay) {
    return 'laborables';
  } else {
    return 'flexible';
  }
}

function getDayInfo(date, holidays) {
  const dayOfWeek = date.getDay();
  const dateString = date.toISOString().split('T')[0];
  const isWeekendDay = isWeekend(date);
  const holidayInfo = holidays.find(holiday => holiday.date === dateString);
  const isHoliday = !!holidayInfo;
  
  return {
    date: dateString,
    dayOfWeek,
    isWeekend: isWeekendDay,
    isHoliday,
    holidayInfo,
    isWorkingDay: isWorkingDay(date, holidays),
    isHolidayDay: isHolidayDay(date, holidays)
  };
}

async function testHolidayLogic() {
  console.log('🧪 Probando lógica de festivos y asignación de trabajadoras...\n');

  try {
    // Obtener festivos de 2025
    const { data: holidays, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('is_active', true)
      .order('date');

    if (error) {
      console.error('❌ Error al obtener festivos:', error);
      return;
    }

    console.log(`✅ Se cargaron ${holidays.length} festivos\n`);

    // Probar días específicos de junio 2025
    const testDates = [
      '2025-06-23', // Lunes
      '2025-06-24', // Martes - San Juan (festivo)
      '2025-06-25', // Miércoles
      '2025-06-26', // Jueves
      '2025-06-27', // Viernes
      '2025-06-28', // Sábado
      '2025-06-29', // Domingo
    ];

    console.log('📅 Análisis de días de junio 2025:\n');

    testDates.forEach(dateString => {
      const date = new Date(dateString);
      const dayInfo = getDayInfo(date, holidays);
      const workerType = getWorkerTypeForDay(dayInfo);
      
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = dayNames[dayInfo.dayOfWeek];
      
      console.log(`${dateString} (${dayName}):`);
      console.log(`   - Es fin de semana: ${dayInfo.isWeekend ? 'Sí' : 'No'}`);
      console.log(`   - Es festivo: ${dayInfo.isHoliday ? 'Sí' : 'No'}`);
      if (dayInfo.isHoliday && dayInfo.holidayInfo) {
        console.log(`   - Festivo: ${dayInfo.holidayInfo.name} (${dayInfo.holidayInfo.type})`);
      }
      console.log(`   - Es día laborable: ${dayInfo.isWorkingDay ? 'Sí' : 'No'}`);
      console.log(`   - Es día festivo: ${dayInfo.isHolidayDay ? 'Sí' : 'No'}`);
      console.log(`   - Tipo de trabajadora asignada: ${workerType}`);
      console.log('');
    });

    // Probar todos los festivos de 2025
    console.log('🎯 Análisis de todos los festivos de 2025:\n');

    holidays.forEach(holiday => {
      const date = new Date(holiday.date);
      const dayInfo = getDayInfo(date, holidays);
      const workerType = getWorkerTypeForDay(dayInfo);
      
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = dayNames[dayInfo.dayOfWeek];
      
      console.log(`${holiday.date} (${dayName}): ${holiday.name}`);
      console.log(`   - Tipo: ${holiday.type}`);
      console.log(`   - Es fin de semana: ${dayInfo.isWeekend ? 'Sí' : 'No'}`);
      console.log(`   - Trabajadora asignada: ${workerType}`);
      
      // Verificar lógica específica
      if (dayInfo.isWeekend) {
        console.log(`   ✅ Correcto: Fin de semana asignado a trabajadora festiva`);
      } else if (dayInfo.isHoliday) {
        console.log(`   ✅ Correcto: Festivo entre semana asignado a trabajadora festiva`);
      } else {
        console.log(`   ⚠️  Inesperado: Día no identificado como festivo`);
      }
      console.log('');
    });

    // Probar lógica de trabajadoras
    console.log('👥 Prueba de lógica de trabajadoras:\n');

    const workerTypes = ['laborables', 'festivos', 'flexible'];
    
    workerTypes.forEach(workerType => {
      console.log(`Trabajadora tipo: ${workerType}`);
      
      // Probar con San Juan (martes festivo)
      const sanJuan = new Date('2025-06-24');
      const sanJuanInfo = getDayInfo(sanJuan, holidays);
      
      let canWork = false;
      switch (workerType) {
        case 'laborables':
          canWork = sanJuanInfo.isWorkingDay;
          break;
        case 'festivos':
          canWork = sanJuanInfo.isHolidayDay;
          break;
        case 'flexible':
          canWork = true;
          break;
      }
      
      console.log(`   - San Juan (24/06/2025, martes): ${canWork ? 'Puede trabajar' : 'No puede trabajar'}`);
      
      // Probar con un lunes normal
      const monday = new Date('2025-06-23');
      const mondayInfo = getDayInfo(monday, holidays);
      
      switch (workerType) {
        case 'laborables':
          canWork = mondayInfo.isWorkingDay;
          break;
        case 'festivos':
          canWork = mondayInfo.isHolidayDay;
          break;
        case 'flexible':
          canWork = true;
          break;
      }
      
      console.log(`   - Lunes normal (23/06/2025): ${canWork ? 'Puede trabajar' : 'No puede trabajar'}`);
      
      // Probar con un sábado
      const saturday = new Date('2025-06-28');
      const saturdayInfo = getDayInfo(saturday, holidays);
      
      switch (workerType) {
        case 'laborables':
          canWork = saturdayInfo.isWorkingDay;
          break;
        case 'festivos':
          canWork = saturdayInfo.isHolidayDay;
          break;
        case 'flexible':
          canWork = true;
          break;
      }
      
      console.log(`   - Sábado (28/06/2025): ${canWork ? 'Puede trabajar' : 'No puede trabajar'}`);
      console.log('');
    });

    console.log('✅ Prueba de lógica completada');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

testHolidayLogic(); 