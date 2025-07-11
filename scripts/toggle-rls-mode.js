const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function toggleRLSMode() {
  const mode = process.argv[2] // 'dev' o 'prod'
  
  if (!mode || (mode !== 'dev' && mode !== 'prod')) {
    console.log('🔧 Script para alternar modo RLS')
    console.log('\nUso:')
    console.log('  node scripts/toggle-rls-mode.js dev   # Modo desarrollo (RLS deshabilitado)')
    console.log('  node scripts/toggle-rls-mode.js prod  # Modo producción (RLS seguro)')
    console.log('\nEjemplos:')
    console.log('  node scripts/toggle-rls-mode.js dev')
    console.log('  node scripts/toggle-rls-mode.js prod')
    process.exit(0)
  }

  if (mode === 'dev') {
    console.log('🔧 Cambiando a modo DESARROLLO (RLS deshabilitado)...\n')
    await disableRLSForDevelopment()
  } else if (mode === 'prod') {
    console.log('🔒 Cambiando a modo PRODUCCIÓN (RLS seguro)...\n')
    await enableSecureRLS()
  }
}

async function disableRLSForDevelopment() {
  try {
    const tables = [
      'admins', 'workers', 'users', 'assignments',
      'monthly_plans', 'service_days', 'holidays', 'system_alerts'
    ]

    console.log('📋 Deshabilitando RLS en todas las tablas...')
    
    for (const table of tables) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        })
        
        if (error) {
          console.warn(`⚠️ No se pudo deshabilitar RLS en ${table}:`, error.message)
        } else {
          console.log(`✅ RLS deshabilitado en ${table}`)
        }
      } catch (err) {
        console.warn(`⚠️ Error procesando ${table}:`, err.message)
      }
    }

    console.log('\n🔍 Verificando acceso...')
    
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

    console.log('\n✅ Modo DESARROLLO activado')
    console.log('⚠️ RLS deshabilitado - NO usar en producción')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function enableSecureRLS() {
  try {
    const tables = [
      'admins', 'workers', 'users', 'assignments',
      'monthly_plans', 'service_days', 'holidays', 'system_alerts'
    ]

    console.log('📋 Habilitando RLS en todas las tablas...')
    
    for (const table of tables) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
        })
        
        if (error) {
          console.warn(`⚠️ No se pudo habilitar RLS en ${table}:`, error.message)
        } else {
          console.log(`✅ RLS habilitado en ${table}`)
        }
      } catch (err) {
        console.warn(`⚠️ Error procesando ${table}:`, err.message)
      }
    }

    console.log('\n📋 Creando políticas seguras...')

    // Políticas básicas para desarrollo seguro
    const basicPolicies = [
      'CREATE POLICY "allow_authenticated_users" ON admins FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "allow_authenticated_users" ON workers FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "allow_authenticated_users" ON users FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "allow_authenticated_users" ON assignments FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "allow_authenticated_users" ON monthly_plans FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "allow_authenticated_users" ON service_days FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "allow_authenticated_users" ON holidays FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "allow_authenticated_users" ON system_alerts FOR ALL USING (auth.role() = \'authenticated\');'
    ]

    for (const policy of basicPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy })
        if (error) {
          console.warn(`⚠️ Error en política:`, error.message)
        } else {
          console.log(`✅ Política creada`)
        }
      } catch (err) {
        console.warn(`⚠️ Error aplicando política:`, err.message)
      }
    }

    console.log('\n✅ Modo PRODUCCIÓN activado')
    console.log('🔒 RLS habilitado con políticas básicas')
    console.log('💡 Para políticas más seguras, ejecuta: node scripts/enable-secure-rls.js')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

toggleRLSMode() 