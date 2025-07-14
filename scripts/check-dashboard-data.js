const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDashboardData() {
// // console.log('🔍 Verificando datos del dashboard...\n')

  try {
    // Verificar trabajadoras
// // console.log('📊 Trabajadoras:')
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, email, is_active, created_at')
      .order('created_at', { ascending: false })

    if (workersError) {
      console.error('❌ Error al cargar trabajadoras:', workersError)
    } else {
// // console.log(`✅ Total: ${workers?.length || 0}`)
// // console.log(`✅ Activas: ${workers?.filter(w => w.is_active).length || 0}`)
      if (workers && workers.length > 0) {
// // console.log('📋 Últimas 3 trabajadoras:')
        workers.slice(0, 3).forEach(worker => {
// // console.log(`   - ${worker.name} ${worker.surname} (${worker.is_active ? 'Activa' : 'Inactiva'})`)
        })
      }
    }

// // console.log('\n📊 Usuarios:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, surname, client_code, email, is_active, created_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('❌ Error al cargar usuarios:', usersError)
    } else {
// // console.log(`✅ Total: ${users?.length || 0}`)
// // console.log(`✅ Activos: ${users?.filter(u => u.is_active).length || 0}`)
      if (users && users.length > 0) {
// // console.log('📋 Últimos 3 usuarios:')
        users.slice(0, 3).forEach(user => {
// // console.log(`   - ${user.name} ${user.surname} (${user.client_code})`)
        })
      }
    }

// // console.log('\n📊 Asignaciones:')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id, worker_id, user_id, status, start_date, end_date, weekly_hours, assignment_type, priority, created_at,
        worker:workers(name, surname, email),
        user:users(name, surname, client_code, email)
      `)
      .order('created_at', { ascending: false })

    if (assignmentsError) {
      console.error('❌ Error al cargar asignaciones:', assignmentsError)
    } else {
// // console.log(`✅ Total: ${assignments?.length || 0}`)
// // console.log(`✅ Activas: ${assignments?.filter(a => a.status === 'active').length || 0}`)
      if (assignments && assignments.length > 0) {
// // console.log('📋 Últimas 3 asignaciones:')
        assignments.slice(0, 3).forEach(assignment => {
          const worker = assignment.worker?.[0]
          const user = assignment.user?.[0]
// // console.log(`   - ${worker?.name || 'N/A'} → ${user?.name || 'N/A'} (${assignment.status})`)
        })
      }
    }

    // Verificar estadísticas del dashboard
// // console.log('\n📈 Estadísticas del Dashboard:')
    
    const { count: workersTotal } = await supabase
      .from('workers')
      .select('*', { count: 'exact', head: true })

    const { count: workersActive } = await supabase
      .from('workers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: usersTotal } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: usersActive } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: assignmentsTotal } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })

    const { count: assignmentsActive } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

// // console.log(`✅ Trabajadoras: ${workersActive || 0}/${workersTotal || 0}`)
// // console.log(`✅ Usuarios: ${usersActive || 0}/${usersTotal || 0}`)
// // console.log(`✅ Asignaciones: ${assignmentsActive || 0}/${assignmentsTotal || 0}`)

// // console.log('\n🎉 Verificación completada!')
// // console.log('\n💡 Si los datos aparecen aquí pero no en el dashboard, verifica:')
// // console.log('   1. Que RLS esté deshabilitado temporalmente')
// // console.log('   2. Que el cliente Supabase esté configurado correctamente')
// // console.log('   3. Que no haya errores en la consola del navegador')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

checkDashboardData() 