-- Corregir políticas RLS para assignment_history
-- El problema es que la política actual intenta acceder a auth.users sin permisos

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Admins can view all assignment history" ON assignment_history;
DROP POLICY IF EXISTS "Admins can insert assignment history" ON assignment_history;

-- Crear nueva política que no dependa de auth.users
CREATE POLICY "assignment_history_select_policy" ON assignment_history
  FOR SELECT USING (
    -- Permitir acceso a todos los usuarios autenticados por ahora
    -- En producción, puedes ajustar esto según tus necesidades
    auth.uid() IS NOT NULL
  );

CREATE POLICY "assignment_history_insert_policy" ON assignment_history
  FOR INSERT WITH CHECK (
    -- Permitir inserción a todos los usuarios autenticados por ahora
    auth.uid() IS NOT NULL
  );

-- Alternativa: Si quieres mantener restricción por rol, usar una función
-- CREATE OR REPLACE FUNCTION is_admin()
-- RETURNS BOOLEAN AS $$
-- BEGIN
--   RETURN EXISTS (
--     SELECT 1 FROM auth.users 
--     WHERE auth.users.id = auth.uid() 
--     AND auth.users.raw_user_meta_data->>'role' = 'admin'
--   );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Y luego usar:
-- CREATE POLICY "assignment_history_select_policy" ON assignment_history
--   FOR SELECT USING (is_admin()); 