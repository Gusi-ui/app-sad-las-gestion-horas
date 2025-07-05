-- Migración para agregar campo role a worker_profiles
-- Este script agrega el campo role para distinguir entre administradores y trabajadoras

-- Verificar si el campo role ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worker_profiles' AND column_name = 'role'
    ) THEN
        -- Agregar el campo role
        ALTER TABLE worker_profiles 
        ADD COLUMN role VARCHAR(20) DEFAULT 'worker' CHECK (role IN ('admin', 'worker'));
        
        -- Agregar comentario
        COMMENT ON COLUMN worker_profiles.role IS 'Rol del usuario: admin (administrador) o worker (trabajadora)';
        
        RAISE NOTICE 'Campo role agregado a worker_profiles';
    ELSE
        RAISE NOTICE 'El campo role ya existe en worker_profiles';
    END IF;
END $$;

-- Actualizar perfiles existentes para que tengan el rol de trabajadora por defecto
UPDATE worker_profiles 
SET role = 'worker' 
WHERE role IS NULL;

-- Verificar que todos los perfiles tengan un rol asignado
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'worker' THEN 1 END) as worker_count
FROM worker_profiles; 