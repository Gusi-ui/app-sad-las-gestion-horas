-- Migración para agregar el campo assignment_type a la tabla assignments
-- Este campo permitirá distinguir entre asignaciones de laborables, festivos y flexibles

-- Agregar el campo assignment_type con valores por defecto
ALTER TABLE assignments 
ADD COLUMN assignment_type VARCHAR(20) DEFAULT 'flexible' 
CHECK (assignment_type IN ('laborables', 'festivos', 'flexible'));

-- Actualizar las asignaciones existentes basándose en el horario
-- Si tienen horario específico, marcarlas como 'laborables'
UPDATE assignments 
SET assignment_type = 'laborables' 
WHERE specific_schedule IS NOT NULL AND specific_schedule != '{}';

-- Comentario para documentar el campo
COMMENT ON COLUMN assignments.assignment_type IS 'Tipo de asignación: laborables (días laborables), festivos (días festivos), flexible (ambos)'; 