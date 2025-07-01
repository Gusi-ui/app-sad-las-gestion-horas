-- Agregar campos address y monthly_hours a la tabla users
ALTER TABLE users 
ADD COLUMN address TEXT,
ADD COLUMN monthly_hours DECIMAL(5,2) DEFAULT 0 CHECK (monthly_hours >= 0);

-- Actualizar registros existentes para establecer un valor por defecto
UPDATE users SET monthly_hours = 0 WHERE monthly_hours IS NULL; 