#!/bin/bash

# =====================================================
# SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS - SAD LAS V2
# =====================================================

set -e

echo "🚀 Iniciando configuración de base de datos SAD LAS V2..."

# Verificar que existe el archivo .env.local
if [ ! -f .env.local ]; then
    echo "❌ Error: No se encontró el archivo .env.local"
    echo "📝 Por favor, copia env-new.example a .env.local y configura las variables"
    exit 1
fi

# Cargar variables de entorno
source .env.local

# Verificar variables requeridas
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Variables de Supabase no configuradas en .env.local"
    exit 1
fi

echo "✅ Variables de entorno cargadas correctamente"

# Instalar Supabase CLI si no está instalado
if ! command -v supabase &> /dev/null; then
    echo "📦 Instalando Supabase CLI..."
    npm install -g supabase
fi

echo "🔧 Configurando Supabase..."

# Inicializar Supabase (si no está inicializado)
if [ ! -f supabase/config.toml ]; then
    echo "📝 Inicializando configuración de Supabase..."
    supabase init
fi

# Aplicar el esquema de base de datos
echo "🗄️ Aplicando esquema de base de datos..."
supabase db reset --linked

echo "✅ Esquema de base de datos aplicado correctamente"

# Verificar que las tablas se crearon
echo "🔍 Verificando tablas creadas..."
supabase db diff --schema public

echo "🎉 ¡Configuración completada exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Verifica que todas las tablas se crearon correctamente"
echo "2. Configura las políticas RLS en el dashboard de Supabase"
echo "3. Crea el primer super admin manualmente"
echo "4. Ejecuta: npm run dev"
echo ""
echo "🔗 Dashboard de Supabase: $NEXT_PUBLIC_SUPABASE_URL" 