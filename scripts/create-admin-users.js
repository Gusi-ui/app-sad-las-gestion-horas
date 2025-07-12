const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('Por favor, configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUsers() {
  try {
    console.log('🚀 Creando usuarios admin en Supabase Auth...')
    
    const adminUsers = [
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
    
    for (const user of adminUsers) {
      console.log(`\n📝 Procesando: ${user.email}`)
      
      try {
        // Intentar crear el usuario usando el admin API
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            role: 'admin'
          }
        })
        
        if (error) {
          console.log(`❌ Error al crear ${user.email}: ${error.message}`)
          
          // Si el error es que el usuario ya existe, intentar obtenerlo
          if (error.message.includes('already registered')) {
            console.log(`🔍 Usuario ${user.email} ya existe, intentando obtener...`)
            
            const { data: existingUser, error: getError } = await supabase.auth.admin.listUsers()
            
            if (getError) {
              console.log(`❌ Error al listar usuarios: ${getError.message}`)
            } else {
              const foundUser = existingUser.users.find(u => u.email === user.email)
              if (foundUser) {
                console.log(`✅ Usuario encontrado: ${foundUser.email} (ID: ${foundUser.id})`)
                
                // Intentar actualizar la contraseña
                const { error: updateError } = await supabase.auth.admin.updateUserById(
                  foundUser.id,
                  { password: user.password }
                )
                
                if (updateError) {
                  console.log(`⚠️ Error al actualizar contraseña: ${updateError.message}`)
                } else {
                  console.log(`✅ Contraseña actualizada para ${user.email}`)
                }
              } else {
                console.log(`❌ Usuario ${user.email} no encontrado en auth.users`)
              }
            }
          }
        } else {
          console.log(`✅ Usuario creado exitosamente: ${data.user.email}`)
          console.log(`   ID: ${data.user.id}`)
          console.log(`   Confirmado: ${data.user.email_confirmed_at ? 'Sí' : 'No'}`)
        }
        
      } catch (err) {
        console.log(`❌ Error inesperado con ${user.email}:`, err.message)
      }
    }
    
    console.log('\n🎉 Proceso completado')
    console.log('\n📋 Credenciales de acceso:')
    console.log('🔑 Contraseña: TempPass123!')
    console.log('\n👤 Usuarios:')
    adminUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.full_name})`)
    })
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

createAdminUsers() 