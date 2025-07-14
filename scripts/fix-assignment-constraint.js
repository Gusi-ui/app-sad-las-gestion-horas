const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixConstraint() {
// // console.log('🔧 Intentando arreglar la restricción de assignment_type...\n')

  try {
    // Primero, intentar eliminar la asignación problemática y recrearla
// // console.log('📝 Eliminando asignación problemática...')
    
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('assignment_type', 'holidays')

    if (deleteError) {
      console.error('❌ Error al eliminar:', deleteError)
      return
    }

// // console.log('✅ Asignación eliminada')

    // Crear una nueva asignación con el tipo correcto
// // console.log('📝 Creando nueva asignación con tipo correcto...')
    
    const { data: newAssignment, error: insertError } = await supabase
      .from('assignments')
      .insert({
        worker_id: '550e8400-e29b-41d4-a716-446655440007',
        user_id: '550e8400-e29b-41d4-a716-446655440010',
        assignment_type: 'festivos',
        start_date: '2025-01-01',
        weekly_hours: 5,
        status: 'active'
      })
      .select()

    if (insertError) {
      console.error('❌ Error al crear nueva asignación:', insertError)
      return
    }

// // console.log('✅ Nueva asignación creada:', newAssignment[0])

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

// // console.log('📊 Asignaciones después de la corrección:')
    assignments.forEach(assignment => {
// // console.log(`  - ID: ${assignment.id}, Tipo: "${assignment.assignment_type}"`)
    })

// // console.log('\n✅ Corrección completada exitosamente')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

fixConstraint() 