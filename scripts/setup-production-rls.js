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

async function setupProductionRLS() {
  console.log('🚀 Configurando sistema de producción con RLS seguro...\n')

  try {
    // =====================================================
    // 1. VERIFICAR ESTRUCTURA ACTUAL
    // =====================================================
    console.log('📋 Verificando estructura actual...')

    // Verificar si existe la tabla system_roles
    const { data: rolesCheck, error: rolesError } = await supabase
      .from('system_roles')
      .select('*')
      .limit(1)

    if (rolesError) {
      console.log('⚠️  Tabla system_roles no existe, creándola...')
      await createSystemRoles()
    } else {
      console.log('✅ Tabla system_roles existe')
    }

    // Verificar si existe la tabla admins
    const { data: adminsCheck, error: adminsError } = await supabase
      .from('admins')
      .select('*')
      .limit(1)

    if (adminsError) {
      console.log('⚠️  Tabla admins no existe, creándola...')
      await createAdminsTable()
    } else {
      console.log('✅ Tabla admins existe')
    }

    // =====================================================
    // 2. CREAR SUPER ADMIN
    // =====================================================
    console.log('\n👑 Configurando Super Admin...')
    
    const superAdminEmail = 'superadmin@sadlas.com'
    const superAdminPassword = 'SuperAdmin2025!'
    
    // Verificar si ya existe el super admin
    const { data: existingSuperAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', superAdminEmail)
      .single()

    if (!existingSuperAdmin) {
      console.log('📧 Creando usuario Super Admin en auth.users...')
      
      // Crear usuario en auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: superAdminEmail,
        password: superAdminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Super Administrador SAD LAS'
        }
      })

      if (authError) {
        console.error('❌ Error creando usuario auth:', authError.message)
        return
      }

      console.log('✅ Usuario auth creado:', authUser.user.id)

      // Obtener el rol super_admin
      const { data: superAdminRole } = await supabase
        .from('system_roles')
        .select('id')
        .eq('name', 'super_admin')
        .single()

      if (!superAdminRole) {
        console.error('❌ Error: No se encontró el rol super_admin')
        return
      }

      // Crear registro en tabla admins
      const { data: adminRecord, error: adminError } = await supabase
        .from('admins')
        .insert({
          id: authUser.user.id,
          email: superAdminEmail,
          full_name: 'Super Administrador SAD LAS',
          role_id: superAdminRole.id,
          is_active: true
        })
        .select()
        .single()

      if (adminError) {
        console.error('❌ Error creando admin:', adminError.message)
        return
      }

      console.log('✅ Super Admin creado exitosamente')
      console.log('📧 Email:', superAdminEmail)
      console.log('🔑 Contraseña:', superAdminPassword)
      console.log('⚠️  IMPORTANTE: Cambiar la contraseña en el primer login')
    } else {
      console.log('✅ Super Admin ya existe')
    }

    // =====================================================
    // 3. CONFIGURAR POLÍTICAS RLS SEGURAS
    // =====================================================
    console.log('\n🔒 Configurando políticas RLS seguras...')

    // Deshabilitar RLS temporalmente para aplicar políticas
    await supabase.rpc('disable_rls_for_all_tables')

    // Aplicar políticas RLS seguras
    await applySecureRLSPolicies()

    // Habilitar RLS nuevamente
    await supabase.rpc('enable_rls_for_all_tables')

    console.log('✅ Políticas RLS configuradas')

    // =====================================================
    // 4. VERIFICAR CONFIGURACIÓN
    // =====================================================
    console.log('\n🔍 Verificando configuración...')

    // Verificar roles
    const { data: roles } = await supabase
      .from('system_roles')
      .select('*')

    console.log('📋 Roles del sistema:')
    roles.forEach(role => {
      console.log(`  - ${role.name}: ${role.description}`)
    })

    // Verificar admins
    const { data: admins } = await supabase
      .from('admins')
      .select(`
        id,
        email,
        full_name,
        is_active,
        system_roles(name)
      `)

    console.log('\n👥 Administradores:')
    admins.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.system_roles.name}) - ${admin.is_active ? 'Activo' : 'Inactivo'}`)
    })

    // =====================================================
    // 5. CREAR FUNCIONES DE UTILIDAD
    // =====================================================
    console.log('\n🛠️  Creando funciones de utilidad...')
    await createUtilityFunctions()

    console.log('\n🎉 ¡Configuración de producción completada!')
    console.log('\n📋 Resumen:')
    console.log('  ✅ Sistema de roles implementado')
    console.log('  ✅ Super Admin creado')
    console.log('  ✅ Políticas RLS seguras aplicadas')
    console.log('  ✅ Funciones de utilidad creadas')
    console.log('\n🔑 Credenciales Super Admin:')
    console.log(`  📧 Email: ${superAdminEmail}`)
    console.log(`  🔑 Contraseña: ${superAdminPassword}`)
    console.log('\n⚠️  IMPORTANTE: Cambiar la contraseña del Super Admin en el primer login')

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message)
    process.exit(1)
  }
}

async function createSystemRoles() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS system_roles (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        permissions JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      INSERT INTO system_roles (name, description, permissions) VALUES
      ('super_admin', 'Super Administrador - Control total del sistema', 
       '{"manage_admins": true, "view_all": true, "system_config": true}'),
      ('admin', 'Administrador - Gestión de trabajadoras, usuarios y asignaciones', 
       '{"manage_workers": true, "manage_users": true, "manage_assignments": true, "view_reports": true}'),
      ('worker', 'Trabajadora - Acceso solo a su planning personal', 
       '{"view_own_schedule": true, "update_own_status": true}')
      ON CONFLICT (name) DO NOTHING;
    `
  })

  if (error) {
    console.error('❌ Error creando system_roles:', error.message)
    throw error
  }
}

