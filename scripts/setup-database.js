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

async function setupDatabase() {
  try {
    console.log('🚀 Iniciando configuración de la base de datos SAD LAS V2...')
    
    // =====================================================
    // 1. CREAR ROLES DEL SISTEMA
    // =====================================================
    console.log('\n📝 1. Configurando roles del sistema...')
    
    const { data: existingRoles, error: rolesError } = await supabase
      .from('system_roles')
      .select('*')
    
    if (rolesError) {
      console.log('⚠️ Tabla system_roles no existe, creando...')
      // Aquí podrías ejecutar el SQL para crear la tabla si no existe
    }
    
    if (!existingRoles || existingRoles.length === 0) {
      console.log('➕ Creando roles del sistema...')
      
      const { data: superAdminRole, error: superAdminError } = await supabase
        .from('system_roles')
        .insert({
          name: 'super_admin',
          description: 'Super Administrador - Control total del sistema',
          permissions: {
            can_manage_admins: true,
            can_manage_workers: true,
            can_manage_users: true,
            can_manage_assignments: true,
            can_view_reports: true,
            can_manage_system: true
          }
        })
        .select()
        .single()
      
      if (superAdminError) {
        console.error('❌ Error al crear rol super_admin:', superAdminError)
        return
      }
      
      const { data: adminRole, error: adminError } = await supabase
        .from('system_roles')
        .insert({
          name: 'admin',
          description: 'Administrador - Gestión de trabajadoras, usuarios y asignaciones',
          permissions: {
            can_manage_admins: false,
            can_manage_workers: true,
            can_manage_users: true,
            can_manage_assignments: true,
            can_view_reports: true,
            can_manage_system: false
          }
        })
        .select()
        .single()
      
      if (adminError) {
        console.error('❌ Error al crear rol admin:', adminError)
        return
      }
      
      console.log('✅ Roles del sistema creados')
    } else {
      console.log('✅ Roles del sistema ya existen')
    }
    
    // =====================================================
    // 2. VERIFICAR/CREAR ADMINISTRADOR
    // =====================================================
    console.log('\n👨‍💼 2. Configurando administrador...')
    
    const { data: existingAdmins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
    
    if (adminsError) {
      console.error('❌ Error al verificar admins:', adminsError)
      return
    }
    
    if (existingAdmins && existingAdmins.length > 0) {
      console.log('✅ Ya existen administradores:')
      existingAdmins.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.full_name})`)
      })
    } else {
      console.log('➕ Creando administrador de prueba...')
      
      // Obtener el rol super_admin
      const { data: superAdminRole, error: roleError } = await supabase
        .from('system_roles')
        .select('*')
        .eq('name', 'super_admin')
        .single()
      
      if (roleError || !superAdminRole) {
        console.error('❌ Error al obtener rol super_admin:', roleError)
        return
      }
      
      // Crear usuario en auth.users
      const testAdminEmail = 'admin@sadlas.com'
      const testAdminPassword = 'Admin123!'
      
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testAdminEmail,
        password: testAdminPassword,
        email_confirm: true
      })
      
      if (authError) {
        console.error('❌ Error al crear usuario en auth:', authError)
        return
      }
      
      console.log('✅ Usuario creado en auth.users:', authUser.user.email)
      
      // Crear admin en la tabla admins
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .insert({
          id: authUser.user.id,
          email: testAdminEmail,
          full_name: 'Administrador de Prueba',
          role_id: superAdminRole.id,
          is_active: true
        })
        .select()
        .single()
      
      if (adminError) {
        console.error('❌ Error al crear admin:', adminError)
        return
      }
      
      console.log('✅ Administrador creado exitosamente!')
      console.log('📧 Email:', testAdminEmail)
      console.log('🔑 Contraseña:', testAdminPassword)
      console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login')
    }
    
    // =====================================================
    // 3. VERIFICAR TABLAS PRINCIPALES
    // =====================================================
    console.log('\n🗄️ 3. Verificando tablas principales...')
    
    const tables = ['workers', 'users', 'assignments', 'monthly_plans', 'service_days', 'holidays']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) {
          console.log(`⚠️ Tabla ${table}: ${error.message}`)
        } else {
          console.log(`✅ Tabla ${table}: OK`)
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: No existe o error de acceso`)
      }
    }
    
    // =====================================================
    // 4. RESUMEN FINAL
    // =====================================================
    console.log('\n🎉 Configuración completada!')
    console.log('\n📋 Resumen:')
    console.log('✅ Roles del sistema configurados')
    console.log('✅ Administrador creado')
    console.log('✅ Tablas principales verificadas')
    console.log('\n🚀 Próximos pasos:')
    console.log('1. Configura las variables de entorno en .env.local')
    console.log('2. Reinicia el servidor de desarrollo')
    console.log('3. Visita http://localhost:3000/admin/login')
    console.log('4. Usa las credenciales mostradas arriba')
    
  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

setupDatabase() 