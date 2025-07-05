#!/bin/bash

# Script para desplegar en Vercel con variables de entorno configuradas
echo "🚀 Iniciando despliegue en Vercel..."

# Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado. Instálalo con: npm i -g vercel"
    exit 1
fi

# Verificar si el proyecto está vinculado
if ! vercel project ls &> /dev/null; then
    echo "🔗 Vinculando proyecto a Vercel..."
    vercel link
fi

# Verificar variables de entorno
echo "🔍 Verificando variables de entorno..."
ENV_VARS=$(vercel env ls 2>/dev/null | grep -E "(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY)")

if [ -z "$ENV_VARS" ]; then
    echo "⚠️ Variables de entorno de Supabase no configuradas"
    echo "📝 Configurando variables de entorno..."
    
    echo "🔗 Configurando NEXT_PUBLIC_SUPABASE_URL..."
    vercel env add NEXT_PUBLIC_SUPABASE_URL production
    
    echo "🔑 Configurando NEXT_PUBLIC_SUPABASE_ANON_KEY..."
    vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
    
    echo "✅ Variables de entorno configuradas"
else
    echo "✅ Variables de entorno ya configuradas"
fi

# Hacer commit y push de los cambios
echo "📝 Haciendo commit de los cambios..."
git add .
git commit -m "Fix Vercel deployment: Add robust Supabase configuration and disable static prerender" || true

echo "📤 Haciendo push de los cambios..."
git push origin main

# Desplegar en Vercel
echo "🚀 Desplegando en Vercel..."
vercel --prod

echo "✅ Despliegue completado!"
echo ""
echo "📋 Para verificar el estado:"
echo "1. Ve a https://vercel.com/dashboard"
echo "2. Selecciona tu proyecto"
echo "3. Revisa los logs del despliegue" 