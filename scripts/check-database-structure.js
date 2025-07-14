const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseStructure() {
// // console.log('🔍 Verificando estructura de la base de datos...\n')

  try {
    // Verificar tabla workers
// // console.log('📋 Tabla workers:')
    const { data: workersData, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .limit(1)

    if (workersError) {
      console.error('❌ Error al acceder a tabla workers:', workersError)
    } else if (workersData && workersData.length > 0) {
// // console.log('✅ Tabla workers existe')
// // console.log('📊 Campos disponibles:', Object.keys(workersData[0]))
    } else {
// // console.log('⚠️ Tabla workers existe pero está vacía')
    }

// // console.log()

    // Verificar tabla users
// // console.log('📋 Tabla users:')
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (usersError) {
      console.error('❌ Error al acceder a tabla users:', usersError)
    } else if (usersData && usersData.length > 0) {
// // console.log('✅ Tabla users existe')
// // console.log('📊 Campos disponibles:', Object.keys(usersData[0]))
    } else {
// // console.log('⚠️ Tabla users existe pero está vacía')
    }

// // console.log()

    // Verificar tabla assignments
// // console.log('📋 Tabla assignments:')
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(1)

    if (assignmentsError) {
      console.error('❌ Error al acceder a tabla assignments:', assignmentsError)
    } else if (assignmentsData && assignmentsData.length > 0) {
// // console.log('✅ Tabla assignments existe')
// // console.log('📊 Campos disponibles:', Object.keys(assignmentsData[0]))
    } else {
// // console.log('⚠️ Tabla assignments existe pero está vacía')
    }

// // console.log()

    // Contar registros
// // console.log('📊 Conteo de registros:')
    
    const { count: workersCount } = await supabase
      .from('workers')
      .select('*', { count: 'exact', head: true })
    
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    const { count: assignmentsCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })

// // console.log(`👥 Workers: ${workersCount || 0}`)
// // console.log(`👤 Users: ${usersCount || 0}`)
// // console.log(`📅 Assignments: ${assignmentsCount || 0}`)

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

checkDatabaseStructure() 