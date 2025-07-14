const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno de Supabase');
  console.error('Asegúrate de tener un archivo .env.local con:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
// // console.log('🚀 Iniciando migración para agregar assignment_type...');
    
    // Paso 1: Agregar la columna assignment_type
// // console.log('📝 Paso 1: Agregando columna assignment_type...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE assignments 
        ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) DEFAULT 'flexible' 
        CHECK (assignment_type IN ('laborables', 'festivos', 'flexible'));
      `
    });

    if (alterError) {
      console.error('❌ Error al agregar la columna:', alterError);
      return;
    }

// // console.log('✅ Columna assignment_type agregada correctamente');

    // Paso 2: Actualizar asignaciones existentes
// // console.log('📝 Paso 2: Actualizando asignaciones existentes...');
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE assignments 
        SET assignment_type = 'laborables' 
        WHERE specific_schedule IS NOT NULL AND specific_schedule != '{}';
      `
    });

    if (updateError) {
      console.error('❌ Error al actualizar asignaciones:', updateError);
      return;
    }

// // console.log('✅ Asignaciones existentes actualizadas');

    // Paso 3: Verificar la migración
// // console.log('📝 Paso 3: Verificando migración...');
    const { data: assignments, error: selectError } = await supabase
      .from('assignments')
      .select('id, assignment_type, specific_schedule')
      .limit(5);

    if (selectError) {
      console.error('❌ Error al verificar:', selectError);
      return;
    }

// // console.log('✅ Migración completada exitosamente!');
// // console.log('📊 Muestra de asignaciones actualizadas:');
    assignments.forEach(assignment => {
// // console.log(`  - ID: ${assignment.id}, Tipo: ${assignment.assignment_type}`);
    });

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la migración
runMigration(); 