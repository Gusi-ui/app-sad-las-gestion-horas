-- Script para copiar datos de worker_profiles a workers
-- Este script copia los datos existentes de worker_profiles a la tabla workers
-- para sincronizar los datos entre ambas tablas

-- Primero, vamos a ver qué datos tenemos en worker_profiles
SELECT 'Datos actuales en worker_profiles:' as info;
SELECT id, email, full_name, created_at, updated_at FROM worker_profiles;

-- Insertar datos de worker_profiles a workers
-- Mapeamos los campos disponibles:
-- - id (UUID) -> se genera nuevo UUID para workers
-- - email -> email
-- - full_name -> se divide en name y surname
-- - created_at -> created_at
-- - updated_at -> updated_at

INSERT INTO workers (
    name,
    surname,
    email,
    hire_date,
    is_active,
    created_at,
    updated_at
)
SELECT 
    -- Dividir full_name en name y surname
    CASE 
        WHEN position(' ' in full_name) > 0 
        THEN substring(full_name from 1 for position(' ' in full_name) - 1)
        ELSE full_name
    END as name,
    CASE 
        WHEN position(' ' in full_name) > 0 
        THEN substring(full_name from position(' ' in full_name) + 1)
        ELSE ''
    END as surname,
    email,
    created_at::date as hire_date,
    true as is_active,
    created_at,
    updated_at
FROM worker_profiles
WHERE NOT EXISTS (
    -- Evitar duplicados verificando si ya existe un worker con ese email
    SELECT 1 FROM workers WHERE workers.email = worker_profiles.email
);

-- Mostrar los datos insertados
SELECT 'Datos insertados en workers:' as info;
SELECT id, name, surname, email, hire_date, is_active, created_at FROM workers;

-- Mostrar el conteo final
SELECT 
    'Resumen:' as info,
    (SELECT COUNT(*) FROM worker_profiles) as total_worker_profiles,
    (SELECT COUNT(*) FROM workers) as total_workers; 