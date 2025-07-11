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

async function updateWorkerAddressData() {
  console.log('🚀 Actualizando datos de dirección de trabajadoras...')
  
  try {
    // 1. Obtener trabajadoras con dirección existente
    console.log('\n📋 Obteniendo trabajadoras con dirección...')
    const { data: workersWithAddress, error: fetchError } = await supabase
      .from('workers')
      .select('id, name, surname, address')
      .not('address', 'is', null)
      .neq('address', '')

    if (fetchError) {
      console.error('❌ Error al obtener trabajadoras:', fetchError)
      return
    }

    console.log(`📊 Encontradas ${workersWithAddress.length} trabajadoras con dirección`)

    // 2. Actualizar datos de dirección
    for (const worker of workersWithAddress) {
      console.log(`🔄 Actualizando dirección de ${worker.name} ${worker.surname}...`)
      
      // Extraer información de la dirección existente
      let streetAddress = worker.address
      let city = 'Mataró'
      let province = 'Barcelona'
      let postalCode = null

      // Intentar extraer código postal si está en la dirección
      const postalCodeMatch = worker.address.match(/\b\d{5}\b/)
      if (postalCodeMatch) {
        postalCode = postalCodeMatch[0]
        streetAddress = worker.address.replace(postalCode, '').replace(/,\s*$/, '').trim()
      }

      // Intentar extraer ciudad si está en la dirección
      if (worker.address.toLowerCase().includes('mataró')) {
        city = 'Mataró'
        streetAddress = streetAddress.replace(/mataró/i, '').replace(/,\s*$/, '').trim()
      } else if (worker.address.toLowerCase().includes('barcelona')) {
        city = 'Barcelona'
        streetAddress = streetAddress.replace(/barcelona/i, '').replace(/,\s*$/, '').trim()
      }

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from('workers')
        .update({
          street_address: streetAddress,
          postal_code: postalCode,
          city: city,
          province: province
        })
        .eq('id', worker.id)

      if (updateError) {
        console.error(`❌ Error al actualizar ${worker.id}:`, updateError)
      } else {
        console.log(`✅ Actualizado: ${streetAddress}, ${postalCode || 'sin CP'}, ${city}`)
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

    console.log('\n✅ Actualización completada exitosamente!')
    console.log('\n📊 Ejemplo de datos actualizados:')
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

updateWorkerAddressData() 