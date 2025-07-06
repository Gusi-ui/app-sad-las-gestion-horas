-- Migración para agregar worker_type a la tabla workers
-- Esta columna distinguirá entre trabajadoras de días laborables y trabajadoras de festivos/fines de semana

-- Agregar la columna worker_type
ALTER TABLE workers 
ADD COLUMN worker_type VARCHAR(20) DEFAULT 'laborable' 
CHECK (worker_type IN ('laborable', 'holiday_weekend', 'both'));

-- Agregar comentario explicativo
COMMENT ON COLUMN workers.worker_type IS 'Tipo de trabajadora: laborable (solo días laborables), holiday_weekend (solo festivos y fines de semana), both (ambos)';

-- Actualizar trabajadoras existentes basándose en su disponibilidad
-- Por defecto, todas las trabajadoras existentes serán 'laborable'
-- Los administradores deberán actualizar manualmente las que trabajen festivos/fines de semana

-- Crear índice para mejorar rendimiento en consultas por tipo
CREATE INDEX idx_workers_worker_type ON workers(worker_type);

-- Verificar que la migración se aplicó correctamente
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'workers' 
AND column_name = 'worker_type'; 