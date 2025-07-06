const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAssignmentsStructure() {
  try {
    console.log('🔍 Verificando estructura de la tabla assignments...\n');
    
    // Obtener todas las asignaciones sin filtros
    const { data: allAssignments, error: allError } = await supabase
      .from('assignments')
      .select('*');

    if (allError) {
      console.error('Error al obtener asignaciones:', allError);
      return;
    }

    console.log(`📊 Total asignaciones en la tabla: ${allAssignments?.length || 0}\n`);

    if (allAssignments && allAssignments.length > 0) {
      console.log('📋 Estructura de la primera asignación:');
      console.log(JSON.stringify(allAssignments[0], null, 2));
      console.log('');

      // Verificar campos disponibles
      const firstAssignment = allAssignments[0];
      const fields = Object.keys(firstAssignment);
      console.log('🏗️ Campos disponibles en la tabla assignments:');
      fields.forEach(field => {
        console.log(`   - ${field}: ${typeof firstAssignment[field]}`);
      });
      console.log('');

      // Verificar si hay campo status
      const hasStatus = fields.includes('status');
      console.log(`📊 Campo 'status' presente: ${hasStatus ? 'Sí' : 'No'}`);

      if (hasStatus) {
        const statusValues = [...new Set(allAssignments.map(a => a.status))];
        console.log(`   Valores de status encontrados: ${statusValues.join(', ')}`);
      }

      // Verificar asignaciones por usuario
      const userAssignments = {};
      allAssignments.forEach(assignment => {
        if (!userAssignments[assignment.user_id]) {
          userAssignments[assignment.user_id] = [];
        }
        userAssignments[assignment.user_id].push(assignment);
      });

      console.log('\n📋 Asignaciones por usuario:');
      Object.entries(userAssignments).forEach(([userId, assignments]) => {
        console.log(`   Usuario ${userId}: ${assignments.length} asignaciones`);
        assignments.forEach((assignment, index) => {
          console.log(`     ${index + 1}. ID: ${assignment.id}, Worker: ${assignment.worker_id}`);
          if (hasStatus) {
            console.log(`        Status: ${assignment.status}`);
          }
        });
      });
    } else {
      console.log('❌ No hay asignaciones en la tabla');
    }

    // Verificar si hay asignaciones con el filtro original del script
    console.log('\n🔍 Verificando filtro original del script...\n');
    
    const { data: filteredAssignments, error: filteredError } = await supabase
      .from('assignments')
      .select(`
        id,
        worker_id,
        assigned_hours_per_week,
        specific_schedule,
        workers!inner(
          id,
          name,
          surname,
          worker_type
        )
      `)
      .eq('status', 'active');

    if (filteredError) {
      console.log('❌ Error con filtro original:', filteredError.message);
    } else {
      console.log(`📊 Asignaciones con filtro 'status = active': ${filteredAssignments?.length || 0}`);
    }

    // Probar sin filtro de status
    console.log('\n🔍 Verificando sin filtro de status...\n');
    
    const { data: noStatusFilter, error: noStatusError } = await supabase
      .from('assignments')
      .select(`
        id,
        worker_id,
        assigned_hours_per_week,
        specific_schedule,
        workers!inner(
          id,
          name,
          surname,
          worker_type
        )
      `);

    if (noStatusError) {
      console.log('❌ Error sin filtro de status:', noStatusError.message);
    } else {
      console.log(`📊 Asignaciones sin filtro de status: ${noStatusFilter?.length || 0}`);
      
      if (noStatusFilter && noStatusFilter.length > 0) {
        console.log('\n📋 Primeras asignaciones encontradas:');
        noStatusFilter.slice(0, 3).forEach((assignment, index) => {
          console.log(`   ${index + 1}. ID: ${assignment.id}`);
          console.log(`      Worker: ${assignment.workers?.name} ${assignment.workers?.surname}`);
          console.log(`      Type: ${assignment.workers?.worker_type}`);
          console.log(`      Hours per week: ${assignment.assigned_hours_per_week}`);
          console.log(`      Schedule: ${JSON.stringify(assignment.specific_schedule)}`);
        });
      }
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

checkAssignmentsStructure(); 