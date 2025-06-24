-- Migración: Añadir campos de horas específicas para festivos y fines de semana
-- Fecha: Enero 2025

-- Añadir holiday_hours para trabajadoras de festivos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_cards' AND column_name = 'holiday_hours'
    ) THEN
        ALTER TABLE service_cards 
        ADD COLUMN holiday_hours DECIMAL DEFAULT 3.5;
    END IF;
END $$;

-- Añadir weekend_hours para trabajadoras de fines de semana
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_cards' AND column_name = 'weekend_hours'
    ) THEN
        ALTER TABLE service_cards 
        ADD COLUMN weekend_hours JSONB DEFAULT '{"saturday": 3.5, "sunday": 3.5}';
    END IF;
END $$;

-- Comentarios para documentar
COMMENT ON COLUMN service_cards.holiday_hours IS 'Horas específicas por día festivo (por defecto 3.5)';
COMMENT ON COLUMN service_cards.weekend_hours IS 'Horas específicas por día de fin de semana: {"saturday": 3.5, "sunday": 3.5}'; 