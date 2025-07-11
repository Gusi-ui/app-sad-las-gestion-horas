-- Script para arreglar las políticas RLS que causan recursión infinita
-- Primero deshabilitar RLS temporalmente para poder arreglar las políticas

-- Deshabilitar RLS en todas las tablas
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
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

-- Habilitar RLS nuevamente
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Crear políticas simplificadas que no causen recursión
-- Para desarrollo, permitir acceso completo a usuarios autenticados
CREATE POLICY "Allow all for authenticated users" ON admins FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON workers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON assignments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON monthly_plans FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON service_days FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON holidays FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON system_alerts FOR ALL USING (auth.role() = 'authenticated');

-- Mensaje de confirmación
DO $$ 
BEGIN
    RAISE NOTICE 'Políticas RLS arregladas exitosamente!';
    RAISE NOTICE 'Acceso completo habilitado para usuarios autenticados';
END $$; 