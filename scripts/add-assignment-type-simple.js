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

async function addAssignmentTypeColumn() {
  try {
// // console.log('🚀 Agregando columna assignment_type a la tabla assignments...');
    
    // Primero, verificar si la columna ya existe
    const { data: existingColumns, error: checkError } = await supabase
      .from('assignments')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Error al verificar la tabla:', checkError);
      return;
    }

// // console.log('✅ Tabla assignments accesible');
    
    // Intentar agregar la columna usando una consulta directa
// // console.log('📝 Agregando columna assignment_type...');
    
    // Como no podemos usar exec_sql, vamos a intentar una actualización simple
    // para ver si la columna ya existe
    const { data: testData, error: testError } = await supabase
      .from('assignments')
      .select('id, assignment_type')
      .limit(1);

    if (testError && testError.message.includes('column "assignment_type" does not exist')) {
// // console.log('❌ La columna assignment_type no existe. Necesitas ejecutar esto en el SQL Editor de Supabase:');
// // console.log('\n' + '='.repeat(60));
// // console.log(`
-- Ejecuta esto en el SQL Editor de Supabase:

ALTER TABLE assignments 
ADD COLUMN assignment_type VARCHAR(20) DEFAULT 'flexible' 
CHECK (assignment_type IN ('laborables', 'festivos', 'flexible'));

-- Verificar que se agregó correctamente:
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'assignments' AND column_name = 'assignment_type';
      `);
// // console.log('='.repeat(60));
      return;
    }

    if (testError) {
      console.error('❌ Error inesperado:', testError);
      return;
    }

// // console.log('✅ La columna assignment_type ya existe!');
    
    // Verificar el estado actual
    const { data: assignments, error: selectError } = await supabase
      .from('assignments')
      .select('id, assignment_type')
      .limit(5);

    if (selectError) {
      console.error('❌ Error al verificar asignaciones:', selectError);
      return;
    }

// // console.log('📊 Estado actual de assignment_type:');
    assignments.forEach(assignment => {
// // console.log(`  - ID: ${assignment.id}, Tipo: ${assignment.assignment_type || 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la función
addAssignmentTypeColumn(); 