const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestAssignment() {
// // console.log('📝 Creando asignación de prueba...\n')

  try {
    // Obtener una trabajadora y un usuario existentes
    const { data: workers } = await supabase
      .from('workers')
      .select('id, name, surname')
      .limit(1)

    const { data: users } = await supabase
      .from('users')
      .select('id, name, surname')
      .limit(1)

    if (!workers || workers.length === 0 || !users || users.length === 0) {
      console.error('❌ No hay trabajadoras o usuarios disponibles')
      return
    }

    const worker = workers[0]
    const user = users[0]

// // console.log(`👤 Trabajadora: ${worker.name} ${worker.surname}`)
// // console.log(`👤 Usuario: ${user.name} ${user.surname}`)

    // Crear asignación con tipo válido
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        worker_id: worker.id,
        user_id: user.id,
        assignment_type: 'holidays', // Tipo válido
        start_date: '2025-01-01',
        weekly_hours: 10,
        status: 'active'
      })
      .select()

    if (error) {
      console.error('❌ Error al crear asignación:', error)
      return
    }

// // console.log('✅ Asignación creada correctamente:')
// // console.log(`  ID: ${data[0].id}`)
// // console.log(`  Tipo: ${data[0].assignment_type}`)
// // console.log(`  Estado: ${data[0].status}`)

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

createTestAssignment() 