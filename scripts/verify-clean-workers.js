const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyCleanWorkers() {
// // console.log('🧹 Verificando limpieza de trabajadoras...\n')
  
  try {
    // 1. Obtener todas las trabajadoras
    const { data: workers, error } = await supabase
      .from('workers')
      .select('*')
      .order('employee_code', { ascending: true })

    if (error) {
      console.error('❌ Error al obtener trabajadoras:', error)
      return
    }

// // console.log(`📊 Total de trabajadoras en la base de datos: ${workers.length}\n`)

    if (workers.length === 0) {
// // console.log('⚠️  No hay trabajadoras en la base de datos')
      return
    }

    // 2. Mostrar todas las trabajadoras restantes
// // console.log('👥 Trabajadoras restantes:')
// // console.log('=========================')
    
    workers.forEach((worker, index) => {
// // console.log(`${index + 1}. ${worker.employee_code} - ${worker.name} ${worker.surname}`)
// // console.log(`   Email: ${worker.email}`)
// // console.log(`   Tipo: ${worker.worker_type}`)
// // console.log(`   Activa: ${worker.is_active ? '✅' : '❌'}`)
// // console.log('')
    })

    // 3. Verificar que solo quedan las trabajadoras reales
    const realWorkers = workers.filter(w => 
      w.employee_code === 'TR006' || w.employee_code === 'TR007'
    )

// // console.log('✅ Verificación de trabajadoras reales:')
// // console.log('======================================')
    
    if (realWorkers.length === 2) {
// // console.log('✅ Solo quedan las 2 trabajadoras reales')
      
      realWorkers.forEach(worker => {
        const isRosa = worker.name.includes('Rosa') && worker.employee_code === 'TR006'
        const isGraciela = worker.name.includes('Graciela') && worker.employee_code === 'TR007'
        
        if (isRosa) {
// // console.log(`   ✅ TR006 - Rosa María Robles Muñoz (${worker.worker_type})`)
        } else if (isGraciela) {
// // console.log(`   ✅ TR007 - Graciela Petri (${worker.worker_type})`)
        }
      })
    } else {
// // console.log(`⚠️  Se encontraron ${realWorkers.length} trabajadoras reales (esperadas: 2)`)
    }

    // 4. Mostrar estadísticas finales
// // console.log('\n📈 Estadísticas finales:')
// // console.log('=======================')
    
    const typeCount = workers.reduce((acc, worker) => {
      acc[worker.worker_type] = (acc[worker.worker_type] || 0) + 1
      return acc
    }, {})

    Object.entries(typeCount).forEach(([type, count]) => {
      const emoji = type === 'laborables' ? '🏢' : type === 'festivos' ? '🎊' : '⭐'
// // console.log(`   ${emoji} ${type}: ${count} trabajadora(s)`)
    })

// // console.log(`\n🎉 Base de datos limpia con ${workers.length} trabajadoras reales`)

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

verifyCleanWorkers() 