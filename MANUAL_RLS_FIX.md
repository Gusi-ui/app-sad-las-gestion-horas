# 🔧 Solución Manual para RLS - SAD LAS

## 🚨 Problema Actual
El sistema tiene políticas RLS que causan recursión infinita, impidiendo el acceso a las tablas.

## 🎯 Solución Paso a Paso

### Paso 1: Acceder al Dashboard de Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **SAD LAS V2**

### Paso 2: Ir a Table Editor
1. En el menú lateral izquierdo, haz clic en **Table Editor**
2. Verás todas las tablas del proyecto

### Paso 3: Deshabilitar RLS Temporalmente
Para cada tabla, sigue estos pasos:

#### Para la tabla `admins`:
1. Haz clic en la tabla `admins`
2. Ve a la pestaña **RLS** (Row Level Security)
3. **Desactiva** el toggle "Enable RLS"
4. Haz clic en **Save**

#### Para la tabla `workers`:
1. Haz clic en la tabla `workers`
2. Ve a la pestaña **RLS**
3. **Desactiva** el toggle "Enable RLS"
4. Haz clic en **Save**

#### Para la tabla `users`:
1. Haz clic en la tabla `users`
2. Ve a la pestaña **RLS**
3. **Desactiva** el toggle "Enable RLS"
4. Haz clic en **Save**

#### Para la tabla `assignments`:
1. Haz clic en la tabla `assignments`
2. Ve a la pestaña **RLS**
3. **Desactiva** el toggle "Enable RLS"
4. Haz clic en **Save**

#### Para las demás tablas:
Repite el mismo proceso para:
- `monthly_plans`
- `service_days`
- `holidays`
- `system_alerts`

### Paso 4: Verificar la Solución
1. Ve a la pestaña **SQL Editor**
2. Ejecuta esta consulta para verificar:
   ```sql
   SELECT * FROM workers LIMIT 1;
   ```
3. Si no hay error, la solución funcionó

### Paso 5: Probar en la Aplicación
1. Ve a tu aplicación local
2. Navega a `/admin/assignments/new`
3. Verifica que:
   - No aparece el mensaje de error de RLS
   - Puedes ver las listas de trabajadoras y usuarios
   - El formulario funciona correctamente

## 🔒 Para Producción (Más Adelante)

Cuando estés listo para producción, puedes:

### Opción 1: Políticas Simples
1. Ve a **Authentication → Policies**
2. Para cada tabla, crea una política:
   - **Name**: `Allow authenticated users`
   - **Target roles**: `authenticated`
   - **Policy definition**: `FOR ALL USING (auth.role() = 'authenticated')`

### Opción 2: Políticas Seguras
Usa el script que creamos:
```bash
node scripts/enable-secure-rls.js
```

## 📋 Checklist de Verificación

- [ ] RLS deshabilitado en tabla `admins`
- [ ] RLS deshabilitado en tabla `workers`
- [ ] RLS deshabilitado en tabla `users`
- [ ] RLS deshabilitado en tabla `assignments`
- [ ] RLS deshabilitado en tabla `monthly_plans`
- [ ] RLS deshabilitado en tabla `service_days`
- [ ] RLS deshabilitado en tabla `holidays`
- [ ] RLS deshabilitado en tabla `system_alerts`
- [ ] Consulta SQL funciona sin errores
- [ ] Aplicación funciona correctamente

## ⚠️ Notas Importantes

- **Desarrollo**: RLS deshabilitado permite acceso total para facilitar el desarrollo
- **Producción**: Debes habilitar RLS con políticas apropiadas antes de desplegar
- **Seguridad**: Las políticas de producción deben seguir el principio de menor privilegio

## 🆘 Si Tienes Problemas

1. **Error persistente**: Verifica que RLS esté deshabilitado en TODAS las tablas
2. **No puedes acceder**: Asegúrate de estar usando las credenciales correctas
3. **Consulta SQL falla**: Verifica que la tabla existe y tiene datos

## 📞 Soporte

Si necesitas ayuda adicional:
1. Revisa los logs de la aplicación
2. Verifica la configuración de Supabase
3. Consulta la documentación de Supabase RLS 