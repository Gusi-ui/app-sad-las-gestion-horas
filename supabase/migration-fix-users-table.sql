-- Migración completa para corregir la tabla users
-- Eliminar políticas RLS que dependen de worker_id y luego eliminar la columna

-- 1. Eliminar todas las políticas RLS que dependen de worker_id
DROP POLICY IF EXISTS "Los trabajadores solo ven sus usuarios" ON users;
DROP POLICY IF EXISTS "Los trabajadores solo pueden crear usuarios para sí mismos" ON users;
DROP POLICY IF EXISTS "Los trabajadores solo pueden actualizar sus usuarios" ON users;
DROP POLICY IF EXISTS "Los trabajadores solo pueden eliminar sus usuarios" ON users;

DROP POLICY IF EXISTS "Los trabajadores ven tarjetas de sus usuarios" ON service_cards;
DROP POLICY IF EXISTS "Los trabajadores crean tarjetas para sus usuarios" ON service_cards;
DROP POLICY IF EXISTS "Los trabajadores actualizan tarjetas de sus usuarios" ON service_cards;
DROP POLICY IF EXISTS "Los trabajadores eliminan tarjetas de sus usuarios" ON service_cards;

DROP POLICY IF EXISTS "Los trabajadores ven días de servicio de sus tarjetas" ON service_days;
DROP POLICY IF EXISTS "Los trabajadores crean días de servicio para sus tarjetas" ON service_days;
DROP POLICY IF EXISTS "Los trabajadores actualizan días de servicio de sus tarjetas" ON service_days;
DROP POLICY IF EXISTS "Los trabajadores eliminan días de servicio de sus tarjetas" ON service_days;

-- 2. Eliminar la columna worker_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'worker_id'
    ) THEN
        -- Primero eliminar la foreign key constraint si existe
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_worker_id_fkey;
        
        -- Luego eliminar la columna
        ALTER TABLE users DROP COLUMN worker_id;
        
        RAISE NOTICE 'Campo worker_id eliminado de la tabla users';
    ELSE
        RAISE NOTICE 'Campo worker_id no existe en la tabla users';
    END IF;
END $$;

-- 3. Crear nuevas políticas RLS simplificadas
-- Políticas para users (acceso completo para usuarios autenticados)
CREATE POLICY "Permitir acceso completo a usuarios" ON users
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para service_cards (acceso completo para usuarios autenticados)
CREATE POLICY "Permitir acceso completo a tarjetas de servicio" ON service_cards
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para service_days (acceso completo para usuarios autenticados)
CREATE POLICY "Permitir acceso completo a días de servicio" ON service_days
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. Verificar la estructura final de la tabla users
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 5. Verificar que las políticas se crearon correctamente
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
WHERE tablename IN ('users', 'service_cards', 'service_days')
ORDER BY tablename, policyname; 