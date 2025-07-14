// =====================================================
// SCRIPT PARA ARREGLAR POLÍTICAS RLS - SAD LAS V2
// =====================================================

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixRLSPolicies() {
// // console.log('🔧 Arreglando políticas RLS...\n')

  try {
    // Deshabilitar RLS en todas las tablas
// // console.log('📋 Deshabilitando RLS...')
    const tables = ['admins', 'workers', 'users', 'assignments', 'monthly_plans', 'service_days', 'holidays', 'system_alerts']
    
    for (const table of tables) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
      })
      
      if (error) {
        console.warn(`⚠️ No se pudo deshabilitar RLS en ${table}:`, error.message)
      } else {
// // console.log(`✅ RLS deshabilitado en ${table}`)
      }
    }

// // console.log('\n📋 Eliminando políticas existentes...')
    
    // Eliminar políticas existentes
    const policies = [
      'DROP POLICY IF EXISTS "Super admin access all" ON admins;',
      'DROP POLICY IF EXISTS "Super admin access all workers" ON workers;',
      'DROP POLICY IF EXISTS "Super admin access all users" ON users;',
      'DROP POLICY IF EXISTS "Admin access all workers" ON workers;',
      'DROP POLICY IF EXISTS "Admin access all users" ON users;',
      'DROP POLICY IF EXISTS "Admin access all assignments" ON assignments;',
      'DROP POLICY IF EXISTS "Workers can view own profile" ON workers;',
      'DROP POLICY IF EXISTS "Workers can update own profile" ON workers;',
      'DROP POLICY IF EXISTS "Workers can view own assignments" ON assignments;',
      'DROP POLICY IF EXISTS "Workers can view own monthly plans" ON monthly_plans;',
      'DROP POLICY IF EXISTS "Workers can view own service days" ON service_days;',
      'DROP POLICY IF EXISTS "Workers can update own service days" ON service_days;'
    ]

    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy })
      if (error) {
        console.warn(`⚠️ No se pudo eliminar política:`, error.message)
      }
    }

// // console.log('\n📋 Habilitando RLS nuevamente...')
    
    // Habilitar RLS nuevamente
    for (const table of tables) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      })
      
      if (error) {
        console.warn(`⚠️ No se pudo habilitar RLS en ${table}:`, error.message)
      } else {
// // console.log(`✅ RLS habilitado en ${table}`)
      }
    }

// // console.log('\n📋 Creando nuevas políticas simplificadas...')
    
    // Crear políticas simplificadas
    const newPolicies = [
      'CREATE POLICY "Allow all for authenticated users" ON admins FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "Allow all for authenticated users" ON workers FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "Allow all for authenticated users" ON assignments FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "Allow all for authenticated users" ON monthly_plans FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "Allow all for authenticated users" ON service_days FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "Allow all for authenticated users" ON holidays FOR ALL USING (auth.role() = \'authenticated\');',
      'CREATE POLICY "Allow all for authenticated users" ON system_alerts FOR ALL USING (auth.role() = \'authenticated\');'
    ]

    for (const policy of newPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy })
      if (error) {
        console.warn(`⚠️ No se pudo crear política:`, error.message)
      } else {
// // console.log(`✅ Política creada`)
      }
    }

// // console.log('\n✅ Políticas RLS arregladas exitosamente!')
// // console.log('🔓 Acceso completo habilitado para usuarios autenticados')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

fixRLSPolicies() 