const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAssignmentConstraints() {
  console.log('🔍 Verificando restricciones de assignment_type en la tabla assignments...\n')

  try {
    // Intentar insertar con diferentes tipos para ver cuáles están permitidos
    const testTypes = [
      'regular', 'holidays', 'weekends', 'temporary',
      'laborables', 'festivos', 'flexible',
      'weekdays', 'all'
    ]
    
    console.log('🧪 Probando tipos de asignación permitidos:')
    
    for (const testType of testTypes) {
      console.log(`\n  Probando tipo: "${testType}"`)
      
      try {
        const { error } = await supabase
          .from('assignments')
          .insert({
            worker_id: '00000000-0000-0000-0000-000000000000', // ID ficticio
            user_id: '00000000-0000-0000-0000-000000000000', // ID ficticio
            assignment_type: testType,
            start_date: '2025-01-01',
            weekly_hours: 10,
            status: 'active'
          })

        if (error) {
          console.log(`    ❌ Error: ${error.message}`)
          if (error.code === '23514') {
            console.log(`    📋 Código: ${error.code} - Violación de constraint`)
          }
        } else {
          console.log(`    ✅ Permitido`)
          // Eliminar el registro de prueba
          await supabase
            .from('assignments')
            .delete()
            .eq('worker_id', '00000000-0000-0000-0000-000000000000')
        }
      } catch (err) {
        console.log(`    ❌ Error: ${err.message}`)
      }
    }

    // Verificar asignaciones existentes
    console.log('\n📋 Verificando asignaciones existentes:')
    const { data: existingAssignments, error: existingError } = await supabase
      .from('assignments')
      .select('id, assignment_type, created_at')
      .order('created_at', { ascending: false })

    if (existingError) {
      console.error('❌ Error al cargar asignaciones existentes:', existingError)
    } else {
      console.log(`📊 Total de asignaciones existentes: ${existingAssignments?.length || 0}`)
      
      if (existingAssignments && existingAssignments.length > 0) {
        const types = [...new Set(existingAssignments.map(a => a.assignment_type))]
        console.log('🎯 Tipos de asignación existentes:')
        types.forEach(type => {
          const count = existingAssignments.filter(a => a.assignment_type === type).length
          console.log(`  - ${type}: ${count} asignaciones`)
        })
      }
    }

    console.log('\n💡 Recomendación:')
    console.log('   Si los tipos "laborables", "festivos", "flexible" no están permitidos,')
    console.log('   necesitas actualizar el constraint de la tabla assignments.')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

checkAssignmentConstraints() 