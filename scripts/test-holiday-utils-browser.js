// Script para probar holidayUtils en el navegador
// Copia y pega este código en la consola del navegador en la página de planning

console.log('🧪 Probando holidayUtils en el navegador...')

// Simular la función getHolidaysForYear
async function testGetHolidaysForYear() {
  try {
    // Usar la misma configuración que en holidayUtils.ts
    const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js')
    
    const supabaseUrl = 'https://your-project.supabase.co' // Reemplaza con tu URL
    const supabaseKey = 'your-anon-key' // Reemplaza con tu key
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const year = 2025
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    
    console.log('🔄 Consultando festivos para 2025...')
    
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_active', true)
      .order('date')

    if (error) {
      console.error('❌ Error al obtener festivos:', error)
      return []
    }

    console.log('✅ Festivos obtenidos:', data)
    return data || []
  } catch (error) {
    console.error('❌ Error inesperado:', error)
    return []
  }
}

// Función simplificada para probar sin Supabase
function testHolidayLogic() {
  console.log('🧪 Probando lógica de festivos...')
  
  // Festivos conocidos de 2025
  const knownHolidays = [
    '2025-01-01', // Año Nuevo
    '2025-01-06', // Reyes
    '2025-04-18', // Viernes Santo
    '2025-04-20', // Domingo de Resurrección
    '2025-05-01', // Día del Trabajo
    '2025-06-24', // San Juan
    '2025-08-15', // Asunción
    '2025-09-11', // Diada
    '2025-10-12', // Hispanidad
    '2025-11-01', // Todos los Santos
    '2025-12-06', // Constitución
    '2025-12-08', // Inmaculada
    '2025-12-25', // Navidad
    '2025-12-26', // San Esteban
  ]
  
  console.log('📅 Festivos conocidos:', knownHolidays)
  
  // Probar fechas específicas
  const testDates = [
    { date: '2025-06-24', description: 'San Juan (martes)' },
    { date: '2025-06-28', description: 'Sábado' },
    { date: '2025-06-29', description: 'Domingo' },
    { date: '2025-06-25', description: 'Miércoles normal' }
  ]
  
  testDates.forEach(({ date, description }) => {
    const testDate = new Date(date)
    const dayOfWeek = testDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = knownHolidays.includes(date)
    const isSpecial = isWeekend || isHoliday
    
    console.log(`   ${date} (${description}):`)
    console.log(`     - Weekend: ${isWeekend}`)
    console.log(`     - Holiday: ${isHoliday}`)
    console.log(`     - Especial: ${isSpecial ? '🔴 SÍ' : '⚪ NO'}`)
  })
  
  return knownHolidays
}

// Ejecutar pruebas
console.log('🚀 Iniciando pruebas...')
const holidays = testHolidayLogic()

console.log('\n📋 INSTRUCCIONES:')
console.log('1. Copia este resultado en la consola del navegador')
console.log('2. Navega a la página de planning')
console.log('3. Ve a junio 2025')
console.log('4. Verifica que los días 24, 28 y 29 aparezcan con fondo rojo')
console.log('5. Si no aparecen, revisa los logs de la consola para errores') 