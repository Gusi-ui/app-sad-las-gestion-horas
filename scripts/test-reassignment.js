const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno necesarias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testReassignment() {
// // console.log('🧪 Probando funcionalidad de reasignación...\n')

  try {
    // 1. Cargar asignaciones activas
// // console.log('📋 Cargando asignaciones activas...')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        worker_id,
        user_id,
        weekly_hours,
        status,
        assignment_type,
        worker:workers(id, name, surname, worker_type),
        user:users(id, name, surname, client_code)
      `)
      .eq('status', 'active')

    if (assignmentsError) {
      console.error('❌ Error al cargar asignaciones:', assignmentsError)
      return
    }

// // console.log(`✅ Se encontraron ${assignments.length} asignaciones activas`)

    if (assignments.length === 0) {
// // console.log('⚠️  No hay asignaciones activas para probar')
      return
    }

    // 2. Cargar trabajadoras disponibles
// // console.log('👥 Cargando trabajadoras disponibles...')
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, worker_type, is_active, max_weekly_hours')
      .eq('is_active', true)

    if (workersError) {
      console.error('❌ Error al cargar trabajadoras:', workersError)
      return
    }

// // console.log(`✅ Se encontraron ${workers.length} trabajadoras activas`)

    // 3. Mostrar ejemplo de reasignación
    const testAssignment = assignments[0]
    const currentWorker = workers.find(w => w.id === testAssignment.worker_id)
    const availableWorkers = workers.filter(w => w.id !== testAssignment.worker_id)

// // console.log('\n📊 Ejemplo de reasignación:')
// // console.log(`  Asignación: ${testAssignment.id}`)
// // console.log(`  Usuario: ${testAssignment.user.name} ${testAssignment.user.surname}`)
// // console.log(`  Trabajadora actual: ${currentWorker.name} ${currentWorker.surname}`)
// // console.log(`  Horas semanales: ${testAssignment.weekly_hours}h`)
// // console.log(`  Tipo: ${testAssignment.assignment_type}`)

// // console.log('\n👥 Trabajadoras disponibles para reasignación:')
    availableWorkers.slice(0, 3).forEach((worker, index) => {
// // console.log(`  ${index + 1}. ${worker.name} ${worker.surname} (${worker.worker_type})`)
    })

    // 4. Simular cálculo de horas
// // console.log('\n📈 Cálculo de horas semanales:')
    availableWorkers.slice(0, 3).forEach((worker, index) => {
// // console.log(`  ${worker.name} ${worker.surname}:`)
// // console.log(`    - Máximo: ${worker.max_weekly_hours}h/semana`)
// // console.log(`    - Asignación: +${testAssignment.weekly_hours}h`)
// // console.log(`    - Total: ${testAssignment.weekly_hours}h (nueva asignación)`)
    })

// // console.log('\n✅ Funcionalidad de reasignación lista para usar')
// // console.log('🔗 Ve a /admin/planning y usa los botones de acción para probar')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

testReassignment() 