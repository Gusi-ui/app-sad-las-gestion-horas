const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAssignmentHistory() {
  console.log('🔍 Verificando tabla assignment_history...\n')

  try {
    // 1. Verificar si la tabla existe
    console.log('1. Verificando existencia de la tabla...')
    const { data: tableExists, error: tableError } = await supabase
      .from('assignment_history')
      .select('id')
      .limit(1)

    if (tableError) {
      console.error('❌ Error al verificar tabla:', tableError)
      return
    }

    console.log('✅ Tabla assignment_history existe')

    // 2. Contar registros
    console.log('\n2. Contando registros...')
    const { count, error: countError } = await supabase
      .from('assignment_history')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error al contar registros:', countError)
      return
    }

    console.log(`📊 Total de registros: ${count}`)

    // 3. Verificar estructura de la tabla
    console.log('\n3. Verificando estructura de la tabla...')
    const { data: sampleData, error: sampleError } = await supabase
      .from('assignment_history')
      .select('*')
      .limit(3)

    if (sampleError) {
      console.error('❌ Error al obtener muestra:', sampleError)
      return
    }

    if (sampleData && sampleData.length > 0) {
      console.log('📋 Estructura de la tabla:')
      console.log(JSON.stringify(sampleData[0], null, 2))
    } else {
      console.log('📋 Tabla vacía - no hay datos de muestra')
    }

    // 4. Verificar asignaciones existentes
    console.log('\n4. Verificando asignaciones existentes...')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, worker_id, user_id, assignment_type')
      .limit(5)

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError)
      return
    }

    console.log(`📋 Asignaciones encontradas: ${assignments?.length || 0}`)
    if (assignments && assignments.length > 0) {
      console.log('Primera asignación:', assignments[0])
    }

    // 5. Verificar trabajadores
    console.log('\n5. Verificando trabajadores...')
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname')
      .limit(3)

    if (workersError) {
      console.error('❌ Error al obtener trabajadores:', workersError)
      return
    }

    console.log(`👥 Trabajadores encontrados: ${workers?.length || 0}`)
    if (workers && workers.length > 0) {
      console.log('Primer trabajador:', workers[0])
    }

    // 6. Si no hay historial, crear un registro de prueba
    if (count === 0 && assignments && assignments.length > 0 && workers && workers.length > 0) {
      console.log('\n6. Creando registro de prueba...')
      
      const testRecord = {
        assignment_id: assignments[0].id,
        previous_worker_id: null,
        new_worker_id: workers[0].id,
        changed_by: '00000000-0000-0000-0000-000000000000', // UUID por defecto
        change_reason: 'Registro de prueba creado automáticamente'
      }

      const { data: insertData, error: insertError } = await supabase
        .from('assignment_history')
        .insert(testRecord)
        .select()

      if (insertError) {
        console.error('❌ Error al crear registro de prueba:', insertError)
      } else {
        console.log('✅ Registro de prueba creado:', insertData[0])
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

checkAssignmentHistory()
  .then(() => {
    console.log('\n✅ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  }) 