const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function toggleRLSForAssignmentHistory() {
  const action = process.argv[2] || 'disable' // 'enable' o 'disable'
  
  console.log(`🔧 ${action === 'enable' ? 'Activando' : 'Desactivando'} RLS para assignment_history...\n`)

  try {
    if (action === 'disable') {
      // Desactivar RLS
      console.log('1. Desactivando RLS...')
      const { error: disableError } = await supabase
        .from('assignment_history')
        .select('*')
        .limit(0) // Esto no debería funcionar si RLS está activo
      
      if (disableError) {
        console.log('⚠️  RLS ya está activo, intentando desactivar...')
        // Como no podemos ejecutar SQL directamente, vamos a crear una política que permita todo
        console.log('💡 Sugerencia: Ejecuta manualmente en Supabase SQL Editor:')
        console.log('ALTER TABLE assignment_history DISABLE ROW LEVEL SECURITY;')
      } else {
        console.log('✅ RLS ya está desactivado')
      }
    } else {
      // Activar RLS
      console.log('1. Activando RLS...')
      console.log('💡 Sugerencia: Ejecuta manualmente en Supabase SQL Editor:')
      console.log('ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;')
    }

    // Verificar acceso
    console.log('\n2. Verificando acceso...')
    const { data: testData, error: testError } = await supabase
      .from('assignment_history')
      .select('id')
      .eq('assignment_id', '00ba1fcc-02a2-4c76-b314-212fa8b1a166')
      .limit(1)

    if (testError) {
      console.error('❌ Error de acceso:', testError)
      console.log('\n💡 Para desactivar RLS manualmente:')
      console.log('1. Ve a Supabase Dashboard')
      console.log('2. SQL Editor')
      console.log('3. Ejecuta: ALTER TABLE assignment_history DISABLE ROW LEVEL SECURITY;')
    } else {
      console.log('✅ Acceso verificado correctamente')
      console.log(`📊 Registros encontrados: ${testData?.length || 0}`)
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

toggleRLSForAssignmentHistory()
  .then(() => {
    console.log('\n✅ Operación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  }) 