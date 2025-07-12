const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRealAssignments() {
  console.log('🔍 Verificando asignaciones reales en la base de datos...\n');

  try {
    // Obtener todas las asignaciones con información completa
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        worker:workers!assignments_worker_id_fkey(
          id,
          name,
          email,
          worker_type
        ),
        user:users!assignments_user_id_fkey(
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error al obtener asignaciones:', error);
      return;
    }

    if (!assignments || assignments.length === 0) {
      console.log('⚠️  No se encontraron asignaciones en la base de datos');
      return;
    }

    console.log(`✅ Se encontraron ${assignments.length} asignaciones:\n`);

    assignments.forEach((assignment, index) => {
      console.log(`📋 Asignación ${index + 1}:`);
        console.log(`   ID: ${assignment.id}`);
  console.log(`   Tipo: ${assignment.assignment_type}`);
  console.log(`   Estado: ${assignment.status}`);
      console.log(`   Horas semanales: ${assignment.weekly_hours}`);
      console.log(`   Horario: ${JSON.stringify(assignment.schedule, null, 2)}`);
      console.log(`   Trabajador: ${assignment.worker?.name} (${assignment.worker?.email}) - ${assignment.worker?.worker_type}`);
      console.log(`   Usuario: ${assignment.user?.name} (${assignment.user?.email})`);
      console.log(`   Creada: ${new Date(assignment.created_at).toLocaleString('es-ES')}`);
      console.log(`   Actualizada: ${new Date(assignment.updated_at).toLocaleString('es-ES')}`);
      console.log('');
    });

    // Verificar tipos de asignación
    const types = [...new Set(assignments.map(a => a.assignment_type))];
    console.log('📊 Tipos de asignación encontrados:', types);

    // Verificar estados
    const statuses = [...new Set(assignments.map(a => a.status))];
    console.log('📊 Estados de asignación encontrados:', statuses);

    // Verificar trabajadores únicos
    const uniqueWorkers = [...new Set(assignments.map(a => a.worker_id))];
    console.log(`📊 Trabajadores únicos con asignaciones: ${uniqueWorkers.length}`);

    // Verificar usuarios únicos
    const uniqueUsers = [...new Set(assignments.map(a => a.user_id))];
    console.log(`📊 Usuarios únicos con asignaciones: ${uniqueUsers.length}`);

    // Verificar integridad de datos
    console.log('\n🔍 Verificando integridad de datos...');
    
    const invalidAssignments = assignments.filter(a => 
      !a.worker || !a.user || !a.assignment_type || !a.status
    );

    if (invalidAssignments.length > 0) {
      console.log('⚠️  Asignaciones con datos incompletos:');
      invalidAssignments.forEach(a => {
        console.log(`   - ID: ${a.id} - Worker: ${!!a.worker} - User: ${!!a.user} - Type: ${!!a.assignment_type} - Status: ${!!a.status}`);
      });
    } else {
      console.log('✅ Todas las asignaciones tienen datos completos');
    }

    // Verificar horarios
    console.log('\n🔍 Verificando horarios...');
    const assignmentsWithSchedule = assignments.filter(a => a.schedule);
    console.log(`✅ ${assignmentsWithSchedule.length} asignaciones tienen horario definido`);

    assignmentsWithSchedule.forEach((assignment, index) => {
      console.log(`\n📅 Horario de asignación ${index + 1} (${assignment.worker?.name} - ${assignment.user?.name}):`);
      if (assignment.schedule && typeof assignment.schedule === 'object') {
        Object.entries(assignment.schedule).forEach(([day, slots]) => {
          if (slots && slots.length > 0) {
            console.log(`   ${day}: ${slots.length} franja(s)`);
            slots.forEach((slot, slotIndex) => {
              console.log(`     ${slotIndex + 1}. ${slot.start_time} - ${slot.end_time}`);
            });
          }
        });
      }
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkRealAssignments(); 