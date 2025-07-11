// =====================================================
// SCRIPT PARA CREAR USUARIOS DE AUTENTICACIÓN - SAD LAS V2
// =====================================================

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAuthUsers() {
  console.log('🔧 Creando usuarios de autenticación...')

  try {
    const testUsers = [
      {
        email: 'superadmin@sadlas.com',
        password: 'TempPass123!',
        full_name: 'María García López'
      },
      {
        email: 'admin@sadlas.com',
        password: 'TempPass123!',
        full_name: 'Ana Martínez Rodríguez'
      }
    ]
    
    for (const testUser of testUsers) {
      console.log(`📝 Intentando crear usuario: ${testUser.email}`)
      
      // Intentar registro
      const { data, error } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            full_name: testUser.full_name
          }
        }
      })
      
      if (error) {
        console.log(`❌ Error al crear ${testUser.email}: ${error.message}`)
        
        // Si el usuario ya existe, intentar hacer login para verificar
        console.log(`🔍 Verificando si ${testUser.email} ya existe...`)
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: testUser.password
        })
        
        if (loginError) {
          console.log(`❌ No se puede hacer login con ${testUser.email}: ${loginError.message}`)
        } else {
          console.log(`✅ Login exitoso con ${testUser.email}`)
          // Cerrar sesión
          await supabase.auth.signOut()
        }
      } else {
        console.log(`✅ Usuario creado: ${testUser.email}`)
        console.log(`   ID: ${data.user?.id}`)
        console.log(`   Confirmado: ${data.user?.email_confirmed_at ? 'Sí' : 'No'}`)
      }
    }

    console.log('\n🎉 Proceso completado')
    console.log('\n📋 Próximos pasos:')
    console.log('1. Si los usuarios se crearon pero no están confirmados, verifica tu email')
    console.log('2. Si hay errores, puedes crear los usuarios manualmente en el dashboard de Supabase')
    console.log('3. Prueba hacer login con las credenciales')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
createAuthUsers()
  .then(() => {
    console.log('✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en script:', error)
    process.exit(1)
  }) 