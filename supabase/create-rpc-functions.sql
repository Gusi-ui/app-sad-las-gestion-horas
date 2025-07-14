-- =====================================================
-- CREAR FUNCIONES RPC NECESARIAS - SAD LAS
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- Función para ejecutar SQL dinámicamente
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para deshabilitar RLS en todas las tablas
CREATE OR REPLACE FUNCTION disable_rls_for_all_tables()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para habilitar RLS en todas las tablas
CREATE OR REPLACE FUNCTION enable_rls_for_all_tables()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar todas las políticas RLS
CREATE OR REPLACE FUNCTION clear_all_rls_policies()
RETURNS void AS $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Limpiar políticas de admins
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'admins'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON admins';
  END LOOP;

  -- Limpiar políticas de workers
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'workers'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON workers';
  END LOOP;

  -- Limpiar políticas de users
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'users'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON users';
  END LOOP;

  -- Limpiar políticas de assignments
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'assignments'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON assignments';
  END LOOP;

  -- Limpiar políticas de assignment_history
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'assignment_history'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON assignment_history';
  END LOOP;

  -- Limpiar políticas de monthly_plans
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'monthly_plans'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON monthly_plans';
  END LOOP;

  -- Limpiar políticas de service_days
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'service_days'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON service_days';
  END LOOP;

  -- Limpiar políticas de holidays
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'holidays'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON holidays';
  END LOOP;

  -- Limpiar políticas de system_alerts
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'system_alerts'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON system_alerts';
  END LOOP;

  -- Limpiar políticas de worker_profiles
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'worker_profiles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON worker_profiles';
  END LOOP;

  -- Limpiar políticas de service_cards
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'service_cards'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON service_cards';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear admin
CREATE OR REPLACE FUNCTION create_admin(
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID DEFAULT auth.uid())
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_role()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar permisos
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mensaje de confirmación
DO $$ 
BEGIN
    RAISE NOTICE '✅ Funciones RPC creadas exitosamente!';
    RAISE NOTICE '📋 Funciones disponibles:';
    RAISE NOTICE '  - exec_sql(sql): Ejecutar SQL dinámicamente';
    RAISE NOTICE '  - disable_rls_for_all_tables(): Deshabilitar RLS';
    RAISE NOTICE '  - enable_rls_for_all_tables(): Habilitar RLS';
    RAISE NOTICE '  - clear_all_rls_policies(): Limpiar políticas RLS';
    RAISE NOTICE '  - create_admin(email, name, role, created_by): Crear admin';
    RAISE NOTICE '  - is_super_admin(user_id): Verificar super admin';
    RAISE NOTICE '  - is_admin(user_id): Verificar admin';
    RAISE NOTICE '  - get_current_user_role(): Obtener rol actual';
    RAISE NOTICE '  - has_permission(permission): Verificar permiso';
END $$; 