# Flujo de Trabajo Git - SAD LAS

## Estructura de Ramas

### `main` (Producción)
- **Propósito**: Código estable en producción
- **Protección**: No se debe hacer commit directo
- **Origen**: Merge desde `develop` cuando esté estable

### `develop` (Desarrollo)
- **Propósito**: Rama principal de desarrollo
- **Origen**: Merge desde `feature/*` cuando las features estén completas
- **Destino**: Merge a `main` cuando esté listo para producción

### `feature/*` (Features)
- **Propósito**: Desarrollo de nuevas funcionalidades
- **Origen**: Crear desde `develop`
- **Destino**: Merge a `develop` cuando esté completa

## Flujo de Trabajo

### 1. Desarrollo de Nuevas Features

```bash
# Asegurarse de estar en develop y actualizado
git checkout develop
git pull origin develop

# Crear nueva rama de feature
git checkout -b feature/nombre-de-la-feature

# Desarrollar y hacer commits
git add .
git commit -m "feat: descripción de la feature"

# Subir la rama
git push origin feature/nombre-de-la-feature
```

### 2. Integración de Features

```bash
# Volver a develop
git checkout develop
git pull origin develop

# Merge de la feature
git merge feature/nombre-de-la-feature

# Subir develop
git push origin develop

# Eliminar rama de feature (opcional)
git branch -d feature/nombre-de-la-feature
git push origin --delete feature/nombre-de-la-feature
```

### 3. Release a Producción

```bash
# Asegurarse de que develop esté estable
git checkout develop
git pull origin develop

# Merge a main
git checkout main
git pull origin main
git merge develop

# Subir a producción
git push origin main

# Crear tag de release (opcional)
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Convenciones de Commits

### Formato
```
tipo: descripción breve

- tipo: feat, fix, docs, style, refactor, test, chore
- descripción: imperativo, primera letra minúscula, sin punto final
```

### Ejemplos
```
feat: agregar sistema de balances mensuales
fix: corregir cálculo de horas en festivos
docs: actualizar README con nuevas instrucciones
refactor: optimizar lógica de reasignaciones
test: agregar tests para cálculo de festivos
```

## Configuración del Nuevo Proyecto Supabase

### 1. Crear Nuevo Proyecto
- Ir a [supabase.com](https://supabase.com)
- Crear nuevo proyecto
- Configurar región (preferiblemente cercana a Mataró)

### 2. Configurar Variables de Entorno
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=tu_nueva_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_nueva_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_nueva_service_role_key
```

### 3. Migrar Base de Datos
```bash
# Ejecutar migraciones en orden
supabase/migration-local-holidays.sql
supabase/migration-add-worker-type.sql
supabase/migration-add-monthly-balances.sql
supabase/migration-add-holiday-info-to-monthly-balances.sql
supabase/migration-add-2024-2026-holidays.sql
```

### 4. Configurar Políticas RLS
- Revisar y ajustar políticas de seguridad
- Configurar autenticación
- Probar creación de usuarios y workers

## Checklist de Release

### Antes de Merge a Main
- [ ] Todas las features están completas y probadas
- [ ] No hay errores de linting
- [ ] Tests pasan (si existen)
- [ ] Documentación actualizada
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada

### Después del Release
- [ ] Verificar que la aplicación funciona en producción
- [ ] Monitorear logs por errores
- [ ] Notificar a usuarios sobre cambios importantes
- [ ] Crear tag de release en GitHub

## Comandos Útiles

### Ver estado de ramas
```bash
git branch -a
git status
git log --oneline --graph --all
```

### Limpiar ramas locales
```bash
git branch --merged | grep -v "\*" | xargs -n 1 git branch -d
```

### Ver diferencias entre ramas
```bash
git diff main..develop
git diff develop..feature/nombre
```

### Revertir cambios
```bash
git revert <commit-hash>
git reset --hard <commit-hash>  # ¡CUIDADO! Destructivo
```

## Notas Importantes

1. **Nunca hacer commit directo a `main`**
2. **Siempre hacer pull antes de merge**
3. **Usar mensajes de commit descriptivos**
4. **Probar en develop antes de merge a main**
5. **Mantener develop actualizada con main**
6. **Documentar cambios importantes** 