const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Iniciando migración de campos de dirección de trabajadoras...')
  
  try {
    // 1. Añadir campos de dirección
    console.log('\n➕ Añadiendo campos de dirección...')
    
    const migrationQueries = [
      "ALTER TABLE workers ADD COLUMN IF NOT EXISTS street_address TEXT",
      "ALTER TABLE workers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10)",
      "ALTER TABLE workers ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Mataró'",
      "ALTER TABLE workers ADD COLUMN IF NOT EXISTS province VARCHAR(100) DEFAULT 'Barcelona'"
    ]

    for (const query of migrationQueries) {
      console.log(`Ejecutando: ${query}`)
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      
      if (error) {
        console.error(`❌ Error:`, error)
      } else {
        console.log(`✅ Ejecutado correctamente`)
      }
    }

    // 2. Migrar datos existentes del campo address
    console.log('\n🔄 Migrando datos existentes...')
    const { data: workersWithAddress, error: fetchError } = await supabase
      .from('workers')
      .select('id, address, street_address, city, province')
      .not('address', 'is', null)
      .neq('address', '')

    if (fetchError) {
      console.error('❌ Error al obtener trabajadoras:', fetchError)
      return
    }

    console.log(`📊 Encontradas ${workersWithAddress.length} trabajadoras con dirección`)

    for (const worker of workersWithAddress) {
      if (!worker.street_address && worker.address) {
        console.log(`🔄 Migrando dirección de ${worker.id}...`)
        
        const { error: updateError } = await supabase
          .from('workers')
          .update({
            street_address: worker.address,
            city: worker.city || 'Mataró',
            province: worker.province || 'Barcelona'
          })
          .eq('id', worker.id)

        if (updateError) {
          console.error(`❌ Error al migrar ${worker.id}:`, updateError)
        } else {
          console.log(`✅ Dirección migrada para ${worker.id}`)
        }
      }
    }

    // 3. Verificar resultado final
    console.log('\n📋 Verificando resultado final...')
    const { data: finalCheck, error: finalError } = await supabase
      .from('workers')
      .select('id, name, surname, address, street_address, postal_code, city, province')
      .limit(5)

    if (finalError) {
      console.error('❌ Error en verificación final:', finalError)
      return
    }

    console.log('\n✅ Migración completada exitosamente!')
    console.log('\n📊 Ejemplo de datos migrados:')
    finalCheck.forEach(worker => {
      console.log(`  ${worker.name} ${worker.surname}:`)
      console.log(`    Dirección antigua: ${worker.address || 'N/A'}`)
      console.log(`    Calle: ${worker.street_address || 'N/A'}`)
      console.log(`    Código postal: ${worker.postal_code || 'N/A'}`)
      console.log(`    Ciudad: ${worker.city || 'N/A'}`)
      console.log(`    Provincia: ${worker.province || 'N/A'}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

runMigration() 