# Error de Políticas RLS - Instrucciones de Solución

## Problema
El sistema está experimentando un error de "infinite recursion detected in policy for relation 'admins'" que impide el acceso a las tablas de la base de datos.

## Causa
Las políticas RLS (Row Level Security) están configuradas de manera que crean una recursión infinita al verificar permisos en la tabla `admins` desde otras políticas.

## Solución

### Opción 1: Arreglar desde el Dashboard de Supabase (Recomendado)

1. **Accede al Dashboard de Supabase**
   - Ve a [supabase.com](https://supabase.com)
   - Inicia sesión y selecciona tu proyecto

2. **Navega a las Políticas**
   - Ve a **Authentication** en el menú lateral
   - Haz clic en **Policies**

3. **Elimina las Políticas Problemáticas**
   - Busca las políticas que contengan referencias a la tabla `admins`
   - Elimina las siguientes políticas si existen:
     - "Super admin access all" en tabla `admins`
     - "Super admin access all workers" en tabla `workers`
     - "Super admin access all users" en tabla `users`
     - "Admin access all workers" en tabla `workers`
     - "Admin access all users" en tabla `users`
     - "Admin access all assignments" en tabla `assignments`

4. **Crea Políticas Simples**
   - Para cada tabla, crea una política simple:
     - **Name**: "Allow all for development"
     - **Target roles**: `authenticated`
     - **Policy definition**: `FOR ALL USING (true)`

### Opción 2: Deshabilitar RLS Temporalmente

Si necesitas acceso inmediato para desarrollo:

1. Ve a **Table Editor** en el dashboard
2. Selecciona cada tabla: `admins`, `workers`, `users`, `assignments`
3. En la pestaña **RLS**, desactiva "Enable RLS"
4. Guarda los cambios

### Opción 3: Usar el Script SQL

Ejecuta el siguiente SQL en el SQL Editor de Supabase:

```sql
-- Deshabilitar RLS temporalmente
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Super admin access all" ON admins;
DROP POLICY IF EXISTS "Super admin access all workers" ON workers;
DROP POLICY IF EXISTS "Super admin access all users" ON users;
DROP POLICY IF EXISTS "Admin access all workers" ON workers;
DROP POLICY IF EXISTS "Admin access all users" ON users;
DROP POLICY IF EXISTS "Admin access all assignments" ON assignments;

-- Habilitar RLS nuevamente
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Crear políticas simples
CREATE POLICY "Allow all for authenticated users" ON admins FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON workers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON assignments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON monthly_plans FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON service_days FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON holidays FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON system_alerts FOR ALL USING (auth.role() = 'authenticated');
```

## Verificación

Después de aplicar la solución:

1. **Ejecuta el script de verificación**:
   ```bash
   node scripts/check-database-structure.js
   ```

2. **Verifica en la aplicación**:
   - Ve a la página de nueva asignación
   - Deberías poder ver las listas de trabajadoras y usuarios
   - No debería aparecer el error de recursión infinita

## Notas Importantes

- **Seguridad**: Las políticas actuales permiten acceso completo a usuarios autenticados. Para producción, deberás implementar políticas más restrictivas.
- **Desarrollo**: Durante el desarrollo, es aceptable tener políticas permisivas para facilitar las pruebas.
- **Backup**: Antes de hacer cambios, considera hacer un backup de las políticas existentes.

## Contacto

Si necesitas ayuda adicional, contacta al administrador del sistema o consulta la documentación de Supabase sobre RLS. 