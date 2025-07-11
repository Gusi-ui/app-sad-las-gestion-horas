# Políticas RLS Seguras - SAD LAS

## 📋 Resumen

Este documento describe las políticas RLS (Row Level Security) seguras implementadas en el sistema SAD LAS para garantizar la seguridad y privacidad de los datos.

## 🎯 Objetivos de Seguridad

- **Principio de menor privilegio**: Cada usuario solo accede a los datos que necesita
- **Separación de roles**: Diferentes niveles de acceso según el rol del usuario
- **Auditoría**: Capacidad de rastrear quién accede a qué datos
- **Integridad**: Prevenir acceso no autorizado a datos sensibles

## 👥 Roles del Sistema

### 1. Super Admin
- **Acceso**: Total a todas las tablas y funciones
- **Responsabilidades**: 
  - Gestión de administradores
  - Configuración del sistema
  - Auditoría completa
- **Políticas**: `FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id = (SELECT id FROM system_roles WHERE name = 'super_admin')))`

### 2. Admin
- **Acceso**: Gestión de trabajadoras, usuarios y asignaciones
- **Responsabilidades**:
  - Crear/editar trabajadoras y usuarios
  - Gestionar asignaciones
  - Ver reportes y estadísticas
- **Políticas**: `FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id IN (SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin'))))`

### 3. Worker (Trabajadora)
- **Acceso**: Solo su perfil y asignaciones relacionadas
- **Responsabilidades**:
  - Ver su perfil y actualizarlo
  - Ver sus asignaciones y horarios
  - Registrar horas trabajadas
- **Políticas**: `FOR SELECT USING (auth_user_id = auth.uid())`

## 🗄️ Políticas por Tabla

### Tabla `admins`
```sql
-- Solo Super Admin puede gestionar administradores
CREATE POLICY "super_admin_all_access" ON admins 
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM admins 
    WHERE role_id = (SELECT id FROM system_roles WHERE name = 'super_admin')
  )
);
```

### Tabla `workers`
```sql
-- Super Admin y Admin pueden gestionar trabajadoras
CREATE POLICY "admin_workers_access" ON workers 
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM admins 
    WHERE role_id IN (
      SELECT id FROM system_roles 
      WHERE name IN ('super_admin', 'admin')
    )
  )
);

-- Trabajadoras pueden ver y actualizar su propio perfil
CREATE POLICY "worker_own_profile" ON workers 
FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "worker_update_own_profile" ON workers 
FOR UPDATE USING (auth_user_id = auth.uid());
```

### Tabla `users`
```sql
-- Super Admin y Admin pueden gestionar usuarios
CREATE POLICY "admin_users_access" ON users 
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM admins 
    WHERE role_id IN (
      SELECT id FROM system_roles 
      WHERE name IN ('super_admin', 'admin')
    )
  )
);
```

### Tabla `assignments`
```sql
-- Super Admin y Admin pueden gestionar asignaciones
CREATE POLICY "admin_assignments_access" ON assignments 
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM admins 
    WHERE role_id IN (
      SELECT id FROM system_roles 
      WHERE name IN ('super_admin', 'admin')
    )
  )
);

-- Trabajadoras pueden ver sus asignaciones
CREATE POLICY "worker_own_assignments" ON assignments 
FOR SELECT USING (
  worker_id IN (
    SELECT id FROM workers WHERE auth_user_id = auth.uid()
  )
);
```

### Tabla `monthly_plans`
```sql
-- Super Admin y Admin pueden gestionar planes mensuales
CREATE POLICY "admin_monthly_plans_access" ON monthly_plans 
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM admins 
    WHERE role_id IN (
      SELECT id FROM system_roles 
      WHERE name IN ('super_admin', 'admin')
    )
  )
);

-- Trabajadoras pueden ver sus planes mensuales
CREATE POLICY "worker_own_monthly_plans" ON monthly_plans 
FOR SELECT USING (
  worker_id IN (
    SELECT id FROM workers WHERE auth_user_id = auth.uid()
  )
);
```

