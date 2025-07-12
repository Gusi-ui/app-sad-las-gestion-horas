-- Migración corregida para agregar el campo assignment_type a la tabla assignments
-- Basada en la estructura real de la tabla

-- Paso 1: Agregar el campo assignment_type
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) DEFAULT 'flexible' 
CHECK (assignment_type IN ('laborables', 'festivos', 'flexible'));

-- Paso 2: Actualizar las asignaciones existentes basándose en el horario específico
-- Si tienen specific_schedule con datos, marcarlas como 'laborables'
UPDATE assignments 
SET assignment_type = 'laborables' 
WHERE specific_schedule IS NOT NULL 
  AND specific_schedule != '{}' 
  AND specific_schedule != 'null'
  AND jsonb_typeof(specific_schedule) = 'object';

-- Paso 3: Verificar la migración
SELECT 
  id, 
  assignment_type, 
  CASE 
    WHEN specific_schedule IS NULL THEN 'NULL'
    WHEN specific_schedule = '{}' THEN '{}'
    WHEN jsonb_typeof(specific_schedule) = 'object' THEN 'Has Schedule'
    ELSE 'Other'
  END as schedule_status
FROM assignments 
LIMIT 10;

-- Comentario para documentar el campo
COMMENT ON COLUMN assignments.assignment_type IS 'Tipo de asignación: laborables (días laborables), festivos (días festivos), flexible (ambos)'; 