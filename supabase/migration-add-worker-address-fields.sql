-- =====================================================
-- MIGRACIÓN: Añadir campos de dirección completos a workers
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- 1. Añadir campos de dirección si no existen
ALTER TABLE workers ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Mataró';
ALTER TABLE workers ADD COLUMN IF NOT EXISTS province VARCHAR(100) DEFAULT 'Barcelona';

-- 2. Migrar datos existentes del campo address a los nuevos campos
UPDATE workers 
SET 
    street_address = CASE 
        WHEN address IS NOT NULL AND address != '' THEN address
        ELSE NULL
    END,
    city = CASE 
        WHEN address IS NOT NULL AND address != '' AND city IS NULL THEN 'Mataró'
        ELSE COALESCE(city, 'Mataró')
    END,
    province = CASE 
        WHEN address IS NOT NULL AND address != '' AND province IS NULL THEN 'Barcelona'
        ELSE COALESCE(province, 'Barcelona')
    END
WHERE address IS NOT NULL AND address != '';

-- 3. Verificar el resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'workers' 
AND column_name IN ('street_address', 'postal_code', 'city', 'province')
ORDER BY column_name;

-- 4. Mostrar algunos ejemplos de datos migrados
SELECT 
    id,
    name,
    surname,
    address as old_address,
    street_address,
    postal_code,
    city,
    province
FROM workers 
WHERE address IS NOT NULL 
LIMIT 5; 