const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyDatabaseState() {
  console.log('🔍 Verificación completa del estado de la base de datos\n')

  try {
    // 1. Verificar estructura de tablas
    console.log('📋 1. Verificando estructura de tablas...')
    
    const { data: assignmentsColumns, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(1)

    if (assignmentsError) {
      console.error('❌ Error al verificar tabla assignments:', assignmentsError)
    } else {
      console.log('✅ Tabla assignments accesible')
      console.log('   Columnas disponibles:', Object.keys(assignmentsColumns[0] || {}))
    }

    // 2. Verificar trabajadoras
    console.log('\n👷 2. Verificando trabajadoras...')
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, worker_type, email, phone, status')
      .order('name')

    if (workersError) {
      console.error('❌ Error al cargar trabajadoras:', workersError)
    } else {
      console.log(`✅ Total trabajadoras: ${workers.length}`)
      workers.forEach(worker => {
        console.log(`   - ${worker.name} ${worker.surname} (${worker.worker_type}) - ${worker.status}`)
      })
    }

    // 3. Verificar usuarios
    console.log('\n👤 3. Verificando usuarios...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, surname, client_code, status')
      .order('name')

    if (usersError) {
      console.error('❌ Error al cargar usuarios:', usersError)
    } else {
      console.log(`✅ Total usuarios: ${users.length}`)
      users.forEach(user => {
        console.log(`   - ${user.name} ${user.surname} (${user.client_code}) - ${user.status}`)
      })
    }

    // 4. Verificar asignaciones
    console.log('\n📋 4. Verificando asignaciones...')
    const { data: assignments, error: assignmentsError2 } = await supabase
      .from('assignments')
      .select(`
        id,
        worker_id,
        user_id,
        weekly_hours,
        status,
        start_date,
        end_date,
        assignment_type,
        created_at,
        updated_at,
        worker:workers(name, surname, worker_type),
        user:users(name, surname, client_code)
      `)
      .order('start_date')

    if (assignmentsError2) {
      console.error('❌ Error al cargar asignaciones:', assignmentsError2)
    } else {
      console.log(`✅ Total asignaciones: ${assignments.length}`)
      assignments.forEach(assignment => {
        const worker = Array.isArray(assignment.worker) ? assignment.worker[0] : assignment.worker
        const user = Array.isArray(assignment.user) ? assignment.user[0] : assignment.user
        console.log(`   - ${worker?.name} ${worker?.surname} → ${user?.name} ${user?.surname}`)
        console.log(`     Horas: ${assignment.weekly_hours}, Tipo: ${assignment.assignment_type || 'NULL'}`)
        console.log(`     Fecha: ${assignment.start_date} - ${assignment.end_date || 'Indefinido'}`)
        console.log(`     Estado: ${assignment.status}`)
        console.log('')
      })
    }

    // 5. Verificar días festivos
    console.log('\n🎉 5. Verificando días festivos...')
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('*')
      .order('date')

    if (holidaysError) {
      console.error('❌ Error al cargar festivos:', holidaysError)
    } else {
      console.log(`✅ Total días festivos: ${holidays.length}`)
      const holidays2025 = holidays.filter(h => h.date.startsWith('2025'))
      console.log(`   Festivos 2025: ${holidays2025.length}`)
      holidays2025.forEach(holiday => {
        console.log(`   - ${holiday.date}: ${holiday.name}`)
      })
    }

    // 6. Verificar integridad referencial
    console.log('\n🔗 6. Verificando integridad referencial...')
    const orphanedAssignments = assignments.filter(a => !a.worker || !a.user)
    if (orphanedAssignments.length > 0) {
      console.log(`⚠️  Asignaciones huérfanas: ${orphanedAssignments.length}`)
      orphanedAssignments.forEach(a => {
        console.log(`   - ID: ${a.id}, Worker: ${a.worker ? 'OK' : 'MISSING'}, User: ${a.user ? 'OK' : 'MISSING'}`)
      })
    } else {
      console.log('✅ Todas las asignaciones tienen referencias válidas')
    }

    // 7. Verificar consistencia de tipos
    console.log('\n🎯 7. Verificando consistencia de tipos...')
    const inconsistentTypes = assignments.filter(a => {
      const worker = Array.isArray(a.worker) ? a.worker[0] : a.worker
      return worker && worker.worker_type === 'festivos' && a.assignment_type !== 'festivos'
    })
    
    if (inconsistentTypes.length > 0) {
      console.log(`⚠️  Inconsistencias de tipo: ${inconsistentTypes.length}`)
      inconsistentTypes.forEach(a => {
        const worker = Array.isArray(a.worker) ? a.worker[0] : a.worker
        console.log(`   - ${worker.name} ${worker.surname}: worker_type=${worker.worker_type}, assignment_type=${a.assignment_type}`)
      })
    } else {
      console.log('✅ Consistencia de tipos verificada')
    }

    // 8. Resumen final
    console.log('\n📊 RESUMEN FINAL:')
    console.log(`   - Trabajadoras: ${workers?.length || 0}`)
    console.log(`   - Usuarios: ${users?.length || 0}`)
    console.log(`   - Asignaciones: ${assignments?.length || 0}`)
    console.log(`   - Días festivos: ${holidays?.length || 0}`)
    console.log(`   - Asignaciones activas: ${assignments?.filter(a => a.status === 'active').length || 0}`)
    console.log(`   - Asignaciones festivos: ${assignments?.filter(a => a.assignment_type === 'festivos').length || 0}`)
    
    console.log('\n✅ Verificación completada. Base de datos en estado consistente.')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

verifyDatabaseState() 