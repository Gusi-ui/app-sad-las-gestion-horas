-- Migración para añadir información de festivos a monthly_balances
-- Fecha: 2025-01-27

-- Añadir columnas para información de festivos
ALTER TABLE monthly_balances 
ADD COLUMN IF NOT EXISTS holiday_info JSONB DEFAULT NULL;

-- Añadir comentarios para documentar las nuevas columnas
COMMENT ON COLUMN monthly_balances.holiday_info IS 'Información detallada sobre festivos: {totalHolidays, holidayHours, workingDays, workingHours}';

-- Crear índice para consultas eficientes por festivos
CREATE INDEX IF NOT EXISTS idx_monthly_balances_holiday_info 
ON monthly_balances USING GIN (holiday_info);

-- Verificar que la migración se aplicó correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'monthly_balances' 
  AND column_name = 'holiday_info'; 