-- =====================================================
-- MIGRACIÓN: Actualizar tipos de trabajadora en la base de datos (VERSIÓN ROBUSTA)
-- Fecha: Julio 2025
-- Objetivo: Cambiar los valores de worker_type para que coincidan con el formulario
-- =====================================================

-- 1. Verificar la estructura actual
SELECT 'Estructura actual de la tabla workers:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'workers' AND column_name = 'worker_type';

-- 2. Verificar valores actuales
SELECT 'Valores actuales de worker_type:' as info;
SELECT DISTINCT worker_type, COUNT(*) as cantidad
FROM workers 
GROUP BY worker_type;

-- 3. ELIMINAR TODAS LAS RESTRICCIONES EXISTENTES
-- Primero, eliminar la restricción actual si existe
ALTER TABLE workers DROP CONSTRAINT IF EXISTS workers_worker_type_check;

-- 4. ACTUALIZAR TODOS LOS VALORES EXISTENTES
-- Mapeo completo de todos los valores posibles
UPDATE workers SET worker_type = 'laborables' WHERE worker_type IN ('regular', 'laborable', 'laborables');
UPDATE workers SET worker_type = 'festivos' WHERE worker_type IN ('holidays', 'weekends', 'festivos', 'holiday_weekend');
UPDATE workers SET worker_type = 'flexible' WHERE worker_type IN ('flexible', 'both', 'temporary');

-- 5. ESTABLECER VALOR POR DEFECTO PARA REGISTROS SIN TIPO
UPDATE workers SET worker_type = 'laborables' WHERE worker_type IS NULL OR worker_type = '';

-- 6. VERIFICAR QUE NO QUEDEN VALORES INVÁLIDOS
SELECT 'Verificando valores después de la actualización:' as info;
SELECT DISTINCT worker_type, COUNT(*) as cantidad
FROM workers 
GROUP BY worker_type;

-- 7. AÑADIR LA NUEVA RESTRICCIÓN
ALTER TABLE workers ADD CONSTRAINT workers_worker_type_check 
CHECK (worker_type IN ('laborables', 'festivos', 'flexible'));

-- 8. ACTUALIZAR EL VALOR POR DEFECTO
ALTER TABLE workers ALTER COLUMN worker_type SET DEFAULT 'laborables';

-- 9. AÑADIR COMENTARIO EXPLICATIVO
COMMENT ON COLUMN workers.worker_type IS 'Tipo de trabajadora: laborables (lunes a viernes), festivos (fines de semana y festivos), flexible (todos los días)';

-- 10. VERIFICAR LA ESTRUCTURA FINAL
SELECT 'Estructura final de la tabla workers:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'workers' AND column_name = 'worker_type';

-- 11. VERIFICAR VALORES FINALES
SELECT 'Valores finales de worker_type:' as info;
SELECT DISTINCT worker_type, COUNT(*) as cantidad
FROM workers 
GROUP BY worker_type;

-- 12. PROBAR INSERCIÓN CON NUEVOS VALORES
SELECT 'Probando inserción con nuevos valores...' as info;

-- Insertar worker de prueba
INSERT INTO workers (
    employee_code, 
    name, 
    surname, 
    email, 
    phone, 
    worker_type, 
    hourly_rate, 
    hire_date, 
    availability_days
) VALUES (
    'TEST001',
    'Test',
    'Worker',
    'test@example.com',
    '600000000',
    'laborables',
    12.50,
    CURRENT_DATE,
    ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
);

-- Verificar que se insertó correctamente
SELECT 'Worker de prueba insertado:' as info;
SELECT id, name, surname, worker_type, availability_days 
FROM workers 
WHERE employee_code = 'TEST001';

-- Limpiar worker de prueba
DELETE FROM workers WHERE employee_code = 'TEST001';

SELECT '✅ Migración completada exitosamente!' as resultado;
SELECT 'Los valores de worker_type ahora son: laborables, festivos, flexible' as info; 