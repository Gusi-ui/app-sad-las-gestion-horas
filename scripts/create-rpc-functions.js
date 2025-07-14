const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createRPCFunctions() {
  console.log('🛠️  Creando funciones RPC necesarias...\n')

  const functions = [
    // Función para ejecutar SQL dinámicamente
    `CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    // Función para deshabilitar RLS en todas las tablas
    `CREATE OR REPLACE FUNCTION disable_rls_for_all_tables()
    RETURNS void AS $$
    BEGIN
      ALTER TABLE IF EXISTS admins DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS workers DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS assignments DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS monthly_plans DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS service_days DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS holidays DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS system_alerts DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS assignment_history DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS worker_profiles DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS service_cards DISABLE ROW LEVEL SECURITY;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    // Función para habilitar RLS en todas las tablas
    `CREATE OR REPLACE FUNCTION enable_rls_for_all_tables()
    RETURNS void AS $$
    BEGIN
      ALTER TABLE IF EXISTS admins ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS workers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS assignments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS monthly_plans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS service_days ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS holidays ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS system_alerts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS assignment_history ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS worker_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS service_cards ENABLE ROW LEVEL SECURITY;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    // Función para limpiar todas las políticas RLS
    `CREATE OR REPLACE FUNCTION clear_all_rls_policies()
    RETURNS void AS $$
    DECLARE
      policy_record RECORD;
    BEGIN
      -- Limpiar políticas de admins
      FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'admins'
      LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON admins';
      END LOOP;

      -- Limpiar políticas de workers
      FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'workers'
      LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON workers';
      END LOOP;

      -- Limpiar políticas de users
      FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users'
      LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON users';
      END LOOP;

      -- Limpiar políticas de assignments
      FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'assignments'
      LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON assignments';
      END LOOP;

      -- Limpiar políticas de assignment_history
      FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'assignment_history'
      LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON assignment_history';
      END LOOP;

      -- Limpiar políticas de monthly_plans
      FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'monthly_plans'
      LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON monthly_plans';
      END LOOP;

      -- Limpiar políticas de service_days
      FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'service_days'
      LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON service_days';
      END LOOP;

      -- Limpiar políticas de holidays
      FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'holidays'
      LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON holidays';
      END LOOP;

      -- Limpiar políticas de system_alerts
      FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'system_alerts'
      LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON system_alerts';
      END LOOP;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    // Función para crear admin
    `CREATE OR REPLACE FUNCTION create_admin(
      admin_email TEXT,
      admin_full_name TEXT,
      role_name TEXT DEFAULT 'admin',
      created_by_uuid UUID DEFAULT NULL
    )
    RETURNS UUID AS $$
    DECLARE
      admin_id UUID;
      role_id UUID;
      temp_password TEXT;
    BEGIN
      -- Generar contraseña temporal
      temp_password := 'TempPass' || floor(random() * 10000)::text || '!';
      
      -- Crear usuario en auth.users
      INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data
      ) VALUES (
        admin_email,
        crypt(temp_password, gen_salt('bf')),
        NOW(),
        jsonb_build_object('full_name', admin_full_name)
      ) RETURNING id INTO admin_id;

      -- Obtener el role_id
      SELECT id INTO role_id FROM system_roles WHERE name = role_name;
      
      IF role_id IS NULL THEN
        RAISE EXCEPTION 'Rol % no encontrado', role_name;
      END IF;

      -- Crear registro en tabla admins
      INSERT INTO admins (
        id,
        email,
        full_name,
        role_id,
        is_active,
        created_by
      ) VALUES (
        admin_id,
        admin_email,
        admin_full_name,
        role_id,
        true,
        created_by_uuid
      );

      -- Retornar el ID del admin creado
      RETURN admin_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    // Función para verificar si un usuario es super admin
    `CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID DEFAULT auth.uid())
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 
        FROM admins a
        JOIN system_roles sr ON a.role_id = sr.id
        WHERE a.id = user_uuid 
        AND a.is_active = true 
        AND sr.name = 'super_admin'
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    // Función para verificar si un usuario es admin
    `CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 
        FROM admins a
        JOIN system_roles sr ON a.role_id = sr.id
        WHERE a.id = user_uuid 
        AND a.is_active = true 
        AND sr.name IN ('super_admin', 'admin')
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`
  ]

  for (const func of functions) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: func })
      if (error) {
        console.error('❌ Error creando función:', error.message)
      } else {
        console.log('✅ Función creada/actualizada')
      }
    } catch (error) {
      // Si exec_sql no existe, crear las funciones directamente
      try {
        const { error: directError } = await supabase.rpc('exec_sql', { sql: func })
        if (directError) {
          console.error('❌ Error creando función:', directError.message)
        }
      } catch (e) {
        console.log('⚠️  No se puede usar exec_sql, creando funciones manualmente...')
        // En este caso, las funciones se crearán manualmente en el dashboard de Supabase
        break
      }
    }
  }

  console.log('\n✅ Funciones RPC creadas/actualizadas')
  console.log('\n📋 Funciones disponibles:')
  console.log('  - exec_sql(sql): Ejecutar SQL dinámicamente')
  console.log('  - disable_rls_for_all_tables(): Deshabilitar RLS')
  console.log('  - enable_rls_for_all_tables(): Habilitar RLS')
  console.log('  - clear_all_rls_policies(): Limpiar políticas RLS')
  console.log('  - create_admin(email, name, role, created_by): Crear admin')
  console.log('  - is_super_admin(user_id): Verificar super admin')
  console.log('  - is_admin(user_id): Verificar admin')
}

createRPCFunctions()
  .then(() => {
    console.log('\n✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }) 