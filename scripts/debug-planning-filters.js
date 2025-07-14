const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno necesarias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugPlanningFilters() {
// // console.log('🔍 Debugging Planning Filters...\n')

  try {
    // 1. Cargar todas las asignaciones activas
// // console.log('📋 Cargando asignaciones activas...')
    const assignmentsResponse = await supabase
      .from('assignments')
      .select(`
        id,
        weekly_hours,
        status,
        start_date,
        end_date,
        assignment_type,
        schedule,
        worker:workers(id, name, surname, worker_type, is_active),
        user:users(id, name, surname, client_code, is_active)
      `)
      .eq('status', 'active')

    if (assignmentsResponse.error) {
      console.error('❌ Error al cargar asignaciones:', assignmentsResponse.error)
      return
    }

    const assignments = (assignmentsResponse.data || []).map((item) => ({
      id: item.id,
      weekly_hours: item.weekly_hours,
      status: item.status,
      start_date: item.start_date,
      end_date: item.end_date,
      assignment_type: item.assignment_type,
      schedule: item.schedule,
      worker: Array.isArray(item.worker) ? item.worker[0] : item.worker,
      user: Array.isArray(item.user) ? item.user[0] : item.user,
    }))

// // console.log(`✅ Se cargaron ${assignments.length} asignaciones activas\n`)

    // 2. Cargar trabajadoras activas
// // console.log('👥 Cargando trabajadoras activas...')
    const workersResponse = await supabase
      .from('workers')
      .select('id, name, surname, worker_type, is_active')
      .eq('is_active', true)
      .order('name')

    if (workersResponse.error) {
      console.error('❌ Error al cargar trabajadoras:', workersResponse.error)
      return
    }

    const workers = workersResponse.data || []
// // console.log(`✅ Se cargaron ${workers.length} trabajadoras activas\n`)

    // 3. Cargar usuarios activos
// // console.log('👤 Cargando usuarios activos...')
    const usersResponse = await supabase
      .from('users')
      .select('id, name, surname, client_code, is_active')
      .eq('is_active', true)
      .order('name')

    if (usersResponse.error) {
      console.error('❌ Error al cargar usuarios:', usersResponse.error)
      return
    }

    const users = usersResponse.data || []
// // console.log(`✅ Se cargaron ${users.length} usuarios activos\n`)

    // 4. Mostrar ejemplos de asignaciones
// // console.log('📊 Ejemplos de asignaciones:')
    assignments.slice(0, 5).forEach((assignment, index) => {
// // console.log(`  ${index + 1}. ${assignment.worker.name} ${assignment.worker.surname} → ${assignment.user.name} ${assignment.user.surname}`)
// // console.log(`     Tipo: ${assignment.assignment_type}, Horas: ${assignment.weekly_hours}, Estado: ${assignment.status}`)
// // console.log(`     Fecha inicio: ${assignment.start_date}, Fecha fin: ${assignment.end_date || 'Indefinido'}`)
// // console.log('')
    })

    // 5. Probar filtros
// // console.log('🔍 Probando filtros...')
    
    // Filtro por trabajadora específica
    if (assignments.length > 0) {
      const testWorkerId = assignments[0].worker.id
      const filteredByWorker = assignments.filter(a => a.worker.id === testWorkerId)
// // console.log(`  Filtro por trabajadora (${assignments[0].worker.name}): ${filteredByWorker.length} asignaciones`)
    }

    // Filtro por usuario específico
    if (assignments.length > 0) {
      const testUserId = assignments[0].user.id
      const filteredByUser = assignments.filter(a => a.user.id === testUserId)
// // console.log(`  Filtro por usuario (${assignments[0].user.name}): ${filteredByUser.length} asignaciones`)
    }

    // Filtro por tipo
    const laborables = assignments.filter(a => a.assignment_type === 'laborables')
    const festivos = assignments.filter(a => a.assignment_type === 'festivos')
// // console.log(`  Filtro por tipo - Laborables: ${laborables.length}, Festivos: ${festivos.length}`)

    // 6. Verificar fechas activas
// // console.log('\n📅 Verificando fechas activas...')
    const today = new Date()
    const activeAssignments = assignments.filter(assignment => {
      const start = new Date(assignment.start_date)
      const end = assignment.end_date ? new Date(assignment.end_date) : null
      return (!end && today >= start) || (end && today >= start && today <= end)
    })
// // console.log(`  Asignaciones activas hoy: ${activeAssignments.length}`)

    // 7. Verificar estructura de datos
// // console.log('\n🔧 Verificando estructura de datos...')
    const hasSchedule = assignments.filter(a => a.schedule).length
    const hasAssignmentType = assignments.filter(a => a.assignment_type).length
// // console.log(`  Asignaciones con schedule: ${hasSchedule}/${assignments.length}`)
// // console.log(`  Asignaciones con tipo: ${hasAssignmentType}/${assignments.length}`)

    // 8. Mostrar estadísticas
// // console.log('\n📈 Estadísticas:')
    const totalHours = assignments.reduce((sum, a) => sum + a.weekly_hours, 0)
    const uniqueWorkers = new Set(assignments.map(a => a.worker.id)).size
    const uniqueUsers = new Set(assignments.map(a => a.user.id)).size
    
// // console.log(`  Total de horas/semana: ${totalHours}`)
// // console.log(`  Trabajadoras únicas: ${uniqueWorkers}`)
// // console.log(`  Usuarios únicos: ${uniqueUsers}`)

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

debugPlanningFilters() 