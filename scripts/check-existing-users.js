const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
// // console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante')
// // console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ Faltante')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkExistingUsers() {
// // console.log('🔍 Verificando usuarios existentes en la base de datos...\n')

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error al obtener usuarios:', error)
      return
    }

// // console.log(`📊 Total de usuarios encontrados: ${users.length}\n`)

    if (users.length === 0) {
// // console.log('📝 No hay usuarios en la base de datos.')
// // console.log('💡 Puedes proceder a crear usuarios reales.')
      return
    }

// // console.log('👥 Usuarios existentes:')
// // console.log('─'.repeat(80))

    users.forEach((user, index) => {
// // console.log(`${index + 1}. ${user.name} ${user.surname}`)
// // console.log(`   📧 Email: ${user.email || 'No especificado'}`)
// // console.log(`   📞 Teléfono: ${user.phone}`)
// // console.log(`   🏠 Dirección: ${user.address}`)
// // console.log(`   🏙️ Ciudad: ${user.city}`)
// // console.log(`   📮 Código Postal: ${user.postal_code || 'No especificado'}`)
// // console.log(`   🏥 Provincia: ${user.province}`)
// // console.log(`   ⏰ Horas Mensuales: ${user.monthly_hours || 0}h`)
// // console.log(`   🏷️ Tipo de Servicio: ${user.service_type || 'No especificado'}`)
// // console.log(`   📋 Días de Servicio: ${user.special_requirements?.length > 0 ? user.special_requirements.join(', ') : 'No especificados'}`)
// // console.log(`   💊 Condiciones Médicas: ${user.medical_conditions?.length > 0 ? user.medical_conditions.join(', ') : 'Ninguna'}`)
// // console.log(`   🚨 Alergias: ${user.allergies?.length > 0 ? user.allergies.join(', ') : 'Ninguna'}`)
// // console.log(`   💊 Medicamentos: ${user.medications?.length > 0 ? user.medications.join(', ') : 'Ninguno'}`)
// // console.log(`   📊 Estado: ${user.status} ${user.is_active ? '✅' : '❌'}`)
// // console.log(`   📅 Creado: ${new Date(user.created_at).toLocaleDateString('es-ES')}`)
// // console.log(`   🔢 Código: ${user.client_code}`)
// // console.log('─'.repeat(80))
    })

    // Análisis de datos
    const activeUsers = users.filter(u => u.is_active && u.status === 'active')
    const pausedUsers = users.filter(u => u.status === 'paused')
    const completedUsers = users.filter(u => u.status === 'completed')
    const cancelledUsers = users.filter(u => u.status === 'cancelled')

// // console.log('\n📈 Análisis de usuarios:')
// // console.log(`   ✅ Activos: ${activeUsers.length}`)
// // console.log(`   ⏸️ Pausados: ${pausedUsers.length}`)
// // console.log(`   ✅ Completados: ${completedUsers.length}`)
// // console.log(`   ❌ Cancelados: ${cancelledUsers.length}`)

    const totalHours = users.reduce((sum, user) => sum + (user.monthly_hours || 0), 0)
// // console.log(`\n⏰ Total de horas mensuales asignadas: ${totalHours}h`)

    const serviceTypes = [...new Set(users.map(u => u.service_type).filter(Boolean))]
// // console.log(`\n🏷️ Tipos de servicio utilizados: ${serviceTypes.length > 0 ? serviceTypes.join(', ') : 'Ninguno'}`)

    const cities = [...new Set(users.map(u => u.city).filter(Boolean))]
// // console.log(`\n🏙️ Ciudades: ${cities.join(', ')}`)

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

checkExistingUsers() 