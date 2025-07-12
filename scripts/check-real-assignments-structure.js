const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRealStructure() {
  try {
    console.log('🔍 Verificando estructura real de la tabla assignments...');
    
    // Intentar obtener una asignación con todos los campos básicos
    const { data: basicAssignment, error: basicError } = await supabase
      .from('assignments')
      .select('id, worker_id, user_id, status, created_at, assignment_type')
      .limit(1);

    if (basicError) {
      console.error('❌ Error al obtener asignación básica:', basicError);
      return;
    }

    console.log('✅ Campos básicos accesibles');
    console.log('📋 Asignación de ejemplo:', basicAssignment[0]);

    // Intentar diferentes campos para ver cuáles existen
    const fieldsToTest = [
      'specific_schedule',
      'schedule', 
      'weekly_schedule',
      'assigned_hours_per_week',
      'start_date',
      'end_date',
      'priority',
      'notes'
    ];

    console.log('\n🔍 Probando campos individuales:');
    
    for (const field of fieldsToTest) {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select(`id, ${field}`)
          .limit(1);
        
        if (error) {
          console.log(`  ❌ ${field}: NO existe (${error.message})`);
        } else {
          console.log(`  ✅ ${field}: SÍ existe`);
          if (data && data[0]) {
            console.log(`     Valor: ${JSON.stringify(data[0][field])}`);
          }
        }
      } catch (err) {
        console.log(`  ❌ ${field}: Error al probar`);
      }
    }

    // Verificar todas las asignaciones con assignment_type
    console.log('\n📊 Estado de assignment_type en todas las asignaciones:');
    const { data: allAssignments, error: allError } = await supabase
      .from('assignments')
      .select('id, assignment_type, worker_id, user_id')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error al obtener todas las asignaciones:', allError);
      return;
    }

    allAssignments.forEach(assignment => {
      console.log(`  - ID: ${assignment.id}, Tipo: ${assignment.assignment_type || 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la función
checkRealStructure(); 