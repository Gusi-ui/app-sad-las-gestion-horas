const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function disableRLS() {
// // console.log('🔧 Deshabilitando RLS para desarrollo...\n')

  try {
    // Verificar si podemos acceder a las tablas
// // console.log('📋 Verificando acceso a tablas...')
    
    const { data: workersData, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .limit(1)

    if (workersError) {
      console.error('❌ Error al acceder a workers:', workersError.message)
// // console.log('🔍 Esto indica que hay problemas con las políticas RLS')
    } else {
// // console.log('✅ Acceso a workers funcionando')
    }

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (usersError) {
      console.error('❌ Error al acceder a users:', usersError.message)
    } else {
// // console.log('✅ Acceso a users funcionando')
    }

    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(1)

    if (assignmentsError) {
      console.error('❌ Error al acceder a assignments:', assignmentsError.message)
    } else {
// // console.log('✅ Acceso a assignments funcionando')
    }

// // console.log('\n📊 Estado actual:')
// // console.log('🔴 Si hay errores arriba, las políticas RLS están causando problemas')
// // console.log('🟢 Si todo está en verde, el acceso está funcionando correctamente')
    
// // console.log('\n💡 Para arreglar las políticas RLS, necesitas:')
// // console.log('1. Ir al dashboard de Supabase')
// // console.log('2. Ir a Authentication > Policies')
// // console.log('3. Eliminar las políticas problemáticas')
// // console.log('4. Crear políticas simples como: "FOR ALL USING (true)"')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

disableRLS() 