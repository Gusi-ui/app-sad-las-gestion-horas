#!/bin/bash

# Script para configurar variables de entorno en Vercel
echo "🔧 Configurando variables de entorno en Vercel..."

# Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado. Instálalo con: npm i -g vercel"
    exit 1
fi

# Verificar si el proyecto está vinculado a Vercel
if ! vercel project ls &> /dev/null; then
    echo "❌ Proyecto no vinculado a Vercel. Ejecuta: vercel link"
    exit 1
fi

echo "📝 Configurando variables de entorno..."

# Configurar Supabase URL
echo "🔗 Configurando NEXT_PUBLIC_SUPABASE_URL..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Configurar Supabase Anon Key
echo "🔑 Configurando NEXT_PUBLIC_SUPABASE_ANON_KEY..."
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo "✅ Variables de entorno configuradas correctamente"
echo ""
echo "📋 Para obtener los valores de Supabase:"
echo "1. Ve a https://supabase.com/dashboard"
echo "2. Selecciona tu proyecto"
echo "3. Ve a Settings > API"
echo "4. Copia la URL del proyecto y la anon key"
echo ""
echo "🔄 Después de configurar las variables, ejecuta:"
echo "vercel --prod" 