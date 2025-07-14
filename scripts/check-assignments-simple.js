const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAssignmentsSimple() {
  try {
// // console.log('🔍 Verificando asignaciones de forma simple...\n');

    // 1. Verificar trabajadoras
// // console.log('👷 Trabajadoras:');
// // console.log('=================');
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*');

    if (workersError) {
// // console.log(`   ❌ Error: ${workersError.message}`);
    } else {
// // console.log(`   ✅ Total: ${workers.length}`);
      workers.forEach((worker, index) => {
// // console.log(`   ${index + 1}. ${worker.name} ${worker.surname} (${worker.worker_type})`);
      });
    }

// // console.log('\n' + '='.repeat(60) + '\n');

    // 2. Verificar asignaciones
// // console.log('📋 Asignaciones:');
// // console.log('================');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*');

    if (assignmentsError) {
// // console.log(`   ❌ Error: ${assignmentsError.message}`);
    } else {
// // console.log(`   ✅ Total: ${assignments.length}`);
      assignments.forEach((assignment, index) => {
// // console.log(`   ${index + 1}. ID: ${assignment.id}`);
// // console.log(`      Usuario ID: ${assignment.user_id}`);
// // console.log(`      Trabajadora ID: ${assignment.worker_id}`);
// // console.log(`      Horario: ${JSON.stringify(assignment.schedule)}`);
// // console.log(`      Creada: ${new Date(assignment.created_at).toLocaleDateString()}`);
// // console.log('');
      });
    }

// // console.log('\n' + '='.repeat(60) + '\n');

    // 3. Verificar estructura de tablas
// // console.log('🏗️ Estructura de tablas:');
// // console.log('========================');
    
    // Verificar columnas de assignments
    try {
      const { data: assignmentSample, error: assignmentSampleError } = await supabase
        .from('assignments')
        .select('*')
        .limit(1);
      
      if (assignmentSampleError) {
// // console.log(`   ❌ Error en assignments: ${assignmentSampleError.message}`);
      } else {
// // console.log(`   ✅ Tabla assignments accesible`);
        if (assignmentSample && assignmentSample.length > 0) {
// // console.log(`   Columnas disponibles: ${Object.keys(assignmentSample[0]).join(', ')}`);
        }
      }
    } catch (e) {
// // console.log(`   ❌ Error verificando assignments`);
    }

    // Verificar columnas de users
    try {
      const { data: userSample, error: userSampleError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (userSampleError) {
// // console.log(`   ❌ Error en users: ${userSampleError.message}`);
      } else {
// // console.log(`   ✅ Tabla users accesible`);
        if (userSample && userSample.length > 0) {
// // console.log(`   Columnas disponibles: ${Object.keys(userSample[0]).join(', ')}`);
        }
      }
    } catch (e) {
// // console.log(`   ❌ Error verificando users`);
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

checkAssignmentsSimple(); 