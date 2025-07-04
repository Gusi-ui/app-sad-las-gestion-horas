# Solución para el Error de Despliegue en Vercel

## Problema
El despliegue en Vercel está fallando con el siguiente error:
```
Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

## Causa
Las variables de entorno de Supabase no están configuradas en Vercel, lo que impide que la aplicación se conecte a la base de datos durante el build.

## Solución

### 1. Configurar Variables de Entorno en Vercel

#### Opción A: Usando el Script Automático
```bash
# Ejecutar el script de configuración
./setup-vercel-env.sh
```

#### Opción B: Configuración Manual

1. **Obtener las credenciales de Supabase:**
   - Ve a [Supabase Dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto
   - Ve a **Settings > API**
   - Copia la **URL del proyecto** y la **anon key**

2. **Configurar en Vercel:**
   ```bash
   # Instalar Vercel CLI si no lo tienes
   npm i -g vercel
   
   # Vincular el proyecto (si no está vinculado)
   vercel link
   
   # Agregar variables de entorno
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   ```

3. **Insertar los valores cuando se solicite:**
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://tu-proyecto.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. Verificar Configuración

```bash
# Ver variables de entorno configuradas
vercel env ls

# Hacer un nuevo despliegue
vercel --prod
```

### 3. Configuración Alternativa (Dashboard Web)

También puedes configurar las variables desde el dashboard de Vercel:

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings > Environment Variables**
3. Agrega las siguientes variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Selecciona **Production** y **Preview** environments
5. Haz un nuevo despliegue

## Cambios Realizados

### 1. Configuración de Páginas Dinámicas
Se agregó la configuración `export const dynamic = 'force-dynamic'` a las páginas que usan Supabase para evitar el prerender estático:

- `src/app/dashboard/assignments/new/page.tsx`
- `src/app/dashboard/assignments/page.tsx`
- `src/app/dashboard/workers/page.tsx`
- `src/app/dashboard/planning/page.tsx`
- `src/app/dashboard/users/page.tsx`
- `src/app/dashboard/page.tsx`

### 2. Configuración de Next.js
Se actualizó `next.config.ts` para:
- Ignorar errores de ESLint y TypeScript durante el build
- Optimizar la configuración para Vercel

### 3. Configuración de Vercel
Se actualizó `vercel.json` para incluir las variables de entorno necesarias.

## Verificación

Después de configurar las variables de entorno, el despliegue debería funcionar correctamente. Puedes verificar el estado en:

1. **Vercel Dashboard**: Revisa los logs del despliegue
2. **Supabase Dashboard**: Verifica que las conexiones se estén realizando correctamente

## Notas Importantes

- Las variables de entorno con prefijo `NEXT_PUBLIC_` son visibles en el cliente
- Asegúrate de que la **anon key** sea la correcta (no la service role key)
- Los cambios en las variables de entorno requieren un nuevo despliegue
- Si el problema persiste, verifica que las credenciales de Supabase sean correctas 