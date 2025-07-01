#!/bin/bash

echo "🚀 Iniciando despliegue de app-sad-las..."

# Verificar que estamos en la rama correcta
if [[ $(git branch --show-current) != "main" ]]; then
    echo "⚠️  No estás en la rama main. Cambiando a main..."
    git checkout main
fi

# Actualizar dependencias
echo "📦 Actualizando dependencias..."
npm install

# Ejecutar tests y linting
echo "🔍 Ejecutando verificaciones..."
npm run lint
npm run build

# Verificar que el build fue exitoso
if [ $? -eq 0 ]; then
    echo "✅ Build exitoso!"
    echo ""
    echo "🎉 ¡Listo para desplegar!"
    echo ""
    echo "📋 Pasos para despliegue:"
    echo "1. Subir cambios a GitHub: git add . && git commit -m 'Deploy ready' && git push"
    echo "2. Conectar a Vercel/Netlify"
    echo "3. Configurar variables de entorno en la plataforma"
    echo "4. Desplegar!"
    echo ""
    echo "🔧 Variables de entorno necesarias:"
    echo "- NEXT_PUBLIC_SUPABASE_URL"
    echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "- SUPABASE_SERVICE_ROLE_KEY"
else
    echo "❌ Error en el build. Revisa los errores arriba."
    exit 1
fi 