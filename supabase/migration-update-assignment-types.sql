-- Migration: Update Assignment Types
-- Update the assignment_type constraint to allow new types

-- First, drop the existing constraint
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_assignment_type_check;

-- Add the new constraint with updated types
ALTER TABLE assignments ADD CONSTRAINT assignments_assignment_type_check 
CHECK (assignment_type IN ('laborables', 'festivos', 'flexible'));

-- Update existing data to use new types (no effect if table is vacía)
UPDATE assignments SET assignment_type = 'festivos' WHERE assignment_type = 'holidays';
UPDATE assignments SET assignment_type = 'laborables' WHERE assignment_type = 'regular';
UPDATE assignments SET assignment_type = 'festivos' WHERE assignment_type = 'weekends';
UPDATE assignments SET assignment_type = 'flexible' WHERE assignment_type = 'temporary';

-- Add comment to document the change
COMMENT ON COLUMN assignments.assignment_type IS 'Tipo de asignación: laborables (días laborables), festivos (fines de semana y festivos), flexible (todos los días)'; 