-- Migración para agregar monthly_hours a la tabla users
-- Este script debe ejecutarse manualmente en la consola de Supabase

-- Verificar si la columna existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'monthly_hours';

-- Si la columna no existe, ejecutar este comando:
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_hours DECIMAL DEFAULT 0;

-- Actualizar usuarios existentes con un valor de ejemplo (86 horas)
UPDATE users SET monthly_hours = 86 WHERE monthly_hours IS NULL OR monthly_hours = 0;

-- Verificar que se agregó correctamente
SELECT id, name, surname, monthly_hours 
FROM users 
LIMIT 5; 