-- =====================================================
-- DESHABILITAR RLS TEMPORALMENTE PARA PRUEBAS - SAD LAS
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- Deshabilitar RLS en todas las tablas
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_history DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('admins', 'workers', 'users', 'assignments', 'assignment_history')
ORDER BY tablename;

-- Mensaje de confirmación
DO $$ 
BEGIN
    RAISE NOTICE '✅ RLS deshabilitado temporalmente en todas las tablas!';
    RAISE NOTICE '⚠️  IMPORTANTE: Esto es solo para pruebas';
    RAISE NOTICE '🔒 Para producción, ejecuta: supabase/apply-production-rls-simple.sql';
    RAISE NOTICE '🌐 Ahora puedes probar el acceso al sistema';
END $$; 