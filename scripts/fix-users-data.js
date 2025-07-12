const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Mapeo de tipos de servicio
const serviceTypeMapping = {
  'cuidado_completo': 'elderly_care',
  'limpieza_cocina': 'domestic_help',
  'cuidado_basico': 'elderly_care',
  'domestic_help': 'domestic_help',
  'disability_care': 'disability_care'
}

// Función para limpiar arrays de strings
function cleanArrayField(field) {
  if (!field) return []
  if (Array.isArray(field)) return field
  if (typeof field === 'string') {
    return field.split(',').map(item => item.trim()).filter(item => item.length > 0)
  }
  return []
}

// Función para determinar días de servicio basado en requisitos especiales
function getServiceDays(specialRequirements) {
  const requirements = cleanArrayField(specialRequirements)
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  // Si ya tiene días válidos, mantenerlos
  const validDaysFound = requirements.filter(req => validDays.includes(req))
  if (validDaysFound.length > 0) {
    return validDaysFound
  }
  
  // Si no tiene días válidos, asignar días por defecto basado en horas
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
}

// Función para limpiar requisitos especiales
function getSpecialRequirements(specialRequirements) {
  const requirements = cleanArrayField(specialRequirements)
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  // Filtrar solo requisitos que no son días de la semana
  return requirements.filter(req => !validDays.includes(req))
}

async function fixUsersData() {
  console.log('🔧 Iniciando limpieza y estandarización de datos de usuarios...\n')

  try {
    // Obtener todos los usuarios
    const { data: users, error } = await supabase
      .from('users')
      .select('*')

    if (error) {
      console.error('❌ Error al obtener usuarios:', error)
      return
    }

    console.log(`📊 Procesando ${users.length} usuarios...\n`)

    for (const user of users) {
      console.log(`🔧 Procesando: ${user.name} ${user.surname} (${user.client_code})`)
      
      const updates = {}
      let hasChanges = false

      // 1. Limpiar tipo de servicio
      if (user.service_type && serviceTypeMapping[user.service_type]) {
        updates.service_type = serviceTypeMapping[user.service_type]
        console.log(`   🏷️ Tipo de servicio: ${user.service_type} → ${updates.service_type}`)
        hasChanges = true
      }

      // 2. Separar días de servicio de requisitos especiales
      const currentRequirements = cleanArrayField(user.special_requirements)
      const serviceDays = getServiceDays(currentRequirements)
      const specialRequirements = getSpecialRequirements(currentRequirements)
      
      if (JSON.stringify(serviceDays) !== JSON.stringify(currentRequirements)) {
        updates.special_requirements = specialRequirements
        console.log(`   📋 Requisitos especiales: ${specialRequirements.join(', ') || 'Ninguno'}`)
        hasChanges = true
      }

      // 3. Limpiar condiciones médicas
      const medicalConditions = cleanArrayField(user.medical_conditions)
      if (JSON.stringify(medicalConditions) !== JSON.stringify(user.medical_conditions)) {
        updates.medical_conditions = medicalConditions
        console.log(`   💊 Condiciones médicas: ${medicalConditions.join(', ') || 'Ninguna'}`)
        hasChanges = true
      }

      // 4. Limpiar alergias
      const allergies = cleanArrayField(user.allergies)
      if (JSON.stringify(allergies) !== JSON.stringify(user.allergies)) {
        updates.allergies = allergies
        console.log(`   🚨 Alergias: ${allergies.join(', ') || 'Ninguna'}`)
        hasChanges = true
      }

      // 5. Limpiar medicamentos
      const medications = cleanArrayField(user.medications)
      if (JSON.stringify(medications) !== JSON.stringify(user.medications)) {
        updates.medications = medications
        console.log(`   💊 Medicamentos: ${medications.join(', ') || 'Ninguno'}`)
        hasChanges = true
      }

      // 6. Asegurar que monthly_hours sea un número
      if (user.monthly_hours === null || user.monthly_hours === undefined) {
        updates.monthly_hours = 0
        console.log(`   ⏰ Horas mensuales: 0 (valor por defecto)`)
        hasChanges = true
      }

      // 7. Asegurar que city tenga valor por defecto
      if (!user.city) {
        updates.city = 'Mataró'
        console.log(`   🏙️ Ciudad: Mataró (valor por defecto)`)
        hasChanges = true
      }

      // 8. Asegurar que province tenga valor por defecto
      if (!user.province) {
        updates.province = 'Barcelona'
        console.log(`   🏥 Provincia: Barcelona (valor por defecto)`)
        hasChanges = true
      }

      // Actualizar en la base de datos si hay cambios
      if (hasChanges) {
        const { error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id)

        if (updateError) {
          console.error(`   ❌ Error al actualizar ${user.client_code}:`, updateError)
        } else {
          console.log(`   ✅ Usuario ${user.client_code} actualizado correctamente`)
        }
      } else {
        console.log(`   ✅ Usuario ${user.client_code} ya está correcto`)
      }
      
      console.log('')
    }

    console.log('🎉 Proceso de limpieza completado!')
    console.log('💡 Ejecuta "node scripts/check-existing-users.js" para verificar los resultados')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

fixUsersData() 