const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno necesarias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🔧 Ejecutando migración de historial de asignaciones...\n')

  try {
    // Crear tabla de historial de asignaciones
    console.log('📋 Creando tabla assignment_history...')
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS assignment_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
          previous_worker_id UUID REFERENCES workers(id),
          new_worker_id UUID REFERENCES workers(id),
          action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'reassigned', 'paused', 'resumed', 'deleted')),
          notes TEXT,
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (createTableError) {
      console.error('❌ Error al crear tabla:', createTableError)
      return
    }

    console.log('✅ Tabla assignment_history creada correctamente')

    // Crear índices
    console.log('📊 Creando índices...')
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_assignment_history_assignment_id ON assignment_history(assignment_id);
        CREATE INDEX IF NOT EXISTS idx_assignment_history_created_at ON assignment_history(created_at);
        CREATE INDEX IF NOT EXISTS idx_assignment_history_action ON assignment_history(action);
      `
    })

    if (indexError) {
      console.error('❌ Error al crear índices:', indexError)
      return
    }

    console.log('✅ Índices creados correctamente')

    // Habilitar RLS
    console.log('🔒 Configurando RLS...')
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;'
    })

    if (rlsError) {
      console.error('❌ Error al habilitar RLS:', rlsError)
      return
    }

    console.log('✅ RLS habilitado correctamente')

    // Crear policies
    console.log('🛡️ Creando policies...')
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "assignment_history_select_policy" ON assignment_history;
        CREATE POLICY "assignment_history_select_policy" ON assignment_history
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM auth.users 
              WHERE auth.users.id = auth.uid() 
              AND auth.users.email LIKE '%@sadlas.com'
            )
          );

        DROP POLICY IF EXISTS "assignment_history_insert_policy" ON assignment_history;
        CREATE POLICY "assignment_history_insert_policy" ON assignment_history
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM auth.users 
              WHERE auth.users.id = auth.uid() 
              AND auth.users.email LIKE '%@sadlas.com'
            )
          );
      `
    })

    if (policyError) {
      console.error('❌ Error al crear policies:', policyError)
      return
    }

    console.log('✅ Policies creados correctamente')

    // Verificar que la tabla existe
    console.log('🔍 Verificando tabla...')
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'assignment_history')

    if (checkError) {
      console.error('❌ Error al verificar tabla:', checkError)
      return
    }

    if (tables && tables.length > 0) {
      console.log('✅ Tabla assignment_history verificada correctamente')
    } else {
      console.error('❌ La tabla no se creó correctamente')
      return
    }

    console.log('\n🎉 Migración completada exitosamente!')
    console.log('📋 La tabla assignment_history está lista para registrar reasignaciones')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

runMigration() 