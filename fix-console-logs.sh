#!/bin/bash

echo "🔧 Corrigiendo console.log problemáticos..."

# Corregir console.log en worker dashboard
sed -i '' 's/\/\/ console\.log(/\/\/ console.log(/g' src/app/worker/dashboard/page.tsx

# Comentar completamente los bloques de console.log problemáticos
sed -i '' '/\/\/ console.log.*{/,/});/s/^/\/\/ /' src/app/worker/dashboard/page.tsx

echo "✅ Console.log corregidos." 