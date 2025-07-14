const { createClient } = require('@supabase/supabase-js')
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

async function createSuperAdmin() {
  console.log('👑 Creando Super Admin para SAD LAS...\n')

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
    // 2. CONFIGURAR CREDENCIALES
    // =====================================================
    // Solicitar email real para producción
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@sadlas.com'
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin2025!'
    const superAdminName = process.env.SUPER_ADMIN_NAME || 'Super Administrador SAD LAS'

    console.log('\n🔑 Configurando credenciales Super Admin:')
    console.log(`📧 Email: ${superAdminEmail}`)
    console.log(`🔑 Contraseña: ${superAdminPassword}`)
    console.log(`👤 Nombre: ${superAdminName}`)

    // =====================================================
    // 3. VERIFICAR SI YA EXISTE
    // =====================================================
    console.log('\n🔍 Verificando si ya existe el Super Admin...')

    const { data: existingSuperAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', superAdminEmail)
      .single()

    if (existingSuperAdmin) {
      console.log('✅ Super Admin ya existe')
      console.log(`📧 Email: ${existingSuperAdmin.email}`)
      console.log(`👤 Nombre: ${existingSuperAdmin.full_name}`)
      console.log(`🆔 ID: ${existingSuperAdmin.id}`)
      console.log(`✅ Activo: ${existingSuperAdmin.is_active ? 'Sí' : 'No'}`)
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
      email: superAdminEmail,
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
        email: superAdminEmail,
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
    console.log(`  🔑 Contraseña: ${superAdminPassword}`)
    console.log('\n⚠️  IMPORTANTE:')
    console.log('  - Cambiar la contraseña en el primer login')
    console.log('  - Esta cuenta tiene acceso total al sistema')
    console.log('  - Solo el Super Admin puede crear otros administradores')
    console.log('\n🌐 URL de acceso:')
    console.log('  http://localhost:3000/login')

  } catch (error) {
    console.error('❌ Error durante la creación:', error.message)
    process.exit(1)
  }
}

// Ejecutar el script
createSuperAdmin()
  .then(() => {
    console.log('\n✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error en el script:', error.message)
    process.exit(1)
  }) 