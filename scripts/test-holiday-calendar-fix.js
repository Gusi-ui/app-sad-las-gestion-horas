const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testHolidayCalendarFix() {
// // console.log('🧪 [TEST] Probando corrección del calendario mensual para días festivos...\n')

  try {
    // 1. Obtener festivos de agosto 2025
// // console.log('📅 [TEST] Obteniendo festivos de agosto 2025...')
    const { data: augustHolidays, error: augustError } = await supabase
      .from('holidays')
      .select('*')
      .gte('date', '2025-08-01')
      .lt('date', '2025-09-01')
      .eq('is_active', true)

    if (augustError) {
      console.error('❌ Error al obtener festivos de agosto:', augustError)
      return
    }

// // console.log(`✅ Festivos de agosto 2025: ${augustHolidays.length}`)
    augustHolidays.forEach(holiday => {
// // console.log(`  - ${holiday.date}: ${holiday.name}`)
    })

    // 2. Buscar Jose Martínez (corregido)
// // console.log('\n👤 [TEST] Buscando Jose Martínez...')
    const { data: joseUsers, error: userError } = await supabase
      .from('users')
      .select('*')
      .ilike('name', '%Jose%')
      .ilike('surname', '%Martinez%')

    if (userError) {
      console.error('❌ Error al obtener usuarios Jose Martínez:', userError)
      return
    }

    if (joseUsers.length === 0) {
// // console.log('❌ No se encontró ningún usuario Jose Martínez')
      return
    }

    const joseUser = joseUsers[0]
// // console.log(`✅ Usuario encontrado: ${joseUser.name} ${joseUser.surname} (ID: ${joseUser.id})`)

    // 3. Obtener asignaciones de Jose Martínez
// // console.log('\n🔍 [TEST] Obteniendo asignaciones de Jose Martínez...')
    const { data: joseAssignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        worker:workers!assignments_worker_id_fkey(
          id,
          name,
          surname,
          worker_type
        )
      `)
      .eq('user_id', joseUser.id)
      .eq('status', 'active')

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError)
      return
    }

// // console.log(`✅ Asignaciones de Jose Martínez: ${joseAssignments.length}`)
    joseAssignments.forEach(assignment => {
// // console.log(`  - ${assignment.worker?.name} ${assignment.worker?.surname} (${assignment.assignment_type})`)
// // console.log(`    Tipo de trabajadora: ${assignment.worker?.worker_type}`)
    })

    // 4. Verificar el 15 de agosto (festivo)
// // console.log('\n🎯 [TEST] Verificando el 15 de agosto (festivo)...')
    const august15 = '2025-08-15'
    const august15Date = new Date(august15)
    const dayOfWeek = august15Date.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
// // console.log(`📅 15 de agosto 2025: ${dayName} (${dayOfWeek})`)
// // console.log(`🎉 Es festivo: ${augustHolidays.some(h => h.date === august15)}`)
// // console.log(`🏖️ Es fin de semana: ${dayOfWeek === 0 || dayOfWeek === 6}`)

    // 5. Simular la nueva lógica del MonthlyCalendar
// // console.log('\n🧮 [TEST] Simulando nueva lógica del MonthlyCalendar...')
    const hasHolidayAssignment = joseAssignments.some(a => a.assignment_type === 'festivos')
    const hasLaborableAssignment = joseAssignments.some(a => a.assignment_type === 'laborables')
    
// // console.log(`✅ Tiene asignación de festivos: ${hasHolidayAssignment}`)
// // console.log(`✅ Tiene asignación de laborables: ${hasLaborableAssignment}`)

    // 6. Verificar qué debería mostrar el calendario
// // console.log('\n📊 [TEST] Resultado esperado en el calendario:')
    
    if (hasHolidayAssignment) {
// // console.log('✅ El 15 de agosto DEBERÍA mostrar servicio (asignación de festivos)')
    } else {
// // console.log('❌ El 15 de agosto NO debería mostrar servicio (sin asignación de festivos)')
    }

    // 7. Verificar otros días del mes
// // console.log('\n📅 [TEST] Verificando otros días importantes de agosto 2025...')
    
    const testDates = [
      { date: '2025-08-02', name: 'Sábado 2 de agosto' },
      { date: '2025-08-03', name: 'Domingo 3 de agosto' },
      { date: '2025-08-04', name: 'Lunes 4 de agosto' },
      { date: '2025-08-15', name: 'Viernes 15 de agosto (festivo)' },
      { date: '2025-08-16', name: 'Sábado 16 de agosto' },
      { date: '2025-08-17', name: 'Domingo 17 de agosto' }
    ]

    testDates.forEach(testDate => {
      const date = new Date(testDate.date)
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const isHoliday = augustHolidays.some(h => h.date === testDate.date)
      
      let shouldShowService = false
      let reason = ''
      
      if (isWeekend || isHoliday) {
        shouldShowService = hasHolidayAssignment
        reason = hasHolidayAssignment ? 'Tiene asignación de festivos' : 'No tiene asignación de festivos'
      } else {
        shouldShowService = hasLaborableAssignment
        reason = hasLaborableAssignment ? 'Tiene asignación de laborables' : 'No tiene asignación de laborables'
      }
      
// // console.log(`  ${testDate.name}: ${shouldShowService ? '✅ Servicio' : '❌ Sin servicio'} (${reason})`)
    })

// // console.log('\n✅ [TEST] Prueba completada exitosamente')

  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  }
}

testHolidayCalendarFix() 