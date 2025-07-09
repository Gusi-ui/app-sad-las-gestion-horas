-- =====================================================
// CORRECCIÓN DE POLÍTICAS RLS - SAD LAS V2
-- =====================================================

-- Primero, eliminar todas las políticas existentes que causan recursión
DROP POLICY IF EXISTS "Super admin access all" ON admins;
DROP POLICY IF EXISTS "Super admin access all workers" ON workers;
DROP POLICY IF EXISTS "Super admin access all users" ON users;
DROP POLICY IF EXISTS "Admin access all workers" ON workers;
DROP POLICY IF EXISTS "Admin access all users" ON users;
DROP POLICY IF EXISTS "Admin access all assignments" ON assignments;
DROP POLICY IF EXISTS "Workers can view own profile" ON workers;
DROP POLICY IF EXISTS "Workers can update own profile" ON workers;
DROP POLICY IF EXISTS "Workers can view own assignments" ON assignments;
DROP POLICY IF EXISTS "Workers can view own monthly plans" ON monthly_plans;
DROP POLICY IF EXISTS "Workers can view own service days" ON service_days;
DROP POLICY IF EXISTS "Workers can update own service days" ON service_days;

-- =====================================================
-- NUEVAS POLÍTICAS RLS SIMPLIFICADAS
-- =====================================================

-- Política temporal para permitir acceso total durante desarrollo
-- (Se puede restringir más adelante cuando implementemos autenticación)

-- Admins: Permitir acceso total temporalmente
CREATE POLICY "admins_allow_all" ON admins FOR ALL USING (true);

-- Workers: Permitir acceso total temporalmente
CREATE POLICY "workers_allow_all" ON workers FOR ALL USING (true);

-- Users: Permitir acceso total temporalmente
CREATE POLICY "users_allow_all" ON users FOR ALL USING (true);

-- Assignments: Permitir acceso total temporalmente
CREATE POLICY "assignments_allow_all" ON assignments FOR ALL USING (true);

-- Monthly plans: Permitir acceso total temporalmente
CREATE POLICY "monthly_plans_allow_all" ON monthly_plans FOR ALL USING (true);

-- Service days: Permitir acceso total temporalmente
CREATE POLICY "service_days_allow_all" ON service_days FOR ALL USING (true);

-- Holidays: Permitir acceso total temporalmente
CREATE POLICY "holidays_allow_all" ON holidays FOR ALL USING (true);

-- System alerts: Permitir acceso total temporalmente
CREATE POLICY "system_alerts_allow_all" ON system_alerts FOR ALL USING (true);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname; 