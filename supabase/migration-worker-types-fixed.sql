-- Migración: Actualizar estructura para tipos de trabajadoras (CORREGIDA)
-- Fecha: Enero 2025

-- Verificar y añadir worker_type a worker_profiles solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worker_profiles' AND column_name = 'worker_type'
    ) THEN
        ALTER TABLE worker_profiles 
        ADD COLUMN worker_type TEXT DEFAULT 'regular' CHECK (worker_type IN ('regular', 'holidays', 'weekends'));
    END IF;
END $$;

-- Verificar y añadir worker_type a service_cards solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_cards' AND column_name = 'worker_type'
    ) THEN
        ALTER TABLE service_cards 
        ADD COLUMN worker_type TEXT DEFAULT 'regular' CHECK (worker_type IN ('regular', 'holidays', 'weekends'));
    END IF;
END $$;

-- Verificar y añadir specific_dates a service_cards solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_cards' AND column_name = 'specific_dates'
    ) THEN
        ALTER TABLE service_cards 
        ADD COLUMN specific_dates JSONB;
    END IF;
END $$;

-- Verificar y añadir weekend_config a service_cards solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_cards' AND column_name = 'weekend_config'
    ) THEN
        ALTER TABLE service_cards 
        ADD COLUMN weekend_config JSONB;
    END IF;
END $$;

-- Verificar y añadir specific_date a service_days solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_days' AND column_name = 'specific_date'
    ) THEN
        ALTER TABLE service_days 
        ADD COLUMN specific_date DATE;
    END IF;
END $$;

-- Eliminar campos antiguos de manera segura
DO $$ 
BEGIN
    -- Eliminar includes_holidays si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_cards' AND column_name = 'includes_holidays'
    ) THEN
        ALTER TABLE service_cards DROP COLUMN includes_holidays;
    END IF;
    
    -- Eliminar includes_weekends si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_cards' AND column_name = 'includes_weekends'
    ) THEN
        ALTER TABLE service_cards DROP COLUMN includes_weekends;
    END IF;
    
    -- Eliminar holiday_hours si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_cards' AND column_name = 'holiday_hours'
    ) THEN
        ALTER TABLE service_cards DROP COLUMN holiday_hours;
    END IF;
    
    -- Eliminar weekend_hours si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_cards' AND column_name = 'weekend_hours'
    ) THEN
        ALTER TABLE service_cards DROP COLUMN weekend_hours;
    END IF;
END $$;

-- Actualizar la restricción unique para permitir múltiples tarjetas por usuario (diferentes tipos)
-- Primero eliminar la restricción existente si existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_cards_user_id_month_year_key'
    ) THEN
        ALTER TABLE service_cards DROP CONSTRAINT service_cards_user_id_month_year_key;
    END IF;
END $$;

-- Añadir la nueva restricción única
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_cards_user_id_month_year_worker_type_key'
    ) THEN
        ALTER TABLE service_cards 
        ADD CONSTRAINT service_cards_user_id_month_year_worker_type_key 
        UNIQUE(user_id, month, year, worker_type);
    END IF;
END $$;

-- Añadir comentarios para documentar
COMMENT ON COLUMN service_cards.worker_type IS 'Tipo de trabajadora: regular, holidays, weekends';
COMMENT ON COLUMN service_cards.specific_dates IS 'Fechas específicas para trabajadora de festivos: ["2025-01-01"]';
COMMENT ON COLUMN service_cards.weekend_config IS 'Configuración de fines de semana: {"saturday": true, "sunday": false}';
COMMENT ON COLUMN service_days.specific_date IS 'Fecha específica para festivos (ej: 2025-01-01)';
COMMENT ON COLUMN worker_profiles.worker_type IS 'Tipo de trabajadora: regular, holidays, weekends';

-- Mensaje final
DO $$ 
BEGIN
    RAISE NOTICE 'Migración completada con éxito. Estructura actualizada para tipos de trabajadoras.';
END $$; 