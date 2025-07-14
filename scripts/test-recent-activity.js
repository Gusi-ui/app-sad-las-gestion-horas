const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRecentActivity() {
  console.log('🧪 Probando funcionalidad de actividad reciente...\n')

  try {
    // 1. Verificar trabajadoras recientes
    console.log('📋 Verificando trabajadoras recientes...')
    const { data: recentWorkers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, created_at, updated_at, is_active')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (workersError) {
      console.error('❌ Error al obtener trabajadoras:', workersError.message)
    } else {
      console.log(`✅ Trabajadoras recientes encontradas: ${recentWorkers.length}`)
      recentWorkers.forEach(worker => {
        const isRecentlyCreated = new Date(worker.created_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
        const isRecentlyUpdated = new Date(worker.updated_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
        
        if (isRecentlyCreated) {
          console.log(`   🆕 Creada: ${worker.name} ${worker.surname} (${new Date(worker.created_at).toLocaleString()})`)
        } else if (isRecentlyUpdated && worker.updated_at !== worker.created_at) {
          console.log(`   🔄 Actualizada: ${worker.name} ${worker.surname} (${new Date(worker.updated_at).toLocaleString()})`)
        }
      })
    }

    // 2. Verificar usuarios recientes
    console.log('\n📋 Verificando usuarios recientes...')
    const { data: recentUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, surname, created_at, updated_at, is_active')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (usersError) {
      console.error('❌ Error al obtener usuarios:', usersError.message)
    } else {
      console.log(`✅ Usuarios recientes encontrados: ${recentUsers.length}`)
      recentUsers.forEach(user => {
        const isRecentlyCreated = new Date(user.created_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
        const isRecentlyUpdated = new Date(user.updated_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
        
        if (isRecentlyCreated) {
          console.log(`   🆕 Creado: ${user.name} ${user.surname} (${new Date(user.created_at).toLocaleString()})`)
        } else if (isRecentlyUpdated && user.updated_at !== user.created_at) {
          console.log(`   🔄 Actualizado: ${user.name} ${user.surname} (${new Date(user.updated_at).toLocaleString()})`)
        }
      })
    }

    // 3. Verificar asignaciones recientes
    console.log('\n📋 Verificando asignaciones recientes...')
    const { data: recentAssignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id, 
        created_at, 
        updated_at, 
        status,
        assignment_type,
        workers(name, surname),
        users(name, surname)
      `)
      .order('updated_at', { ascending: false })
      .limit(5)

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError.message)
    } else {
      console.log(`✅ Asignaciones recientes encontradas: ${recentAssignments.length}`)
      recentAssignments.forEach(assignment => {
        const isRecentlyCreated = new Date(assignment.created_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
        const isRecentlyUpdated = new Date(assignment.updated_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
        
        const workerName = assignment.workers ? `${assignment.workers.name} ${assignment.workers.surname}` : 'Trabajadora'
        const userName = assignment.users ? `${assignment.users.name} ${assignment.users.surname}` : 'Usuario'
        
        if (isRecentlyCreated) {
          console.log(`   🆕 Creada: ${workerName} → ${userName} (${new Date(assignment.created_at).toLocaleString()})`)
        } else if (isRecentlyUpdated && assignment.updated_at !== assignment.created_at) {
          console.log(`   🔄 Actualizada: ${workerName} → ${userName} (${new Date(assignment.updated_at).toLocaleString()})`)
        }
      })
    }

    // 4. Verificar balances mensuales recientes
    console.log('\n📋 Verificando balances mensuales recientes...')
    const { data: recentBalances, error: balancesError } = await supabase
      .from('monthly_balances')
      .select('id, created_at, users(name, surname)')
      .order('created_at', { ascending: false })
      .limit(5)

    if (balancesError) {
      console.error('❌ Error al obtener balances:', balancesError.message)
    } else {
      console.log(`✅ Balances recientes encontrados: ${recentBalances.length}`)
      recentBalances.forEach(balance => {
        const isRecentlyCreated = new Date(balance.created_at).getTime() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
        
        if (isRecentlyCreated) {
          const userName = balance.users ? `${balance.users.name} ${balance.users.surname}` : 'Usuario'
          console.log(`   🆕 Generado: Balance para ${userName} (${new Date(balance.created_at).toLocaleString()})`)
        }
      })
    }

    console.log('\n✅ Prueba de actividad reciente completada')
    console.log('💡 Ahora puedes verificar el dashboard administrativo para ver estas actividades')

  } catch (error) {
    console.error('❌ Error inesperado:', error.message)
  }
}

testRecentActivity() 