const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAssignmentTypes() {
// // console.log('🔧 Corrigiendo tipos de asignación...\n')

  try {
    // Mapeo de tipos incorrectos a correctos
    const typeMapping = {
      'holidays': 'festivos',
      'weekdays': 'laborables',
      'weekends': 'festivos',
      'all': 'flexible'
    }

    // Obtener todas las asignaciones
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, assignment_type')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error al cargar asignaciones:', error)
      return
    }

// // console.log(`📊 Total de asignaciones: ${assignments.length}\n`)

    // Encontrar asignaciones que necesitan corrección
    const assignmentsToFix = assignments.filter(a => 
      Object.keys(typeMapping).includes(a.assignment_type)
    )

    if (assignmentsToFix.length === 0) {
// // console.log('✅ No hay asignaciones que necesiten corrección')
      return
    }

// // console.log(`🔧 Asignaciones a corregir: ${assignmentsToFix.length}\n`)

    // Corregir cada asignación
    for (const assignment of assignmentsToFix) {
      const newType = typeMapping[assignment.assignment_type]
// // console.log(`  Corrigiendo asignación ${assignment.id}:`)
// // console.log(`    Tipo anterior: "${assignment.assignment_type}"`)
// // console.log(`    Tipo nuevo: "${newType}"`)

      const { error: updateError } = await supabase
        .from('assignments')
        .update({ assignment_type: newType })
        .eq('id', assignment.id)

      if (updateError) {
        console.error(`    ❌ Error al actualizar: ${updateError.message}`)
      } else {
// // console.log(`    ✅ Actualizada correctamente`)
      }
// // console.log()
    }

// // console.log('✅ Corrección completada')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

fixAssignmentTypes() 