const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkGracielaJoseFestivos() {
// // console.log('🔍 [DEBUG] Verificando asignación de festivos de Graciela Petri → Jose Martínez Blanquez...\n')

  try {
    // Buscar usuario Jose Martínez Blanquez por nombre exacto o client_code
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .or("and(name.eq.Jose Martínez Blanquez),client_code.eq.US001")
    if (userError || !users || users.length === 0) {
      console.error('❌ No se encontró el usuario Jose Martínez Blanquez')
      return
    }
    const jose = users[0]
// // console.log(`✅ Usuario encontrado: ${jose.name} ${jose.surname} (${jose.id})`)

    // Buscar trabajadora Graciela Petri
    const { data: workers, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .ilike('name', '%Graciela%')
      .ilike('surname', '%Petri%')
    if (workerError || !workers || workers.length === 0) {
      console.error('❌ No se encontró la trabajadora Graciela Petri')
      return
    }
    const graciela = workers[0]

    // Buscar asignación activa de tipo festivos entre ambos
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', jose.id)
      .eq('worker_id', graciela.id)
      .eq('assignment_type', 'festivos')
      .eq('status', 'active')

    if (assignError || !assignments || assignments.length === 0) {
      console.error('❌ No se encontró la asignación activa de festivos entre Graciela y Jose')
      return
    }
    const assignment = assignments[0]

// // console.log('✅ Asignación encontrada:')
// // console.log(`  Trabajadora: ${graciela.name} ${graciela.surname}`)
// // console.log(`  Usuario: ${jose.name} ${jose.surname}`)
// // console.log(`  assignment_type: ${assignment.assignment_type}`)
// // console.log(`  start_date: ${assignment.start_date}`)
// // console.log(`  end_date: ${assignment.end_date}`)
// // console.log('  schedule:')
    try {
      const schedule = typeof assignment.schedule === 'string' ? JSON.parse(assignment.schedule) : assignment.schedule
      console.dir(schedule, { depth: null })
      if (schedule && schedule.holiday) {
// // console.log('  holiday:', schedule.holiday)
      } else {
// // console.log('  holiday: NO DEFINIDO')
      }
      if (schedule && schedule.saturday) {
// // console.log('  saturday:', schedule.saturday)
      }
      if (schedule && schedule.sunday) {
// // console.log('  sunday:', schedule.sunday)
      }
    } catch (e) {
      console.error('❌ Error al parsear el schedule:', e)
    }

// // console.log('\n✅ [DEBUG] Consulta completada')
  } catch (error) {
    console.error('❌ Error en el análisis:', error)
  }
}

checkGracielaJoseFestivos() 