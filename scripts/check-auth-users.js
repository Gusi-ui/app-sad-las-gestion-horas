// =====================================================
// SCRIPT PARA VERIFICAR USUARIOS DE AUTENTICACIÓN - SAD LAS V2
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

async function checkAuthUsers() {
  console.log('🔍 Verificando usuarios de autenticación...')

  try {
    // 1. Verificar usuarios en auth.users
    console.log('\n1. Verificando usuarios en auth.users...')
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log(`❌ Error al obtener usuarios de auth: ${authError.message}`)
    } else {
      console.log(`✅ Usuarios en auth.users: ${authUsers?.users?.length || 0}`)
      
      if (authUsers?.users && authUsers.users.length > 0) {
        authUsers.users.forEach(user => {
          console.log(`   👤 ${user.email} (${user.id}) - ${user.email_confirmed_at ? 'Confirmado' : 'No confirmado'}`)
        })
      } else {
        console.log('   ⚠️ No hay usuarios en auth.users')
      }
    }

    // 2. Verificar admins en la tabla admins
    console.log('\n2. Verificando admins en tabla admins...')
    
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
    
    if (adminsError) {
      console.log(`❌ Error al obtener admins: ${adminsError.message}`)
    } else {
      console.log(`✅ Admins en tabla admins: ${admins?.length || 0}`)
      
      if (admins && admins.length > 0) {
        admins.forEach(admin => {
          console.log(`   👤 ${admin.full_name} (${admin.email}) - ID: ${admin.id}`)
        })
      } else {
        console.log('   ⚠️ No hay admins en la tabla admins')
      }
    }

    // 3. Verificar si los emails coinciden
    console.log('\n3. Verificando coincidencia de emails...')
    
    const adminEmails = admins?.map(a => a.email) || []
    const authEmails = authUsers?.users?.map(u => u.email) || []
    
    console.log('Emails en auth.users:', authEmails)
    console.log('Emails en admins:', adminEmails)
    
    const missingInAuth = adminEmails.filter(email => !authEmails.includes(email))
    const missingInAdmins = authEmails.filter(email => !adminEmails.includes(email))
    
    if (missingInAuth.length > 0) {
      console.log(`❌ Emails en admins pero no en auth.users: ${missingInAuth.join(', ')}`)
    }
    
    if (missingInAdmins.length > 0) {
      console.log(`❌ Emails en auth.users pero no en admins: ${missingInAdmins.join(', ')}`)
    }
    
    if (missingInAuth.length === 0 && missingInAdmins.length === 0) {
      console.log('✅ Todos los emails coinciden')
    }

    // 4. Intentar crear usuarios de prueba si no existen
    console.log('\n4. Creando usuarios de prueba si no existen...')
    
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
      const existingUser = authUsers?.users?.find(u => u.email === testUser.email)
      
      if (!existingUser) {
        console.log(`📝 Creando usuario: ${testUser.email}`)
        
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true
        })
        
        if (createError) {
          console.log(`❌ Error al crear ${testUser.email}: ${createError.message}`)
        } else {
          console.log(`✅ Usuario creado: ${testUser.email}`)
        }
      } else {
        console.log(`✅ Usuario ya existe: ${testUser.email}`)
      }
    }

    console.log('\n🎉 Verificación completada')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
checkAuthUsers()
  .then(() => {
    console.log('✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en script:', error)
    process.exit(1)
  }) 