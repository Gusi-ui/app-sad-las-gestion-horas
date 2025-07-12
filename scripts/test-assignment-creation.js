const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAssignmentCreation() {
  console.log('🧪 Probando creación de asignaciones...\n')

  try {
    // Obtener una trabajadora y un usuario existentes
    const { data: workers } = await supabase
      .from('workers')
      .select('id')
      .limit(1)

    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (!workers || workers.length === 0 || !users || users.length === 0) {
      console.error('❌ No hay trabajadoras o usuarios disponibles')
      return
    }

    const workerId = workers[0].id
    const userId = users[0].id

    console.log(`👤 Usando trabajadora: ${workerId}`)
    console.log(`👤 Usando usuario: ${userId}`)

    // Probar diferentes tipos
    const testTypes = ['regular', 'holidays', 'weekends', 'temporary', 'laborables', 'festivos', 'flexible']
    
    for (const testType of testTypes) {
      console.log(`\n🧪 Probando tipo: "${testType}"`)
      
      try {
        const { data, error } = await supabase
          .from('assignments')
          .insert({
            worker_id: workerId,
            user_id: userId,
            assignment_type: testType,
            start_date: '2025-01-01',
            weekly_hours: 10,
            status: 'active'
          })
          .select()

        if (error) {
          console.log(`    ❌ Error: ${error.message}`)
        } else {
          console.log(`    ✅ Creada correctamente: ${data[0].id}`)
          
          // Eliminar la asignación de prueba
          await supabase
            .from('assignments')
            .delete()
            .eq('id', data[0].id)
        }
      } catch (err) {
        console.log(`    ❌ Error: ${err.message}`)
      }
    }

    console.log('\n✅ Pruebas completadas')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

testAssignmentCreation() 