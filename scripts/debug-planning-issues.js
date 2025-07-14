const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugPlanningIssues() {
// // console.log('🔍 [DEBUG] Analizando problemas del planning mensual...\n')

  try {
    // 1. Obtener festivos de agosto 2025
// // console.log('📅 [DEBUG] Obteniendo festivos de agosto 2025...')
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('*')
      .eq('year', 2025)
      .eq('month', 8)
      .eq('is_active', true)

    if (holidaysError) {
      console.error('❌ Error al obtener festivos:', holidaysError)
      return
    }

// // console.log(`✅ Festivos de agosto 2025:`, holidays.map(h => `${h.date} - ${h.name}`))
// // console.log('')

    // 2. Obtener asignaciones de Jose Martínez
// // console.log('👤 [DEBUG] Obteniendo asignaciones de Jose Martínez...')
    const { data: joseUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .ilike('name', '%Jose%')
      .ilike('surname', '%Martinez%')
      .single()

    if (userError) {
      console.error('❌ Error al obtener usuario Jose Martínez:', userError)
      return
    }

// // console.log(`✅ Usuario encontrado: ${joseUser.name} ${joseUser.surname} (ID: ${joseUser.id})`)

    const { data: joseAssignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        worker:workers!assignments_worker_id_fkey(
          id,
          name,
          surname,
          worker_type
        ),
        user:users!assignments_user_id_fkey(
          id,
          name,
          surname
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
// // console.log(`    Horario: ${JSON.stringify(assignment.schedule)}`)
// // console.log(`    Horario específico: ${JSON.stringify(assignment.specific_schedule)}`)
    })
// // console.log('')

    // 3. Verificar el día 15 de agosto (festivo)
// // console.log('🎯 [DEBUG] Verificando el 15 de agosto (festivo)...')
    const august15 = '2025-08-15'
    const august15Date = new Date(august15)
    const dayOfWeek = august15Date.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
// // console.log(`📅 15 de agosto 2025: ${dayName} (${dayOfWeek})`)
// // console.log(`🎉 Es festivo: ${holidays.some(h => h.date === august15)}`)
// // console.log(`🏖️ Es fin de semana: ${dayOfWeek === 0 || dayOfWeek === 6}`)

    // 4. Verificar qué trabajadoras deberían trabajar el 15 de agosto
// // console.log('\n🔍 [DEBUG] Verificando trabajadoras para el 15 de agosto...')
    joseAssignments.forEach(assignment => {
// // console.log(`\n👷 Analizando: ${assignment.worker?.name} ${assignment.worker?.surname}`)
// // console.log(`   Tipo de asignación: ${assignment.assignment_type}`)
// // console.log(`   Tipo de trabajadora: ${assignment.worker?.worker_type}`)
      
      if (assignment.assignment_type === 'festivos') {
// // console.log(`   ✅ Asignación de festivos - DEBERÍA trabajar el 15 de agosto`)
      } else if (assignment.assignment_type === 'laborables') {
// // console.log(`   ❌ Asignación de laborables - NO debería trabajar el 15 de agosto`)
      }
      
      // Verificar horario específico
      if (assignment.specific_schedule) {
        const daySchedule = assignment.specific_schedule[dayName]
// // console.log(`   📋 Horario para ${dayName}: ${JSON.stringify(daySchedule)}`)
      }
    })

    // 5. Verificar todas las asignaciones del sistema
// // console.log('\n🔍 [DEBUG] Verificando todas las asignaciones del sistema...')
    const { data: allAssignments, error: allAssignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        worker:workers!assignments_worker_id_fkey(
          id,
          name,
          surname,
          worker_type
        ),
        user:users!assignments_user_id_fkey(
          id,
          name,
          surname
        )
      `)
      .eq('status', 'active')

    if (allAssignmentsError) {
      console.error('❌ Error al obtener todas las asignaciones:', allAssignmentsError)
      return
    }

// // console.log(`✅ Total de asignaciones activas: ${allAssignments.length}`)
    
    // Agrupar por tipo
    const byType = allAssignments.reduce((acc, assignment) => {
      const type = assignment.assignment_type
      if (!acc[type]) acc[type] = []
      acc[type].push(assignment)
      return acc
    }, {})

    Object.entries(byType).forEach(([type, assignments]) => {
// // console.log(`\n📊 Asignaciones de tipo '${type}': ${assignments.length}`)
      assignments.forEach(assignment => {
// // console.log(`  - ${assignment.worker?.name} ${assignment.worker?.surname} → ${assignment.user?.name} ${assignment.user?.surname}`)
      })
    })

    // 6. Verificar trabajadoras por tipo
// // console.log('\n🔍 [DEBUG] Verificando trabajadoras por tipo...')
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .eq('status', 'active')

    if (workersError) {
      console.error('❌ Error al obtener trabajadoras:', workersError)
      return
    }

    const workersByType = workers.reduce((acc, worker) => {
      const type = worker.worker_type
      if (!acc[type]) acc[type] = []
      acc[type].push(worker)
      return acc
    }, {})

    Object.entries(workersByType).forEach(([type, workers]) => {
// // console.log(`\n👷 Trabajadoras de tipo '${type}': ${workers.length}`)
      workers.forEach(worker => {
// // console.log(`  - ${worker.name} ${worker.surname}`)
      })
    })

// // console.log('\n✅ [DEBUG] Análisis completado')

  } catch (error) {
    console.error('❌ Error en el análisis:', error)
  }
}

debugPlanningIssues() 