### Tabla `service_days`
```sql
-- Super Admin y Admin pueden gestionar días de servicio
CREATE POLICY "admin_service_days_access" ON service_days 
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM admins 
    WHERE role_id IN (
      SELECT id FROM system_roles 
      WHERE name IN ('super_admin', 'admin')
    )
  )
);

-- Trabajadoras pueden ver y actualizar sus días de servicio
CREATE POLICY "worker_own_service_days" ON service_days 
FOR SELECT USING (
  monthly_plan_id IN (
    SELECT id FROM monthly_plans 
    WHERE worker_id IN (
      SELECT id FROM workers WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "worker_update_own_service_days" ON service_days 
FOR UPDATE USING (
  monthly_plan_id IN (
    SELECT id FROM monthly_plans 
    WHERE worker_id IN (
      SELECT id FROM workers WHERE auth_user_id = auth.uid()
    )
  )
);
```

### Tabla `holidays`
```sql
-- Super Admin y Admin pueden gestionar festivos
CREATE POLICY "admin_holidays_access" ON holidays 
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM admins 
    WHERE role_id IN (
      SELECT id FROM system_roles 
      WHERE name IN ('super_admin', 'admin')
    )
  )
);
```

### Tabla `system_alerts`
```sql
-- Super Admin y Admin pueden gestionar alertas del sistema
CREATE POLICY "admin_system_alerts_access" ON system_alerts 
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM admins 
    WHERE role_id IN (
      SELECT id FROM system_roles 
      WHERE name IN ('super_admin', 'admin')
    )
  )
);
```

## 🚀 Implementación

### Para Desarrollo
```bash
# Deshabilitar RLS temporalmente
node scripts/disable-rls-for-development.js
```

### Para Producción
```bash
# Habilitar políticas seguras
node scripts/enable-secure-rls.js
```

## 🔍 Verificación

### Script de Verificación
```bash
# Verificar que las políticas están funcionando
node scripts/check-database-structure.js
```

### Pruebas de Seguridad
1. **Super Admin**: Debe poder acceder a todas las tablas
2. **Admin**: Debe poder gestionar workers, users, assignments
3. **Worker**: Solo debe ver su perfil y asignaciones
4. **Usuario no autenticado**: No debe poder acceder a nada

## ⚠️ Consideraciones Importantes

### Seguridad
- Las políticas verifican roles en cada consulta
- No hay acceso anónimo a datos sensibles
- Las consultas están optimizadas para evitar N+1

### Rendimiento
- Las políticas usan índices para consultas eficientes
- Se evitan subconsultas complejas cuando es posible
- Se recomienda monitorear el rendimiento en producción

### Mantenimiento
- Revisar políticas regularmente
- Actualizar cuando se añadan nuevos roles
- Documentar cambios en políticas

## 🛡️ Mejores Prácticas

1. **Principio de menor privilegio**: Dar solo el acceso necesario
2. **Separación de responsabilidades**: Roles claramente definidos
3. **Auditoría regular**: Revisar accesos y políticas
4. **Testing**: Probar políticas en entorno de desarrollo
5. **Documentación**: Mantener documentación actualizada

## 🔧 Troubleshooting

### Problemas Comunes

1. **Error de recursión infinita**
   - Causa: Políticas que se referencian a sí mismas
   - Solución: Revisar y corregir las políticas problemáticas

2. **Acceso denegado inesperado**
   - Causa: Usuario sin rol asignado
   - Solución: Verificar que el usuario tenga el rol correcto

3. **Rendimiento lento**
   - Causa: Políticas con subconsultas complejas
   - Solución: Optimizar consultas y añadir índices

### Logs de Depuración
```sql
-- Verificar políticas activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Verificar roles de usuario
SELECT * FROM admins WHERE id = auth.uid();
```

## 📞 Soporte

Para problemas con las políticas RLS:
1. Revisar logs de la aplicación
2. Verificar configuración de roles
3. Consultar documentación de Supabase RLS
4. Contactar al administrador del sistema 