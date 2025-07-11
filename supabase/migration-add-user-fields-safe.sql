-- MIGRACIÓN: Ampliación de la tabla users para recoger todos los datos del formulario de usuario
-- Ejecutar de forma segura en Supabase (no falla si ya existen los campos)

ALTER TABLE users
-- Añadir campo DNI si no existe
ADD COLUMN IF NOT EXISTS dni TEXT,
-- Permitir nulos en email, postal_code, service_type, notes
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN postal_code DROP NOT NULL,
ALTER COLUMN service_type DROP NOT NULL,
ALTER COLUMN notes DROP NOT NULL,
-- Cambiar emergency_contacts a JSONB si no lo es
ALTER COLUMN emergency_contacts TYPE JSONB USING emergency_contacts::jsonb,
-- Añadir arrays de texto para requisitos, condiciones médicas, alergias, medicamentos
ADD COLUMN IF NOT EXISTS special_requirements TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS medical_conditions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS medications TEXT[] DEFAULT '{}';

-- Opcional: Asegurar que status siempre tiene valor por defecto
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';

-- Opcional: Añadir índice único a dni si lo necesitas
-- CREATE UNIQUE INDEX IF NOT EXISTS users_dni_unique ON users(dni) WHERE dni IS NOT NULL; 