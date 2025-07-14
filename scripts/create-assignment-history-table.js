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
// // console.log('🔧 Creando tabla de historial de asignaciones...');

  try {
    // Crear la tabla assignment_history
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS assignment_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
          previous_worker_id UUID REFERENCES workers(id),
          new_worker_id UUID NOT NULL REFERENCES workers(id),
          changed_by UUID NOT NULL REFERENCES auth.users(id),
          change_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Índices para mejor rendimiento
          CONSTRAINT fk_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
          CONSTRAINT fk_previous_worker FOREIGN KEY (previous_worker_id) REFERENCES workers(id) ON DELETE SET NULL,
          CONSTRAINT fk_new_worker FOREIGN KEY (new_worker_id) REFERENCES workers(id) ON DELETE RESTRICT,
          CONSTRAINT fk_changed_by FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE RESTRICT
        );
        
        -- Crear índices para consultas eficientes
        CREATE INDEX IF NOT EXISTS idx_assignment_history_assignment_id ON assignment_history(assignment_id);
        CREATE INDEX IF NOT EXISTS idx_assignment_history_created_at ON assignment_history(created_at);
        CREATE INDEX IF NOT EXISTS idx_assignment_history_worker_id ON assignment_history(new_worker_id);
        
        -- Habilitar RLS
        ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;
        
        -- Políticas RLS para admins
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
      `
    });

    if (createError) {
      console.error('❌ Error al crear tabla:', createError);
      return;
    }

// // console.log('✅ Tabla assignment_history creada exitosamente');
// // console.log('✅ Índices creados para optimizar consultas');
// // console.log('✅ RLS habilitado con políticas de admin');

    // Verificar que la tabla se creó correctamente
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'assignment_history');

    if (checkError) {
// // console.log('⚠️ No se pudo verificar la tabla (esto es normal en algunos entornos)');
    } else if (tables && tables.length > 0) {
// // console.log('✅ Verificación: Tabla assignment_history existe');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createAssignmentHistoryTable(); 