async function createAdminsTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS admins (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role_id UUID REFERENCES system_roles(id) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID REFERENCES auth.users(id),
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  })

  if (error) {
    console.error('❌ Error creando tabla admins:', error.message)
    throw error
  }
}

async function applySecureRLSPolicies() {
  const policies = [
    // Políticas para Super Admin
    `CREATE POLICY "super_admin_all_access" ON admins FOR ALL USING (
      EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin'))
    )`,

    `CREATE POLICY "super_admin_workers_access" ON workers FOR ALL USING (
      EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin'))
    )`,

    `CREATE POLICY "super_admin_users_access" ON users FOR ALL USING (
      EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin'))
    )`,

    `CREATE POLICY "super_admin_assignments_access" ON assignments FOR ALL USING (
      EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin'))
    )`,

    // Políticas para Administradores
    `CREATE POLICY "admin_workers_access" ON workers FOR ALL USING (
      EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id IN (
        SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
      ))
    )`,

    `CREATE POLICY "admin_users_access" ON users FOR ALL USING (
      EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id IN (
        SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
      ))
    )`,

    `CREATE POLICY "admin_assignments_access" ON assignments FOR ALL USING (
      EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id IN (
        SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
      ))
    )`,

    // Políticas para Trabajadoras
    `CREATE POLICY "worker_own_profile" ON workers FOR SELECT USING (
      auth_user_id = auth.uid()
    )`,

    `CREATE POLICY "worker_update_own_profile" ON workers FOR UPDATE USING (
      auth_user_id = auth.uid()
    )`,

    `CREATE POLICY "worker_own_assignments" ON assignments FOR SELECT USING (
      worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid())
    )`,

    // Políticas para assignment_history
    `CREATE POLICY "admin_assignment_history_access" ON assignment_history FOR ALL USING (
      EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id IN (
        SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
      ))
    )`,

    `CREATE POLICY "worker_own_assignment_history" ON assignment_history FOR SELECT USING (
      assignment_id IN (
        SELECT id FROM assignments WHERE worker_id IN (
          SELECT id FROM workers WHERE auth_user_id = auth.uid()
        )
      )
    )`
  ]

  for (const policy of policies) {
    try {
      await supabase.rpc('exec_sql', { sql: policy })
    } catch (error) {
      // Ignorar errores de políticas ya existentes
      if (!error.message.includes('already exists')) {
        console.error('❌ Error aplicando política:', error.message)
      }
    }
  }
}

async function createUtilityFunctions() {
  const functions = [
    // Función para obtener el rol del usuario actual
    `CREATE OR REPLACE FUNCTION get_current_user_role()
    RETURNS TEXT AS $$
    DECLARE
      user_role TEXT;
    BEGIN
      -- Verificar si es admin
      SELECT sr.name INTO user_role
      FROM admins a
      JOIN system_roles sr ON a.role_id = sr.id
      WHERE a.id = auth.uid() AND a.is_active = true;
      
      IF user_role IS NOT NULL THEN
        RETURN user_role;
      END IF;
      
      -- Verificar si es worker
      SELECT 'worker' INTO user_role
      FROM workers
      WHERE auth_user_id = auth.uid() AND is_active = true;
      
      RETURN user_role;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    // Función para verificar permisos
    `CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
    RETURNS BOOLEAN AS $$
    DECLARE
      user_permissions JSONB;
    BEGIN
      -- Obtener permisos del usuario actual
      SELECT sr.permissions INTO user_permissions
      FROM admins a
      JOIN system_roles sr ON a.role_id = sr.id
      WHERE a.id = auth.uid() AND a.is_active = true;
      
      IF user_permissions IS NOT NULL THEN
        RETURN (user_permissions->>permission_name)::BOOLEAN;
      END IF;
      
      RETURN false;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`
  ]

  for (const func of functions) {
    try {
      await supabase.rpc('exec_sql', { sql: func })
    } catch (error) {
      console.error('❌ Error creando función:', error.message)
    }
  }
}

// Ejecutar el script
setupProductionRLS()
  .then(() => {
    console.log('\n✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error en el script:', error.message)
    process.exit(1)
  }) 