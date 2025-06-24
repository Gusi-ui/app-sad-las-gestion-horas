-- Migración: Actualizar estructura para tipos de trabajadoras
-- Fecha: Enero 2025

-- 1. Añadir el tipo de trabajadora a worker_profiles
ALTER TABLE worker_profiles 
ADD COLUMN worker_type TEXT DEFAULT 'regular' CHECK (worker_type IN ('regular', 'holidays', 'weekends'));

-- 2. Modificar service_cards para el nuevo modelo
ALTER TABLE service_cards 
DROP COLUMN IF EXISTS includes_holidays,
DROP COLUMN IF EXISTS includes_weekends,
DROP COLUMN IF EXISTS holiday_hours,
DROP COLUMN IF EXISTS weekend_hours;

-- 3. Añadir worker_type a service_cards
ALTER TABLE service_cards 
ADD COLUMN worker_type TEXT DEFAULT 'regular' CHECK (worker_type IN ('regular', 'holidays', 'weekends'));

-- 4. Añadir campos específicos para cada tipo
ALTER TABLE service_cards 
ADD COLUMN specific_dates JSONB, -- Para trabajadora de festivos: ["2025-01-01", "2025-01-06"]
ADD COLUMN weekend_config JSONB; -- Para trabajadora de fines de semana: {"saturday": true, "sunday": false}

-- 5. Modificar service_days para soportar fechas específicas
ALTER TABLE service_days 
ADD COLUMN specific_date DATE; -- Para días festivos específicos

-- 6. Actualizar la restricción unique para permitir múltiples tarjetas por usuario (diferentes tipos)
ALTER TABLE service_cards 
DROP CONSTRAINT IF EXISTS service_cards_user_id_month_year_key;

ALTER TABLE service_cards 
ADD CONSTRAINT service_cards_user_id_month_year_worker_type_key 
UNIQUE(user_id, month, year, worker_type);

-- 7. Comentarios para documentar
COMMENT ON COLUMN service_cards.worker_type IS 'Tipo de trabajadora: regular, holidays, weekends';
COMMENT ON COLUMN service_cards.specific_dates IS 'Fechas específicas para trabajadora de festivos: ["2025-01-01"]';
COMMENT ON COLUMN service_cards.weekend_config IS 'Configuración de fines de semana: {"saturday": true, "sunday": false}';
COMMENT ON COLUMN service_days.specific_date IS 'Fecha específica para festivos (ej: 2025-01-01)';
COMMENT ON COLUMN worker_profiles.worker_type IS 'Tipo de trabajadora: regular, holidays, weekends'; 