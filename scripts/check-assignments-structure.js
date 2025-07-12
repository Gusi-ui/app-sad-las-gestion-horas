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

async function checkAssignmentsStructure() {
  try {
    console.log('🔍 Verificando estructura de la tabla assignments...');
    
    // Obtener información de la tabla
    const { data: tableInfo, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'assignments' 
        ORDER BY ordinal_position;
      `
    });

    if (tableError) {
      console.error('❌ Error al obtener estructura de la tabla:', tableError);
      return;
    }

    console.log('📋 Estructura actual de la tabla assignments:');
    console.log('='.repeat(60));
    tableInfo.forEach(column => {
      console.log(`  ${column.column_name.padEnd(20)} | ${column.data_type.padEnd(15)} | ${column.is_nullable.padEnd(8)} | ${column.column_default || 'NULL'}`);
    });
    console.log('='.repeat(60));

    // Verificar si assignment_type ya existe
    const hasAssignmentType = tableInfo.some(col => col.column_name === 'assignment_type');
    console.log(`\n🔍 ¿Existe assignment_type? ${hasAssignmentType ? '✅ Sí' : '❌ No'}`);

    // Mostrar algunas asignaciones de ejemplo
    console.log('\n📊 Muestra de asignaciones existentes:');
    const { data: assignments, error: selectError } = await supabase
      .from('assignments')
      .select('*')
      .limit(3);

    if (selectError) {
      console.error('❌ Error al obtener asignaciones:', selectError);
      return;
    }

    assignments.forEach((assignment, index) => {
      console.log(`\n  Asignación ${index + 1}:`);
      Object.entries(assignment).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
    });

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la verificación
checkAssignmentsStructure(); 