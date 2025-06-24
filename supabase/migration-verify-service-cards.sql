-- Verificar y agregar columnas necesarias a la tabla service_cards
-- Este script debe ejecutarse manualmente en la consola de Supabase

-- Verificar columnas existentes en service_cards
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_cards' 
ORDER BY column_name;

-- Agregar used_hours si no existe
ALTER TABLE service_cards ADD COLUMN IF NOT EXISTS used_hours DECIMAL DEFAULT 0;

-- Agregar weekly_schedule si no existe (para almacenar horario semanal como JSON)
ALTER TABLE service_cards ADD COLUMN IF NOT EXISTS weekly_schedule JSONB DEFAULT '{}';

-- Actualizar service_cards existentes para tener valores por defecto
UPDATE service_cards SET used_hours = 0 WHERE used_hours IS NULL;
UPDATE service_cards SET weekly_schedule = '{}' WHERE weekly_schedule IS NULL;

-- Verificar que las columnas se agregaron correctamente
SELECT id, worker_type, used_hours, weekly_schedule, created_at 
FROM service_cards 
LIMIT 5; 