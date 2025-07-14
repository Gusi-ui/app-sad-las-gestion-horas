const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
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
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../supabase/migration-update-assignment-types.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

// // console.log('📄 Contenido de la migración:')
// // console.log(migrationSQL)
// // console.log()

    // Ejecutar la migración
// // console.log('🔧 Ejecutando migración...')
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('❌ Error al ejecutar migración:', error)
      return
    }

// // console.log('✅ Migración ejecutada correctamente')

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