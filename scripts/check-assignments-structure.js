const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAssignmentsStructure() {
  console.log('🔍 Verificando estructura de la tabla assignments...\n')

  try {
    // Obtener una muestra de datos para ver la estructura
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error al consultar assignments:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('📋 Estructura de la tabla assignments:')
      const assignment = data[0]
      Object.keys(assignment).forEach(key => {
        console.log(`   - ${key}: ${typeof assignment[key]} = ${assignment[key]}`)
      })
    } else {
      console.log('📋 La tabla assignments está vacía')
    }

    // Intentar obtener todas las asignaciones con campos básicos
    console.log('\n📊 Datos de asignaciones (campos básicos):')
    const { data: basicData, error: basicError } = await supabase
      .from('assignments')
      .select('id, worker_id, user_id, status, created_at')
      .order('created_at', { ascending: false })

    if (basicError) {
      console.error('❌ Error al cargar datos básicos:', basicError)
    } else {
      console.log(`✅ Total de asignaciones: ${basicData?.length || 0}`)
      if (basicData && basicData.length > 0) {
        console.log('📋 Últimas 3 asignaciones:')
        basicData.slice(0, 3).forEach(assignment => {
          console.log(`   - ID: ${assignment.id}, Worker: ${assignment.worker_id}, User: ${assignment.user_id}, Status: ${assignment.status}`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

checkAssignmentsStructure() 