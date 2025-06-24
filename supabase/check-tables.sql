-- Script para verificar qué tablas existen en la base de datos
-- Ejecuta esto primero para ver el estado actual

-- Listar todas las tablas del esquema public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar si existe worker_profiles específicamente
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'worker_profiles'
) as worker_profiles_exists;

-- Verificar si existe users específicamente  
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) as users_exists;

-- Verificar si existe service_cards específicamente
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_cards'
) as service_cards_exists; 