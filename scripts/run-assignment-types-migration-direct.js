const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
// // console.log('🚀 Ejecutando migración de tipos de asignación...\n')

  try {
    // Paso 1: Actualizar los datos existentes
// // console.log('📝 Actualizando datos existentes...')
    
    const { error: updateError } = await supabase
      .from('assignments')
      .update({ assignment_type: 'festivos' })
      .eq('assignment_type', 'holidays')

    if (updateError) {
      console.error('❌ Error al actualizar holidays:', updateError)
    } else {
// // console.log('✅ Datos actualizados correctamente')
    }

    // Verificar el resultado
// // console.log('\n🔍 Verificando resultado...')
    const { data: assignments, error: checkError } = await supabase
      .from('assignments')
      .select('id, assignment_type')
      .order('created_at', { ascending: false })

    if (checkError) {
      console.error('❌ Error al verificar resultado:', checkError)
      return
    }

// // console.log('📊 Asignaciones después de la migración:')
    assignments.forEach(assignment => {
// // console.log(`  - ID: ${assignment.id}, Tipo: "${assignment.assignment_type}"`)
    })

// // console.log('\n✅ Migración completada exitosamente')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

runMigration() 