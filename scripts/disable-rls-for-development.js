const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function disableRLSForDevelopment() {
  console.log('🔧 Deshabilitando RLS para desarrollo...\n')

  try {
    // Lista de todas las tablas que necesitan RLS deshabilitado
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

    console.log('📋 Deshabilitando RLS en todas las tablas...')
    
    for (const table of tables) {
      try {
        // Intentar deshabilitar RLS usando SQL directo
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        })
        
        if (error) {
          console.warn(`⚠️ No se pudo deshabilitar RLS en ${table} via RPC:`, error.message)
          
          // Intentar método alternativo - eliminar políticas
          const { error: dropError } = await supabase.rpc('exec_sql', {
            sql: `DROP POLICY IF EXISTS "Super admin access all" ON ${table};`
          })
          
          if (dropError) {
            console.warn(`⚠️ No se pudo eliminar políticas en ${table}:`, dropError.message)
          } else {
            console.log(`✅ Políticas eliminadas en ${table}`)
          }
        } else {
          console.log(`✅ RLS deshabilitado en ${table}`)
        }
      } catch (err) {
        console.warn(`⚠️ Error procesando ${table}:`, err.message)
      }
    }

    console.log('\n🔍 Verificando acceso a tablas...')
    
    // Verificar que podemos acceder a las tablas principales
    const testTables = ['workers', 'users', 'assignments']
    
    for (const table of testTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.error(`❌ Error al acceder a ${table}:`, error.message)
      } else {
        console.log(`✅ Acceso a ${table} funcionando`)
      }
    }

    console.log('\n📊 Estado del sistema:')
    console.log('🟢 Si todas las tablas muestran "funcionando", el desarrollo puede continuar')
    console.log('🔴 Si hay errores, revisa los logs de arriba')
    
    console.log('\n⚠️ IMPORTANTE:')
    console.log('• RLS está deshabilitado temporalmente para desarrollo')
    console.log('• NO uses esta configuración en producción')
    console.log('• Cuando estés listo para producción, ejecuta el script de políticas seguras')
    
    console.log('\n📁 Archivos creados:')
    console.log('• scripts/disable-rls-for-development.js (este script)')
    console.log('• scripts/enable-secure-rls.js (para producción)')
    console.log('• SECURE_RLS_POLICIES.md (documentación de políticas seguras)')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

disableRLSForDevelopment() 