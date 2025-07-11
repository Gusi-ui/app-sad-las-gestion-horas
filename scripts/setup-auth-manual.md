# 🔧 Configuración Manual de Autenticación - SAD LAS V2

## Problema Actual
Los usuarios existen en la tabla `admins` pero no en `auth.users`, lo que impide el login.

## Solución Manual

### 1. Acceder al Dashboard de Supabase
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: `zvvbyasukzedsrpqpzrv`
3. Ve a la sección "Authentication" → "Users"

### 2. Crear Usuarios Manualmente

#### Usuario 1: Super Admin
- **Email**: `superadmin@sadlas.com`
- **Password**: `TempPass123!`
- **Full Name**: `María García López`

#### Usuario 2: Admin
- **Email**: `admin@sadlas.com`
- **Password**: `TempPass123!`
- **Full Name**: `Ana Martínez Rodríguez`

### 3. Pasos en el Dashboard
1. Haz clic en "Add User"
2. Completa los campos:
   - Email: [email del usuario]
   - Password: [contraseña]
   - User Metadata: `{"full_name": "[nombre completo]"}`
3. Marca "Auto-confirm user" para que no necesite confirmación de email
4. Haz clic en "Create User"

### 4. Verificar Configuración
1. Ve a "Authentication" → "Settings"
2. Asegúrate de que "Enable email confirmations" esté desactivado para desarrollo
3. Verifica que "Enable sign ups" esté activado

### 5. Probar Login
Una vez creados los usuarios, prueba hacer login en:
- `http://localhost:3000/admin/login`
- Con las credenciales:
  - `admin@sadlas.com` / `TempPass123!`
  - `superadmin@sadlas.com` / `TempPass123!`

## Alternativa: Usar el Dashboard Directo
Si no quieres configurar la autenticación ahora, puedes usar el dashboard directamente:
- `http://localhost:3000/admin/dashboard`
- `http://localhost:3000/dashboard`

## Restaurar Autenticación
Una vez que los usuarios estén creados, restaura la autenticación editando `src/middleware.ts`:
```typescript
// Comentar o eliminar estas líneas:
// !request.nextUrl.pathname.startsWith('/admin/') &&
// !request.nextUrl.pathname.startsWith('/dashboard/') &&
``` 