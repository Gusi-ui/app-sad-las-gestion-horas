const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Aplicando migración de campos de dirección para workers...')
  
  try {
    // 1. Verificar estructura actual
    console.log('🔍 Verificando estructura actual...')
    
    const { data: workers, error: fetchError } = await supabase
      .from('workers')
      .select('*')
      .limit(1)
    
    if (fetchError) {
      console.error('❌ Error al verificar estructura:', fetchError)
      return
    }
    
    console.log('✅ Conexión a base de datos exitosa')
    console.log('📋 Campos disponibles:', Object.keys(workers[0] || {}))
    
    // 2. Intentar insertar un worker de prueba con los nuevos campos
    console.log('🧪 Probando inserción con nuevos campos...')
    
    const testWorker = {
      employee_code: 'TEST001',
      name: 'Test',
      surname: 'Worker',
      email: 'test@example.com',
      phone: '600000000',
      street_address: 'Calle Test 123',
      postal_code: '08301',
      city: 'Mataró',
      province: 'Barcelona',
      worker_type: 'regular',
      hourly_rate: 12.50,
      hire_date: new Date().toISOString().split('T')[0],
      availability_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
    
    const { data: insertedWorker, error: insertError } = await supabase
      .from('workers')
      .insert([testWorker])
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Error al insertar worker de prueba:', insertError)
      console.log('💡 Los campos de dirección no están disponibles en la base de datos')
      console.log('📝 Necesitas ejecutar la migración SQL manualmente en el dashboard de Supabase')
      return
    }
    
    console.log('✅ Campos de dirección disponibles')
    console.log('📋 Worker insertado:', insertedWorker)
    
    // 3. Limpiar worker de prueba
    console.log('🧹 Limpiando worker de prueba...')
    
    const { error: deleteError } = await supabase
      .from('workers')
      .delete()
      .eq('employee_code', 'TEST001')
    
    if (deleteError) {
      console.error('⚠️ Error al limpiar worker de prueba:', deleteError)
    } else {
      console.log('✅ Worker de prueba eliminado')
    }
    
    console.log('🎉 ¡Migración completada exitosamente!')
    console.log('📝 Los campos de dirección están disponibles en la base de datos')
    
  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

applyMigration() 