const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    console.log('🔍 Verificando usuarios admin existentes...')
    
    // Verificar si existen roles del sistema
    const { data: roles, error: rolesError } = await supabase
      .from('system_roles')
      .select('*')
    
    if (rolesError) {
      console.error('Error al verificar roles:', rolesError)
      return
    }
    
    console.log('Roles encontrados:', roles?.length || 0)
    
    // Verificar si existen admins
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
    
    if (adminsError) {
      console.error('Error al verificar admins:', adminsError)
      return
    }
    
    console.log('Admins encontrados:', admins?.length || 0)
    
    if (admins && admins.length > 0) {
      console.log('✅ Ya existen usuarios admin:')
      admins.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.full_name})`)
      })
      return
    }
    
    // Crear roles del sistema si no existen
    if (!roles || roles.length === 0) {
      console.log('📝 Creando roles del sistema...')
      
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
        console.error('Error al crear rol super_admin:', superAdminError)
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
        console.error('Error al crear rol admin:', adminError)
        return
      }
      
      console.log('✅ Roles del sistema creados')
    }
    
    // Obtener el rol super_admin
    const { data: superAdminRole, error: roleError } = await supabase
      .from('system_roles')
      .select('*')
      .eq('name', 'super_admin')
      .single()
    
    if (roleError || !superAdminRole) {
      console.error('Error al obtener rol super_admin:', roleError)
      return
    }
    
    // Crear usuario en auth.users
    console.log('👤 Creando usuario en auth.users...')
    
    const testAdminEmail = 'admin@sadlas.com'
    const testAdminPassword = 'Admin123!'
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testAdminEmail,
      password: testAdminPassword,
      email_confirm: true
    })
    
    if (authError) {
      console.error('Error al crear usuario en auth:', authError)
      return
    }
    
    console.log('✅ Usuario creado en auth.users:', authUser.user.email)
    
    // Crear admin en la tabla admins
    console.log('👨‍💼 Creando admin en la tabla admins...')
    
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
      console.error('Error al crear admin:', adminError)
      return
    }
    
    console.log('✅ Admin creado exitosamente!')
    console.log('📧 Email:', testAdminEmail)
    console.log('🔑 Contraseña:', testAdminPassword)
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login')
    
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

createAdminUser() 