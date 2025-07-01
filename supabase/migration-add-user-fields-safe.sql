-- Migración segura para agregar campos address y monthly_hours a la tabla users
-- Verifica si los campos existen antes de crearlos

-- Agregar campo address solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'address'
    ) THEN
        ALTER TABLE users ADD COLUMN address TEXT;
        RAISE NOTICE 'Campo address agregado a la tabla users';
    ELSE
        RAISE NOTICE 'Campo address ya existe en la tabla users';
    END IF;
END $$;

-- Agregar campo monthly_hours solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'monthly_hours'
    ) THEN
        ALTER TABLE users ADD COLUMN monthly_hours DECIMAL(5,2) DEFAULT 0 CHECK (monthly_hours >= 0);
        RAISE NOTICE 'Campo monthly_hours agregado a la tabla users';
    ELSE
        RAISE NOTICE 'Campo monthly_hours ya existe en la tabla users';
    END IF;
END $$;

-- Actualizar registros existentes para establecer un valor por defecto en monthly_hours
UPDATE users SET monthly_hours = 0 WHERE monthly_hours IS NULL;

-- Verificar el resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('address', 'monthly_hours')
ORDER BY column_name; 