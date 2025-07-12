const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableStructure() {
  console.log('🔍 Verificando estructura de las tablas...\n')

  try {
    // Verificar tabla workers
    console.log('👥 Verificando tabla workers:')
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .limit(1)

    if (workersError) {
      console.error('❌ Error al verificar workers:', workersError)
    } else {
      console.log('✅ Tabla workers accesible')
      if (workers && workers.length > 0) {
        console.log('📋 Campos disponibles:', Object.keys(workers[0]))
      }
    }

    // Verificar tabla users
    console.log('\n👤 Verificando tabla users:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (usersError) {
      console.error('❌ Error al verificar users:', usersError)
    } else {
      console.log('✅ Tabla users accesible')
      if (users && users.length > 0) {
        console.log('📋 Campos disponibles:', Object.keys(users[0]))
      }
    }

    // Verificar tabla assignments
    console.log('\n🔗 Verificando tabla assignments:')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(1)

    if (assignmentsError) {
      console.error('❌ Error al verificar assignments:', assignmentsError)
    } else {
      console.log('✅ Tabla assignments accesible')
      if (assignments && assignments.length > 0) {
        console.log('📋 Campos disponibles:', Object.keys(assignments[0]))
      }
    }

    // Probar consulta específica que falla
    console.log('\n🧪 Probando consulta problemática:')
    const { data: testWorkers, error: testError } = await supabase
      .from('workers')
      .select('id, name, surname, email, is_active')
      .eq('is_active', true)
      .order('name')

    if (testError) {
      console.error('❌ Error en consulta de prueba:', testError)
    } else {
      console.log('✅ Consulta de prueba exitosa')
      console.log(`📊 Trabajadoras encontradas: ${testWorkers?.length || 0}`)
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

checkTableStructure() 