-- =====================================================
-- APLICAR POLÍTICAS RLS SEGURAS PARA PRODUCCIÓN - SAD LAS (SIMPLIFICADO)
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- Limpiar políticas existentes solo para tablas que existen
DROP POLICY IF EXISTS "super_admin_all_access" ON admins;
DROP POLICY IF EXISTS "super_admin_workers_access" ON workers;
DROP POLICY IF EXISTS "super_admin_users_access" ON users;
DROP POLICY IF EXISTS "super_admin_assignments_access" ON assignments;
DROP POLICY IF EXISTS "super_admin_monthly_plans_access" ON monthly_plans;
DROP POLICY IF EXISTS "super_admin_service_days_access" ON service_days;
DROP POLICY IF EXISTS "super_admin_holidays_access" ON holidays;
DROP POLICY IF EXISTS "super_admin_system_alerts_access" ON system_alerts;
DROP POLICY IF EXISTS "super_admin_assignment_history_access" ON assignment_history;

DROP POLICY IF EXISTS "admin_workers_access" ON workers;
DROP POLICY IF EXISTS "admin_users_access" ON users;
DROP POLICY IF EXISTS "admin_assignments_access" ON assignments;
DROP POLICY IF EXISTS "admin_monthly_plans_access" ON monthly_plans;
DROP POLICY IF EXISTS "admin_service_days_access" ON service_days;
DROP POLICY IF EXISTS "admin_holidays_read" ON holidays;
DROP POLICY IF EXISTS "admin_system_alerts_access" ON system_alerts;
DROP POLICY IF EXISTS "admin_assignment_history_access" ON assignment_history;

DROP POLICY IF EXISTS "worker_own_profile_read" ON workers;
DROP POLICY IF EXISTS "worker_own_profile_update" ON workers;
DROP POLICY IF EXISTS "worker_own_assignments" ON assignments;
DROP POLICY IF EXISTS "worker_own_monthly_plans" ON monthly_plans;
DROP POLICY IF EXISTS "worker_own_service_days" ON service_days;
DROP POLICY IF EXISTS "worker_update_own_service_days" ON service_days;
DROP POLICY IF EXISTS "worker_holidays_read" ON holidays;
DROP POLICY IF EXISTS "worker_own_assignment_history" ON assignment_history;

-- =====================================================
-- POLÍTICAS PARA SUPER ADMIN (acceso total)
-- =====================================================

-- Super Admin puede gestionar todos los administradores
CREATE POLICY "super_admin_all_access" ON admins 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin')
  )
);

-- Super Admin puede gestionar todas las trabajadoras
CREATE POLICY "super_admin_workers_access" ON workers 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin')
  )
);

-- Super Admin puede gestionar todos los usuarios
CREATE POLICY "super_admin_users_access" ON users 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin')
  )
);

-- Super Admin puede gestionar todas las asignaciones
CREATE POLICY "super_admin_assignments_access" ON assignments 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin')
  )
);

-- Super Admin puede gestionar todo el historial de asignaciones
CREATE POLICY "super_admin_assignment_history_access" ON assignment_history 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin')
  )
);

-- =====================================================
-- POLÍTICAS PARA ADMINISTRADORES
-- =====================================================

-- Administradores pueden gestionar trabajadoras
CREATE POLICY "admin_workers_access" ON workers 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id IN (
      SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
    )
  )
);

-- Administradores pueden gestionar usuarios
CREATE POLICY "admin_users_access" ON users 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id IN (
      SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
    )
  )
);

-- Administradores pueden gestionar asignaciones
CREATE POLICY "admin_assignments_access" ON assignments 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id IN (
      SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
    )
  )
);

-- Administradores pueden ver historial de asignaciones
CREATE POLICY "admin_assignment_history_access" ON assignment_history 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id IN (
      SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
    )
  )
);

-- =====================================================
-- POLÍTICAS PARA TRABAJADORAS
-- =====================================================

-- Trabajadoras pueden ver su propio perfil
CREATE POLICY "worker_own_profile_read" ON workers 
FOR SELECT USING (
  auth_user_id = auth.uid()
);

-- Trabajadoras pueden actualizar su propio perfil
CREATE POLICY "worker_own_profile_update" ON workers 
FOR UPDATE USING (
  auth_user_id = auth.uid()
);

-- Trabajadoras pueden ver sus asignaciones
CREATE POLICY "worker_own_assignments" ON assignments 
FOR SELECT USING (
  worker_id IN (
    SELECT id FROM workers WHERE auth_user_id = auth.uid()
  )
);

-- Trabajadoras pueden ver su historial de asignaciones
CREATE POLICY "worker_own_assignment_history" ON assignment_history 
FOR SELECT USING (
  assignment_id IN (
    SELECT id FROM assignments 
    WHERE worker_id IN (
      SELECT id FROM workers WHERE auth_user_id = auth.uid()
    )
  )
);

-- =====================================================
-- HABILITAR RLS EN TABLAS EXISTENTES
-- =====================================================

ALTER TABLE IF EXISTS admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignment_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Mostrar todas las políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Mensaje de confirmación
DO $$ 
BEGIN
    RAISE NOTICE '✅ Políticas RLS de producción aplicadas exitosamente!';
    RAISE NOTICE '🔒 Seguridad configurada para:';
    RAISE NOTICE '  - Super Admin: Acceso total';
    RAISE NOTICE '  - Administradores: Gestión de trabajadoras, usuarios y asignaciones';
    RAISE NOTICE '  - Trabajadoras: Solo su información personal';
    RAISE NOTICE '⚠️  IMPORTANTE: Verificar que todas las políticas se aplicaron correctamente';
END $$; 