const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyRLSPolicies() {
  console.log('🔍 Verificando políticas RLS...\n')

  try {
    // Verificar estado de RLS en todas las tablas
    console.log('📋 Estado de RLS por tabla:')
    
    const tables = [
      'admins',
      'workers', 
      'users',
      'assignments',
      'monthly_plans',
      'service_days',
      'holidays',
      'system_alerts'
    ]

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error) {
          if (error.message.includes('infinite recursion')) {
            console.log(`🔴 ${table}: RLS habilitado con error de recursión`)
          } else if (error.message.includes('permission denied')) {
            console.log(`🟡 ${table}: RLS habilitado - acceso denegado (esperado)`)
          } else {
            console.log(`🔴 ${table}: Error - ${error.message}`)
          }
        } else {
          console.log(`🟢 ${table}: RLS deshabilitado o políticas permisivas`)
        }
      } catch (err) {
        console.log(`🔴 ${table}: Error de conexión - ${err.message}`)
      }
    }

    console.log('\n📊 Conteo de registros (si es accesible):')
    
    // Intentar contar registros en tablas principales
    const mainTables = ['workers', 'users', 'assignments']
    
    for (const table of mainTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ ${table}: No se puede contar - ${error.message}`)
        } else {
          console.log(`✅ ${table}: ${count || 0} registros`)
        }
      } catch (err) {
        console.log(`❌ ${table}: Error al contar - ${err.message}`)
      }
    }

    console.log('\n🔒 Verificación de políticas:')
    
    // Verificar si hay políticas activas
    try {
      const { data: policies, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd
          FROM pg_policies 
          WHERE schemaname = 'public' 
          ORDER BY tablename, policyname;
        `
      })
      
      if (error) {
        console.log('⚠️ No se pueden verificar políticas via RPC')
      } else if (policies && policies.length > 0) {
        console.log(`✅ ${policies.length} políticas activas encontradas`)
        
        // Agrupar por tabla
        const policiesByTable = {}
        policies.forEach(policy => {
          if (!policiesByTable[policy.tablename]) {
            policiesByTable[policy.tablename] = []
          }
          policiesByTable[policy.tablename].push(policy.policyname)
        })
        
        Object.keys(policiesByTable).forEach(table => {
          console.log(`  📋 ${table}: ${policiesByTable[table].join(', ')}`)
        })
      } else {
        console.log('⚠️ No se encontraron políticas activas')
      }
    } catch (err) {
      console.log('⚠️ No se pueden verificar políticas - RPC no disponible')
    }

    console.log('\n📋 Recomendaciones:')
    
    // Dar recomendaciones basadas en el estado actual
    console.log('• Si ves errores de recursión: Ejecuta scripts/disable-rls-for-development.js')
    console.log('• Si ves "acceso denegado": Las políticas están funcionando correctamente')
    console.log('• Si ves "RLS deshabilitado": Configuración para desarrollo')
    console.log('• Para producción: Ejecuta scripts/enable-secure-rls.js')

    console.log('\n🚀 Próximos pasos:')
    console.log('1. Para desarrollo: Usar políticas permisivas o deshabilitar RLS')
    console.log('2. Para producción: Implementar políticas seguras')
    console.log('3. Para testing: Verificar cada rol tiene acceso apropiado')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

verifyRLSPolicies() 