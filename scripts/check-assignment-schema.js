const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAssignmentSchema() {
  console.log('🔍 Verificando esquema de la tabla assignments...\n');

  try {
    // Obtener información de la tabla assignments
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error al obtener datos de assignments:', error);
      return;
    }

    if (assignments && assignments.length > 0) {
      const assignment = assignments[0];
      console.log('📋 Campos disponibles en la tabla assignments:');
      Object.keys(assignment).forEach(field => {
        console.log(`   - ${field}: ${typeof assignment[field]} = ${JSON.stringify(assignment[field])}`);
      });
    } else {
      console.log('⚠️  No hay asignaciones en la tabla para verificar el esquema');
    }

    // Intentar obtener una asignación específica para ver todos los campos
    const { data: allAssignments, error: allError } = await supabase
      .from('assignments')
      .select('*');

    if (!allError && allAssignments && allAssignments.length > 0) {
      console.log('\n📊 Resumen de campos en todas las asignaciones:');
      const firstAssignment = allAssignments[0];
      Object.keys(firstAssignment).forEach(field => {
        const values = allAssignments.map(a => a[field]).filter(v => v !== null && v !== undefined);
        console.log(`   - ${field}: ${values.length} valores no nulos`);
      });
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkAssignmentSchema(); 