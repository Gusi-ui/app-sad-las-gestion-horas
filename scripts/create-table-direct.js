const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTableDirect() {
// // console.log('🔧 Creando tabla de historial directamente...\n');

  try {
    // Intentar crear la tabla usando SQL directo
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS assignment_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        assignment_id UUID NOT NULL,
        previous_worker_id UUID,
        new_worker_id UUID NOT NULL,
        changed_by UUID NOT NULL,
        change_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

// // console.log('📋 SQL para crear la tabla:');
// // console.log(createTableSQL);
    
    // Intentar ejecutar usando rpc si existe
    try {
      const { error: rpcError } = await supabase.rpc('exec_sql', {
        sql: createTableSQL
      });

      if (rpcError) {
// // console.log('⚠️ No se pudo ejecutar via RPC:', rpcError.message);
// // console.log('📝 Ejecuta manualmente en Supabase Dashboard');
      } else {
// // console.log('✅ Tabla creada via RPC');
      }
    } catch (error) {
// // console.log('⚠️ RPC no disponible, ejecuta manualmente');
    }

    // Crear índices
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_assignment_history_assignment_id ON assignment_history(assignment_id);
      CREATE INDEX IF NOT EXISTS idx_assignment_history_created_at ON assignment_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_assignment_history_worker_id ON assignment_history(new_worker_id);
    `;

// // console.log('\n📋 SQL para crear índices:');
// // console.log(createIndexesSQL);

    // Habilitar RLS
    const enableRLSSQL = `
      ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;
    `;

// // console.log('\n📋 SQL para habilitar RLS:');
// // console.log(enableRLSSQL);

    // Crear políticas
    const createPoliciesSQL = `
      CREATE POLICY "Admins can view all assignment history" ON assignment_history
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
          )
        );

      CREATE POLICY "Admins can insert assignment history" ON assignment_history
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
          )
        );
    `;

// // console.log('\n📋 SQL para crear políticas:');
// // console.log(createPoliciesSQL);

// // console.log('\n' + '='.repeat(60));
// // console.log('📝 INSTRUCCIONES PARA EJECUTAR EN SUPABASE:');
// // console.log('='.repeat(60));
// // console.log('1. Ve a: https://supabase.com/dashboard/project/[TU_PROJECT]/sql/new');
// // console.log('2. Ejecuta cada bloque SQL por separado:');
// // console.log('   - Primero: CREATE TABLE...');
// // console.log('   - Segundo: CREATE INDEX...');
// // console.log('   - Tercero: ALTER TABLE...');
// // console.log('   - Cuarto: CREATE POLICY...');
// // console.log('3. Verifica que no hay errores');
// // console.log('4. Ejecuta: node scripts/test-complete-system.js');

    // Probar inserción simple
// // console.log('\n🧪 Probando inserción simple...');
    try {
      const { data, error } = await supabase
        .from('assignment_history')
        .insert({
          assignment_id: '00000000-0000-0000-0000-000000000000',
          new_worker_id: '00000000-0000-0000-0000-000000000000',
          changed_by: '00000000-0000-0000-0000-000000000000',
          change_reason: 'Test de creación de tabla'
        })
        .select();

      if (error) {
// // console.log('❌ Error al insertar prueba:', error.message);
// // console.log('   - La tabla aún no existe o hay un problema de permisos');
      } else {
// // console.log('✅ Inserción de prueba exitosa');
// // console.log('   - La tabla existe y funciona correctamente');
        
        // Limpiar
        await supabase
          .from('assignment_history')
          .delete()
          .eq('assignment_id', '00000000-0000-0000-0000-000000000000');
        
// // console.log('   - Registro de prueba eliminado');
      }
    } catch (error) {
// // console.log('❌ Error inesperado:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTableDirect(); 