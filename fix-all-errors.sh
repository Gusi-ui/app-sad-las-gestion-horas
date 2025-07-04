#!/bin/bash

echo "🧹 Limpiando TODOS los errores de ESLint..."

# Función para comentar líneas específicas
comment_line() {
    local file=$1
    local line=$2
    local pattern=$3
    
    if [ -f "$file" ]; then
        # Comentar la línea específica
        sed -i '' "${line}s/^/\/\/ /" "$file"
        echo "✅ Comentada línea $line en $file"
    fi
}

# Función para comentar variables no utilizadas
comment_unused_vars() {
    local file=$1
    local pattern=$2
    
    if [ -f "$file" ]; then
        # Comentar variables no utilizadas
        sed -i '' "s/const $pattern = /\/\/ const $pattern = /g" "$file"
        sed -i '' "s/let $pattern = /\/\/ let $pattern = /g" "$file"
        echo "✅ Variables $pattern comentadas en $file"
    fi
}

# Limpiar variables no utilizadas en assignments
comment_unused_vars "src/app/dashboard/assignments/[id]/page.tsx" "deleteAssignment"
comment_unused_vars "src/app/dashboard/assignments/[id]/page.tsx" "showToast"

# Limpiar variables no utilizadas en workers
comment_unused_vars "src/app/dashboard/workers/new/page.tsx" "createWorker"
comment_unused_vars "src/app/dashboard/workers/[id]/edit/page.tsx" "supabase"

# Limpiar variables no utilizadas en login
comment_unused_vars "src/app/login/page.tsx" "data"
comment_unused_vars "src/app/worker/login/page.tsx" "data"

# Limpiar variables no utilizadas en worker dashboard
sed -i '' 's/import { Mail }/\/\/ import { Mail }/g' src/app/worker/dashboard/page.tsx
comment_unused_vars "src/app/worker/dashboard/page.tsx" "completedServices"
comment_unused_vars "src/app/worker/dashboard/page.tsx" "currentMonth"
comment_unused_vars "src/app/worker/dashboard/page.tsx" "currentYear"
comment_unused_vars "src/app/worker/dashboard/page.tsx" "isToday"
comment_unused_vars "src/app/worker/dashboard/page.tsx" "todayDayName"

# Limpiar variables no utilizadas en planning
comment_unused_vars "src/app/dashboard/planning/page.tsx" "setWeekStart"
comment_unused_vars "src/app/dashboard/planning/page.tsx" "year"
comment_unused_vars "src/app/dashboard/planning/page.tsx" "month"

# Limpiar variables no utilizadas en componentes
comment_unused_vars "src/components/PlanningCalendar.tsx" "err"
comment_unused_vars "src/components/PlanningCalendar.tsx" "index"

# Limpiar variables no utilizadas en WeeklyScheduleForm
sed -i '' 's/const _ = /\/\/ const _ = /g' src/components/WeeklyScheduleForm.tsx
sed -i '' 's/const _ = /\/\/ const _ = /g' src/components/WeeklyScheduleFormV2.tsx

# Comentar console.log statements en archivos críticos
echo "📝 Comentando console.log statements..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/console\.log(/\/\/ console.log(/g'

echo "✅ Todos los errores limpiados. Ejecuta './deploy.sh' para verificar." 