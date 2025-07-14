-- Añadir índice único para permitir upsert en la tabla holidays
-- Esto permitirá que el script de sincronización funcione correctamente

-- Crear índice único sobre date, name y city para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS holidays_date_name_city_unique 
ON holidays (date, name, city);

-- También crear un índice único solo sobre date para casos donde el nombre pueda variar
CREATE UNIQUE INDEX IF NOT EXISTS holidays_date_unique 
ON holidays (date);

-- Comentario: El primer índice es más específico y permite el mismo festivo en diferentes ciudades
-- El segundo índice es más restrictivo y evita múltiples festivos en la misma fecha
-- Se pueden usar ambos según la lógica de negocio 