const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAssignmentHistoryRLS() {
  console.log('🔧 Corrigiendo políticas RLS para assignment_history...\n')

  try {
    // 1. Eliminar políticas existentes
    console.log('1. Eliminando políticas existentes...')
    const { error: dropSelectError } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Admins can view all assignment history" ON assignment_history;'
    })
    
    const { error: dropInsertError } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Admins can insert assignment history" ON assignment_history;'
    })

    if (dropSelectError) console.log('⚠️  Error al eliminar política SELECT:', dropSelectError.message)
    if (dropInsertError) console.log('⚠️  Error al eliminar política INSERT:', dropInsertError.message)

    // 2. Crear nuevas políticas
    console.log('\n2. Creando nuevas políticas...')
    
    const { error: createSelectError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "assignment_history_select_policy" ON assignment_history
        FOR SELECT USING (auth.uid() IS NOT NULL);
      `
    })

    const { error: createInsertError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "assignment_history_insert_policy" ON assignment_history
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
      `
    })

    if (createSelectError) {
      console.error('❌ Error al crear política SELECT:', createSelectError)
    } else {
      console.log('✅ Política SELECT creada correctamente')
    }

    if (createInsertError) {
      console.error('❌ Error al crear política INSERT:', createInsertError)
    } else {
      console.log('✅ Política INSERT creada correctamente')
    }

    // 3. Verificar que las políticas funcionan
    console.log('\n3. Verificando acceso...')
    const { data: testData, error: testError } = await supabase
      .from('assignment_history')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ Error al verificar acceso:', testError)
    } else {
      console.log('✅ Acceso verificado correctamente')
      console.log(`📊 Registros encontrados: ${testData?.length || 0}`)
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

fixAssignmentHistoryRLS()
  .then(() => {
    console.log('\n✅ Corrección de RLS completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  }) 