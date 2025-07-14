-- =====================================================
-- APLICAR POLÍTICAS RLS SEGURAS PARA PRODUCCIÓN - SAD LAS
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- Limpiar todas las políticas existentes manualmente
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

DROP POLICY IF EXISTS "worker_own_profile_legacy" ON worker_profiles;
DROP POLICY IF EXISTS "worker_update_own_profile_legacy" ON worker_profiles;
DROP POLICY IF EXISTS "admin_service_cards_access" ON service_cards;
DROP POLICY IF EXISTS "worker_own_service_cards" ON service_cards;

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

-- Super Admin puede gestionar todos los planes mensuales
CREATE POLICY "super_admin_monthly_plans_access" ON monthly_plans 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin')
  )
);

-- Super Admin puede gestionar todos los días de servicio
CREATE POLICY "super_admin_service_days_access" ON service_days 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin')
  )
);

-- Super Admin puede gestionar todos los festivos
CREATE POLICY "super_admin_holidays_access" ON holidays 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin')
  )
);

-- Super Admin puede gestionar todas las alertas del sistema
CREATE POLICY "super_admin_system_alerts_access" ON system_alerts 
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

-- Administradores pueden gestionar planes mensuales
CREATE POLICY "admin_monthly_plans_access" ON monthly_plans 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id IN (
      SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
    )
  )
);

-- Administradores pueden gestionar días de servicio
CREATE POLICY "admin_service_days_access" ON service_days 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id IN (
      SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
    )
  )
);

-- Administradores pueden ver festivos
CREATE POLICY "admin_holidays_read" ON holidays 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id IN (
      SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
    )
  )
);

-- Administradores pueden gestionar alertas del sistema
CREATE POLICY "admin_system_alerts_access" ON system_alerts 
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

-- Trabajadoras pueden ver sus planes mensuales
CREATE POLICY "worker_own_monthly_plans" ON monthly_plans 
FOR SELECT USING (
  worker_id IN (
    SELECT id FROM workers WHERE auth_user_id = auth.uid()
  )
);

-- Trabajadoras pueden ver sus días de servicio
CREATE POLICY "worker_own_service_days" ON service_days 
FOR SELECT USING (
  monthly_plan_id IN (
    SELECT id FROM monthly_plans 
    WHERE worker_id IN (
      SELECT id FROM workers WHERE auth_user_id = auth.uid()
    )
  )
);

-- Trabajadoras pueden actualizar sus días de servicio
CREATE POLICY "worker_update_own_service_days" ON service_days 
FOR UPDATE USING (
  monthly_plan_id IN (
    SELECT id FROM monthly_plans 
    WHERE worker_id IN (
      SELECT id FROM workers WHERE auth_user_id = auth.uid()
    )
  )
);

-- Trabajadoras pueden ver festivos (solo lectura)
CREATE POLICY "worker_holidays_read" ON holidays 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workers 
    WHERE auth_user_id = auth.uid() AND is_active = true
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
-- POLÍTICAS PARA TABLAS LEGACY (si existen)
-- =====================================================

-- Políticas para worker_profiles (si existe)
CREATE POLICY "worker_own_profile_legacy" ON worker_profiles 
FOR SELECT USING (
  id = auth.uid()
);

CREATE POLICY "worker_update_own_profile_legacy" ON worker_profiles 
FOR UPDATE USING (
  id = auth.uid()
);

-- Políticas para service_cards (si existe)
CREATE POLICY "admin_service_cards_access" ON service_cards 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND role_id IN (
      SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
    )
  )
);

CREATE POLICY "worker_own_service_cards" ON service_cards 
FOR SELECT USING (
  worker_id IN (
    SELECT id FROM workers WHERE auth_user_id = auth.uid()
  )
);

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

SELECT enable_rls_for_all_tables();

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