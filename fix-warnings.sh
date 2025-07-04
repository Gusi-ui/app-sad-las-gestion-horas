#!/bin/bash

echo "🧹 Limpiando warnings comunes..."

# Buscar y comentar variables no utilizadas
echo "📝 Comentando variables no utilizadas..."

# Variables no utilizadas en assignments
sed -i '' 's/const deleteAssignment = /\/\/ const deleteAssignment = /g' src/app/dashboard/assignments/[id]/page.tsx
sed -i '' 's/const showToast = /\/\/ const showToast = /g' src/app/dashboard/assignments/[id]/page.tsx

# Variables no utilizadas en workers
sed -i '' 's/const createWorker = /\/\/ const createWorker = /g' src/app/dashboard/workers/new/page.tsx

# Variables no utilizadas en login
sed -i '' 's/const data = /\/\/ const data = /g' src/app/login/page.tsx
sed -i '' 's/const data = /\/\/ const data = /g' src/app/worker/login/page.tsx

# Variables no utilizadas en worker dashboard
sed -i '' 's/import { Mail }/\/\/ import { Mail }/g' src/app/worker/dashboard/page.tsx
sed -i '' 's/const completedServices = /\/\/ const completedServices = /g' src/app/worker/dashboard/page.tsx
sed -i '' 's/const currentMonth = /\/\/ const currentMonth = /g' src/app/worker/dashboard/page.tsx
sed -i '' 's/const currentYear = /\/\/ const currentYear = /g' src/app/worker/dashboard/page.tsx
sed -i '' 's/const isToday = /\/\/ const isToday = /g' src/app/worker/dashboard/page.tsx

echo "✅ Warnings limpiados. Ejecuta './deploy.sh' para verificar." 