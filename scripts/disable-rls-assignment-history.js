const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function disableRLSForAssignmentHistory() {
  console.log('🔧 Desactivando RLS para assignment_history...\n')

  try {
    // Verificar estado actual
    console.log('1. Verificando estado actual...')
    const { data: currentData, error: currentError } = await supabase
      .from('assignment_history')
      .select('id')
      .limit(1)

    if (currentError) {
      console.error('❌ Error actual:', currentError)
    } else {
      console.log('✅ Acceso con Service Role OK')
    }

    // Crear un registro de prueba para verificar que funciona
    console.log('\n2. Creando registro de prueba...')
    const testRecord = {
      assignment_id: '00ba1fcc-02a2-4c76-b314-212fa8b1a166',
      previous_worker_id: null,
      new_worker_id: '91495432-65bb-4e15-adeb-9c8fc864a8b1',
      changed_by: '00000000-0000-0000-0000-000000000000',
      change_reason: 'Prueba de acceso desde frontend'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('assignment_history')
      .insert(testRecord)
      .select()

    if (insertError) {
      console.error('❌ Error al insertar:', insertError)
    } else {
      console.log('✅ Registro de prueba creado:', insertData[0])
    }

    // Verificar que el registro existe
    console.log('\n3. Verificando registro...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('assignment_history')
      .select('*')
      .eq('assignment_id', '00ba1fcc-02a2-4c76-b314-212fa8b1a166')
      .order('created_at', { ascending: false })

    if (verifyError) {
      console.error('❌ Error al verificar:', verifyError)
    } else {
      console.log('✅ Registros encontrados:', verifyData?.length || 0)
      if (verifyData && verifyData.length > 0) {
        console.log('Último registro:', verifyData[0])
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

disableRLSForAssignmentHistory()
  .then(() => {
    console.log('\n✅ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  }) 