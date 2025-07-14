const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Función para leer input del usuario
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function createSuperAdminInteractive() {
  console.log('👑 Creando Super Admin para SAD LAS (Producción)...\n')

  try {
    // =====================================================
    // 1. VERIFICAR ESTRUCTURA
    // =====================================================
    console.log('📋 Verificando estructura de base de datos...')

    // Verificar si existe la tabla system_roles
    const { data: rolesCheck, error: rolesError } = await supabase
      .from('system_roles')
      .select('*')
      .limit(1)

    if (rolesError) {
      console.error('❌ Error: Tabla system_roles no existe')
      console.log('💡 Ejecuta primero el script: supabase/apply-schema.sql')
      return
    }

    // Verificar si existe la tabla admins
    const { data: adminsCheck, error: adminsError } = await supabase
      .from('admins')
      .select('*')
      .limit(1)

    if (adminsError) {
      console.error('❌ Error: Tabla admins no existe')
      console.log('💡 Ejecuta primero el script: supabase/apply-schema.sql')
      return
    }

    console.log('✅ Estructura de base de datos verificada')

    // =====================================================
    // 2. SOLICITAR CREDENCIALES
    // =====================================================
    console.log('\n🔑 Configurando credenciales Super Admin...')

    // Solicitar email
    let superAdminEmail = await askQuestion('📧 Email del Super Admin: ')
    if (!superAdminEmail) {
      console.log('❌ Email es obligatorio')
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(superAdminEmail)) {
      console.log('❌ Formato de email inválido')
      return
    }

    // Solicitar nombre completo
    let superAdminName = await askQuestion('👤 Nombre completo del Super Admin: ')
    if (!superAdminName) {
      superAdminName = 'Super Administrador SAD LAS'
    }

    // Solicitar contraseña
    let superAdminPassword = await askQuestion('🔑 Contraseña (mínimo 8 caracteres): ')
    if (!superAdminPassword) {
      console.log('❌ Contraseña es obligatoria')
      return
    }

    if (superAdminPassword.length < 8) {
      console.log('❌ La contraseña debe tener al menos 8 caracteres')
      return
    }

    // Confirmar contraseña
    let confirmPassword = await askQuestion('🔑 Confirmar contraseña: ')
    if (superAdminPassword !== confirmPassword) {
      console.log('❌ Las contraseñas no coinciden')
      return
    }

    console.log('\n📋 Resumen de configuración:')
    console.log(`  📧 Email: ${superAdminEmail}`)
    console.log(`  👤 Nombre: ${superAdminName}`)
    console.log(`  🔑 Contraseña: ${'*'.repeat(superAdminPassword.length)}`)

    // Confirmar creación
    const confirm = await askQuestion('\n¿Confirmar creación del Super Admin? (s/N): ')
    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'si' && confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Creación cancelada')
      return
    }

    // =====================================================
    // 3. VERIFICAR SI YA EXISTE
    // =====================================================
    console.log('\n🔍 Verificando si ya existe el Super Admin...')

    const { data: existingSuperAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', superAdminEmail.toLowerCase())
      .single()

    if (existingSuperAdmin) {
      console.log('✅ Super Admin ya existe')
      console.log(`📧 Email: ${existingSuperAdmin.email}`)
      console.log(`👤 Nombre: ${existingSuperAdmin.full_name}`)
      console.log(`🆔 ID: ${existingSuperAdmin.id}`)
      console.log(`✅ Activo: ${existingSuperAdmin.is_active ? 'Sí' : 'No'}`)
      
      const updatePassword = await askQuestion('\n¿Deseas actualizar la contraseña? (s/N): ')
      if (updatePassword.toLowerCase() === 's' || updatePassword.toLowerCase() === 'si' || updatePassword.toLowerCase() === 'y' || updatePassword.toLowerCase() === 'yes') {
        console.log('🔄 Actualizando contraseña...')
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingSuperAdmin.id,
          { password: superAdminPassword }
        )
        
        if (updateError) {
          console.error('❌ Error actualizando contraseña:', updateError.message)
          return
        }
        
        console.log('✅ Contraseña actualizada exitosamente')
      }
      return
    }

    // =====================================================
    // 4. OBTENER ROL SUPER ADMIN
    // =====================================================
    console.log('\n🎭 Obteniendo rol super_admin...')

    const { data: superAdminRole, error: roleError } = await supabase
      .from('system_roles')
      .select('id, name, description')
      .eq('name', 'super_admin')
      .single()

    if (roleError || !superAdminRole) {
      console.error('❌ Error: No se encontró el rol super_admin')
      console.log('💡 Verifica que se haya ejecutado el script de roles')
      return
    }

    console.log(`✅ Rol encontrado: ${superAdminRole.name} - ${superAdminRole.description}`)

    // =====================================================
    // 5. CREAR USUARIO EN AUTH.USERS
    // =====================================================
    console.log('\n👤 Creando usuario en auth.users...')

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: superAdminEmail.toLowerCase(),
      password: superAdminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: superAdminName,
        role: 'super_admin'
      }
    })

    if (authError) {
      console.error('❌ Error creando usuario auth:', authError.message)
      return
    }

    console.log(`✅ Usuario auth creado: ${authUser.user.id}`)

    // =====================================================
    // 6. CREAR REGISTRO EN TABLA ADMINS
    // =====================================================
    console.log('\n📝 Creando registro en tabla admins...')

    const { data: adminRecord, error: adminError } = await supabase
      .from('admins')
      .insert({
        id: authUser.user.id,
        email: superAdminEmail.toLowerCase(),
        full_name: superAdminName,
        role_id: superAdminRole.id,
        is_active: true,
        created_by: null // Es el primer admin, no tiene creador
      })
      .select()
      .single()

    if (adminError) {
      console.error('❌ Error creando admin:', adminError.message)
      
      // Intentar limpiar el usuario auth creado
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id)
        console.log('🧹 Usuario auth eliminado por error')
      } catch (cleanupError) {
        console.error('⚠️  No se pudo limpiar el usuario auth:', cleanupError.message)
      }
      return
    }

    console.log(`✅ Admin creado exitosamente: ${adminRecord.id}`)

    // =====================================================
    // 7. VERIFICAR CREACIÓN
    // =====================================================
    console.log('\n🔍 Verificando creación...')

    const { data: verification } = await supabase
      .from('admins')
      .select(`
        id,
        email,
        full_name,
        is_active,
        created_at,
        system_roles(name, description)
      `)
      .eq('id', adminRecord.id)
      .single()

    if (verification) {
      console.log('✅ Verificación exitosa:')
      console.log(`  🆔 ID: ${verification.id}`)
      console.log(`  📧 Email: ${verification.email}`)
      console.log(`  👤 Nombre: ${verification.full_name}`)
      console.log(`  🎭 Rol: ${verification.system_roles.name}`)
      console.log(`  📝 Descripción: ${verification.system_roles.description}`)
      console.log(`  ✅ Activo: ${verification.is_active ? 'Sí' : 'No'}`)
      console.log(`  📅 Creado: ${new Date(verification.created_at).toLocaleString()}`)
    }

    // =====================================================
    // 8. MOSTRAR RESUMEN
    // =====================================================
    console.log('\n🎉 ¡Super Admin creado exitosamente!')
    console.log('\n📋 Resumen:')
    console.log('  ✅ Usuario creado en auth.users')
    console.log('  ✅ Registro creado en tabla admins')
    console.log('  ✅ Rol super_admin asignado')
    console.log('  ✅ Cuenta activada')
    console.log('\n🔑 Credenciales de acceso:')
    console.log(`  📧 Email: ${superAdminEmail}`)
    console.log(`  🔑 Contraseña: ${'*'.repeat(superAdminPassword.length)}`)
    console.log('\n⚠️  IMPORTANTE:')
    console.log('  - Guarda estas credenciales en un lugar seguro')
    console.log('  - Esta cuenta tiene acceso total al sistema')
    console.log('  - Solo el Super Admin puede crear otros administradores')
    console.log('\n🌐 URL de acceso:')
    console.log('  http://localhost:3000/login')

    // Guardar credenciales en archivo temporal
    const fs = require('fs')
    const credentials = {
      email: superAdminEmail,
      password: superAdminPassword,
      name: superAdminName,
      created_at: new Date().toISOString()
    }
    
    fs.writeFileSync('super-admin-credentials.json', JSON.stringify(credentials, null, 2))
    console.log('\n💾 Credenciales guardadas en: super-admin-credentials.json')
    console.log('⚠️  Elimina este archivo después de guardar las credenciales')

  } catch (error) {
    console.error('❌ Error durante la creación:', error.message)
    process.exit(1)
  }
}

// Ejecutar el script
createSuperAdminInteractive()
  .then(() => {
    console.log('\n✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error en el script:', error.message)
    process.exit(1)
  }) 