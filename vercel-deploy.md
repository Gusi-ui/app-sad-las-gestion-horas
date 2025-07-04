# Guía de Despliegue en Vercel

## Configuración Previa

### 1. Variables de Entorno Requeridas

Configura las siguientes variables de entorno en tu proyecto de Vercel:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
```

### 2. Pasos para el Despliegue

1. **Conectar el repositorio a Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu repositorio de GitHub
   - Selecciona el repositorio `app-sad-las`

2. **Configurar el proyecto:**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Configurar variables de entorno:**
   - Ve a Settings > Environment Variables
   - Añade las variables mencionadas arriba

4. **Desplegar:**
   - Haz commit y push de tus cambios
   - Vercel desplegará automáticamente

## Archivos de Configuración Creados

### vercel.json
- Configuración optimizada para Next.js
- Headers de seguridad
- Configuración de funciones serverless

### .vercelignore
- Excluye archivos innecesarios del despliegue
- Optimiza el tamaño del bundle

### next.config.ts
- Configuración optimizada para Vercel
- Soporte para Supabase
- Configuración de imágenes

## Solución de Problemas Comunes

### Error: "Module not found"
- Verifica que todas las dependencias estén `package.json`
- Ejecuta `npm install` localmente para verificar

### Error: "Environment variables not found"
- Verifica que las variables de entorno estén configuradas en Vercel
- Asegúrate de que los nombres coincidan exactamente

### Error: "Build failed"
- Revisa los logs de build en Vercel
- Ejecuta `npm run build` localmente para verificar

## Verificación Post-Despliegue

1. Verifica que la aplicación se carga correctamente
2. Prueba la autenticación con Supabase
3. Verifica que las rutas de API funcionan
4. Comprueba que el middleware funciona correctamente

## Optimizaciones Aplicadas

- ✅ Configuración de Tailwind CSS optimizada
- ✅ Headers de seguridad configurados
- ✅ Configuración de imágenes optimizada
- ✅ Middleware configurado correctamente
- ✅ Variables de entorno documentadas
- ✅ Archivos de configuración de Vercel creados 