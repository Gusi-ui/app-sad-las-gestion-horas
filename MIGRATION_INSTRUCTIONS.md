# 🔧 Instrucciones para Ejecutar la Migración de holiday_info

## ❌ Error Actual
```
Error: Could not find the 'holiday_info' column of 'monthly_balances' in the schema cache
```

## 🎯 Solución: Añadir la columna holiday_info

### Paso 1: Acceder a Supabase Dashboard
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral

### Paso 2: Ejecutar la Migración
Copia y pega este SQL en el editor:

```sql
-- Migración para añadir información de festivos a monthly_balances
-- Fecha: 2025-01-27

-- 1. Añadir columna para información de festivos
ALTER TABLE monthly_balances 
ADD COLUMN IF NOT EXISTS holiday_info JSONB DEFAULT NULL;

-- 2. Añadir comentarios para documentar la columna
COMMENT ON COLUMN monthly_balances.holiday_info IS 'Información detallada sobre festivos: {totalHolidays, holidayHours, workingDays, workingHours}';

-- 3. Crear índice para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_monthly_balances_holiday_info 
ON monthly_balances USING GIN (holiday_info);

-- 4. Verificar que la migración se aplicó correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'monthly_balances' 
  AND column_name = 'holiday_info';
```

### Paso 3: Verificar la Migración
Después de ejecutar el SQL, deberías ver:
- ✅ Columna `holiday_info` añadida
- ✅ Tipo de datos: `jsonb`
- ✅ Nullable: `YES`
- ✅ Default: `NULL`

### Paso 4: Probar la Funcionalidad
1. Ve a la aplicación: `http://localhost:3003/dashboard/test-balance`
2. Selecciona un usuario y trabajadora
3. Genera un balance
4. Verifica que no hay errores

## 🎉 Resultado Esperado
- ✅ Los balances se generan correctamente
- ✅ La información de festivos se guarda en la base de datos
- ✅ El dashboard de trabajadora muestra información de festivos
- ✅ Los balances incluyen desglose de horas por tipo de día

## 🔍 Verificación
Para verificar que todo funciona:

```sql
-- Verificar que la columna existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'monthly_balances' 
  AND column_name = 'holiday_info';

-- Verificar que se pueden insertar datos con holiday_info
SELECT id, user_id, worker_id, month, year, holiday_info
FROM monthly_balances 
WHERE holiday_info IS NOT NULL
LIMIT 5;
```

## 🚨 Si hay Problemas
1. **Error de permisos**: Asegúrate de estar usando una cuenta con permisos de administrador
2. **Error de sintaxis**: Verifica que el SQL se copió correctamente
3. **Error de conexión**: Verifica que estás conectado al proyecto correcto

## 📞 Soporte
Si necesitas ayuda adicional:
1. Revisa los logs de la aplicación
2. Verifica la consola del navegador
3. Comprueba que las variables de entorno están configuradas correctamente 