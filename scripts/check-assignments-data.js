const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAssignmentsData() {
  console.log('🔍 Verificando datos de asignaciones...\n')

  try {
    // Obtener todas las asignaciones
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        id,
        worker_id,
        user_id,
        assignment_type,
        start_date,
        end_date,
        weekly_hours,
        status,
        workers!inner(name, surname),
        users!inner(name, surname)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error al cargar asignaciones:', error)
      return
    }

    console.log(`📊 Total de asignaciones: ${assignments.length}\n`)

    // Verificar tipos de asignación
    const assignmentTypes = [...new Set(assignments.map(a => a.assignment_type))]
    console.log('🎯 Tipos de asignación encontrados:')
    assignmentTypes.forEach(type => {
      const count = assignments.filter(a => a.assignment_type === type).length
      console.log(`  - ${type}: ${count} asignaciones`)
    })
    console.log()

    // Verificar estados
    const statuses = [...new Set(assignments.map(a => a.status))]
    console.log('📋 Estados encontrados:')
    statuses.forEach(status => {
      const count = assignments.filter(a => a.status === status).length
      console.log(`  - ${status}: ${count} asignaciones`)
    })
    console.log()

    // Mostrar algunas asignaciones de ejemplo
    console.log('📝 Ejemplos de asignaciones:')
    assignments.slice(0, 3).forEach((assignment, index) => {
      console.log(`\n  Asignación ${index + 1}:`)
      console.log(`    ID: ${assignment.id}`)
      console.log(`    Trabajadora: ${assignment.workers?.name} ${assignment.workers?.surname}`)
      console.log(`    Usuario: ${assignment.users?.name} ${assignment.users?.surname}`)
      console.log(`    Tipo: ${assignment.assignment_type}`)
      console.log(`    Estado: ${assignment.status}`)
      console.log(`    Horas: ${assignment.weekly_hours}h/semana`)
      console.log(`    Inicio: ${assignment.start_date}`)
      console.log(`    Fin: ${assignment.end_date || 'Sin fecha de fin'}`)
    })

    // Verificar si hay asignaciones con tipos problemáticos
    const problematicTypes = assignments.filter(a => 
      !['laborables', 'festivos', 'flexible'].includes(a.assignment_type)
    )

    if (problematicTypes.length > 0) {
      console.log('\n⚠️  Asignaciones con tipos problemáticos:')
      problematicTypes.forEach(assignment => {
        console.log(`  - ID: ${assignment.id}, Tipo: "${assignment.assignment_type}"`)
      })
    }

    // Verificar si hay asignaciones con estados problemáticos
    const problematicStatuses = assignments.filter(a => 
      !['active', 'cancelled'].includes(a.status)
    )

    if (problematicStatuses.length > 0) {
      console.log('\n⚠️  Asignaciones con estados problemáticos:')
      problematicStatuses.forEach(assignment => {
        console.log(`  - ID: ${assignment.id}, Estado: "${assignment.status}"`)
      })
    }

    console.log('\n✅ Verificación completada')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

checkAssignmentsData() 