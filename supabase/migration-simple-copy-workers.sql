-- Script simplificado para copiar datos de worker_profiles a workers
-- Versión más simple que no divide el nombre completo

-- Insertar datos básicos de worker_profiles a workers
INSERT INTO workers (
    name,
    surname,
    phone,  -- Campo obligatorio
    email,
    hire_date,
    is_active,
    created_at,
    updated_at
)
SELECT 
    full_name as name,  -- Usar el nombre completo como name
    '' as surname,      -- Dejar surname vacío
    'Pendiente' as phone,  -- Valor por defecto para el teléfono obligatorio
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

-- Mostrar resultado
SELECT 'Datos copiados de worker_profiles a workers' as resultado; 