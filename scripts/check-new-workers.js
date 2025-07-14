const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkNewWorkers() {
// // console.log('🔍 Verificando trabajadoras creadas...\n')
  
  try {
    // 1. Buscar las trabajadoras específicas
// // console.log('📋 Buscando trabajadoras específicas:')
// // console.log('=====================================')
    
    const { data: workers, error } = await supabase
      .from('workers')
      .select('*')
      .or('name.ilike.%Rosa%,name.ilike.%Graciela%')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error al buscar trabajadoras:', error)
      return
    }

    if (!workers || workers.length === 0) {
// // console.log('❌ No se encontraron trabajadoras con esos nombres')
      return
    }

// // console.log(`✅ Se encontraron ${workers.length} trabajadoras:\n`)

    // 2. Mostrar detalles de cada trabajadora
    workers.forEach((worker, index) => {
// // console.log(`👤 Trabajadora ${index + 1}:`)
// // console.log(`   ID: ${worker.id}`)
// // console.log(`   Código: ${worker.employee_code}`)
// // console.log(`   Nombre: ${worker.name} ${worker.surname}`)
// // console.log(`   Email: ${worker.email}`)
// // console.log(`   Teléfono: ${worker.phone}`)
// // console.log(`   DNI: ${worker.dni || 'No especificado'}`)
// // console.log(`   Tipo: ${worker.worker_type}`)
// // console.log(`   Tarifa: €${worker.hourly_rate}/hora`)
// // console.log(`   Fecha contratación: ${worker.hire_date}`)
// // console.log(`   Días disponibles: ${worker.availability_days?.join(', ') || 'No especificados'}`)
// // console.log(`   Dirección: ${worker.street_address || 'No especificada'}`)
// // console.log(`   Código postal: ${worker.postal_code || 'No especificado'}`)
// // console.log(`   Ciudad: ${worker.city || 'No especificada'}`)
// // console.log(`   Notas: ${worker.notes || 'Sin notas'}`)
// // console.log(`   Activa: ${worker.is_active ? '✅ Sí' : '❌ No'}`)
// // console.log(`   Creada: ${new Date(worker.created_at).toLocaleString('es-ES')}`)
// // console.log('')
    })

    // 3. Verificar tipos de trabajadora
// // console.log('📊 Resumen por tipo de trabajadora:')
// // console.log('==================================')
    
    const typeCount = workers.reduce((acc, worker) => {
      acc[worker.worker_type] = (acc[worker.worker_type] || 0) + 1
      return acc
    }, {})

    Object.entries(typeCount).forEach(([type, count]) => {
      const emoji = type === 'laborables' ? '🏢' : type === 'festivos' ? '🎊' : '⭐'
// // console.log(`   ${emoji} ${type}: ${count} trabajadora(s)`)
    })

    // 4. Verificar que los datos están completos
// // console.log('\n🔍 Verificación de datos completos:')
// // console.log('===================================')
    
    workers.forEach((worker, index) => {
      const missingFields = []
      
      if (!worker.name || !worker.surname) missingFields.push('nombre/apellidos')
      if (!worker.email) missingFields.push('email')
      if (!worker.phone) missingFields.push('teléfono')
      if (!worker.worker_type) missingFields.push('tipo de trabajadora')
      if (!worker.hourly_rate) missingFields.push('tarifa')
      if (!worker.hire_date) missingFields.push('fecha de contratación')
      if (!worker.availability_days || worker.availability_days.length === 0) missingFields.push('días de disponibilidad')
      
      if (missingFields.length === 0) {
// // console.log(`   ✅ Trabajadora ${index + 1}: Datos completos`)
      } else {
// // console.log(`   ⚠️  Trabajadora ${index + 1}: Faltan: ${missingFields.join(', ')}`)
      }
    })

    // 5. Verificar secuencia de códigos de empleado
// // console.log('\n🔢 Verificación de códigos de empleado:')
// // console.log('======================================')
    
    const codes = workers.map(w => w.employee_code).sort()
// // console.log(`   Códigos encontrados: ${codes.join(', ')}`)
    
    // Verificar si son secuenciales
    const isSequential = codes.every((code, index) => {
      if (index === 0) return true
      const prevCode = codes[index - 1]
      const prevNum = parseInt(prevCode.replace('TR', ''))
      const currentNum = parseInt(code.replace('TR', ''))
      return currentNum === prevNum + 1
    })
    
// // console.log(`   Secuencial: ${isSequential ? '✅ Sí' : '❌ No'}`)

// // console.log('\n🎉 ¡Verificación completada!')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

checkNewWorkers() 