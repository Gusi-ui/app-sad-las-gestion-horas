const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAssignmentHistoryTable() {
// // console.log('🔧 Creando tabla de historial de asignaciones...\n');

  try {
    // SQL para crear la tabla
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS assignment_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        previous_worker_id UUID REFERENCES workers(id),
        new_worker_id UUID NOT NULL REFERENCES workers(id),
        changed_by UUID NOT NULL,
        change_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_assignment_history_assignment_id ON assignment_history(assignment_id);
      CREATE INDEX IF NOT EXISTS idx_assignment_history_created_at ON assignment_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_assignment_history_worker_id ON assignment_history(new_worker_id);
    `;

    const enableRLSSQL = `
      ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;
    `;

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

// // console.log('📋 SQL para ejecutar en Supabase Dashboard:');
// // console.log('🔗 Ve a: https://supabase.com/dashboard/project/[TU_PROJECT]/sql/new');
// // console.log('\n' + '='.repeat(60));
// // console.log('PRIMER COMANDO - Crear tabla:');
// // console.log('='.repeat(60));
// // console.log(createTableSQL);
    
// // console.log('\n' + '='.repeat(60));
// // console.log('SEGUNDO COMANDO - Crear índices:');
// // console.log('='.repeat(60));
// // console.log(createIndexesSQL);
    
// // console.log('\n' + '='.repeat(60));
// // console.log('TERCER COMANDO - Habilitar RLS:');
// // console.log('='.repeat(60));
// // console.log(enableRLSSQL);
    
// // console.log('\n' + '='.repeat(60));
// // console.log('CUARTO COMANDO - Crear políticas:');
// // console.log('='.repeat(60));
// // console.log(createPoliciesSQL);
    
// // console.log('\n' + '='.repeat(60));
// // console.log('INSTRUCCIONES:');
// // console.log('='.repeat(60));
// // console.log('1. Ve al Supabase Dashboard');
// // console.log('2. Abre el SQL Editor');
// // console.log('3. Ejecuta cada comando por separado');
// // console.log('4. Verifica que no hay errores');
// // console.log('5. Ejecuta: node scripts/verify-assignment-history.js');
    
// // console.log('\n✅ Script completado');
// // console.log('📝 Ejecuta los comandos SQL en Supabase Dashboard');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createAssignmentHistoryTable(); 