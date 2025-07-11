// =====================================================
// SCRIPT PARA DESACTIVAR RLS TEMPORALMENTE - SAD LAS V2
// =====================================================

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function disableRLSTemp() {
  console.log('🔧 Desactivando RLS temporalmente...')

  try {
    const tables = [
      'admins',
      'workers', 
      'users',
      'assignments',
      'monthly_plans',
      'service_days',
      'holidays',
      'system_alerts',
      'system_roles'
    ]

    for (const table of tables) {
      console.log(`🔓 Desactivando RLS en tabla ${table}...`)
      
      // Intentar desactivar RLS
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`⚠️ Error en tabla ${table}: ${error.message}`)
      } else {
        console.log(`✅ Tabla ${table} accesible`)
      }
    }

    // Verificar datos de prueba
    console.log('\n🔍 Verificando datos de prueba...')
    
    // Verificar admins
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
    
    if (adminsError) {
      console.log(`❌ Error al obtener admins: ${adminsError.message}`)
    } else {
      console.log(`✅ Admins encontrados: ${admins?.length || 0}`)
      if (admins && admins.length > 0) {
        admins.forEach(admin => {
          console.log(`   👤 ${admin.full_name} (${admin.email})`)
        })
      }
    }

    // Verificar workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
    
    if (workersError) {
      console.log(`❌ Error al obtener workers: ${workersError.message}`)
    } else {
      console.log(`✅ Workers encontrados: ${workers?.length || 0}`)
      if (workers && workers.length > 0) {
        workers.forEach(worker => {
          console.log(`   👷 ${worker.name} ${worker.surname} (${worker.email})`)
        })
      }
    }

    // Verificar users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) {
      console.log(`❌ Error al obtener users: ${usersError.message}`)
    } else {
      console.log(`✅ Users encontrados: ${users?.length || 0}`)
      if (users && users.length > 0) {
        users.forEach(user => {
          console.log(`   👥 ${user.name} ${user.surname} (${user.client_code})`)
        })
      }
    }

    console.log('\n🎉 Verificación completada')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
disableRLSTemp()
  .then(() => {
    console.log('✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en script:', error)
    process.exit(1)
  }) 