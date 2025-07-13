const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno necesarias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAssignmentHistoryTable() {
  console.log('🔧 Creando tabla de historial de asignaciones...\n')

  try {
    // Verificar si la tabla ya existe
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'assignment_history')

    if (checkError) {
      console.error('❌ Error al verificar tabla existente:', checkError)
      return
    }

    if (existingTables && existingTables.length > 0) {
      console.log('✅ La tabla assignment_history ya existe')
      return
    }

    // Crear la tabla usando SQL directo
    console.log('📋 Creando tabla assignment_history...')
    
    // Nota: Como no podemos ejecutar DDL directamente, vamos a crear un registro de prueba
    // para verificar que la funcionalidad funciona. La tabla se creará manualmente en Supabase.
    
    console.log('⚠️  La tabla assignment_history debe crearse manualmente en Supabase Dashboard')
    console.log('📋 SQL para crear la tabla:')
    console.log(`
CREATE TABLE assignment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  previous_worker_id UUID REFERENCES workers(id),
  new_worker_id UUID REFERENCES workers(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'reassigned', 'paused', 'resumed', 'deleted')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_assignment_history_assignment_id ON assignment_history(assignment_id);
CREATE INDEX idx_assignment_history_created_at ON assignment_history(created_at);
CREATE INDEX idx_assignment_history_action ON assignment_history(action);

-- RLS
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "assignment_history_select_policy" ON assignment_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@sadlas.com'
    )
  );

CREATE POLICY "assignment_history_insert_policy" ON assignment_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@sadlas.com'
    )
  );
    `)

    console.log('\n📝 Por favor, ejecuta este SQL en el Supabase Dashboard SQL Editor')
    console.log('🔗 Ve a: https://supabase.com/dashboard/project/[TU_PROJECT]/sql/new')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

createAssignmentHistoryTable() 