const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDuplicateAssignments() {
  console.log('🔧 Corrigiendo asignaciones duplicadas...\n');

  try {
    // 1. Obtener todas las asignaciones activas
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        worker_id,
        user_id,
        status,
        schedule,
        workers:worker_id (id, name, surname),
        users:user_id (id, name, surname, monthly_hours)
      `)
      .eq('status', 'active')
      .order('worker_id');

    if (assignmentsError) {
      console.error('Error al obtener asignaciones:', assignmentsError);
      return;
    }

    // 2. Identificar usuarios con múltiples trabajadoras
    const usersWithMultipleWorkers = {};
    assignments.forEach(assignment => {
      const userId = assignment.user_id;
      if (!usersWithMultipleWorkers[userId]) {
        usersWithMultipleWorkers[userId] = {
          user: assignment.users,
          assignments: []
        };
      }
      usersWithMultipleWorkers[userId].assignments.push(assignment);
    });

    console.log('🔍 Usuarios con múltiples trabajadoras encontrados:');
    
    const duplicatesToFix = [];
    
    Object.values(usersWithMultipleWorkers).forEach(userData => {
      if (userData.assignments.length > 1) {
        console.log(`\n👥 ${userData.user.name} ${userData.user.surname} tiene ${userData.assignments.length} trabajadoras:`);
        userData.assignments.forEach(assignment => {
          console.log(`   - ${assignment.workers.name} ${assignment.workers.surname} (ID: ${assignment.id})`);
        });
        
        duplicatesToFix.push(userData);
      }
    });

    if (duplicatesToFix.length === 0) {
      console.log('\n✅ No se encontraron asignaciones duplicadas para corregir');
      return;
    }

    console.log('\n🔧 Procediendo a corregir asignaciones duplicadas...\n');

    // 3. Corregir cada caso específico
    for (const userData of duplicatesToFix) {
      const { user, assignments } = userData;
      console.log(`\n📋 Corrigiendo asignaciones para ${user.name} ${user.surname}:`);

      // Lógica específica para cada usuario
      if (user.name === 'Jose' && user.surname === 'Martínez Blanquez') {
        // Jose Martínez debe estar solo con Graciela Petri (días laborables)
        // Eliminar asignación con Rosa María
        const rosaMariaAssignment = assignments.find(a => 
          a.workers.name === 'Rosa María' && a.workers.surname === 'Robles Muñoz'
        );
        
        if (rosaMariaAssignment) {
          console.log(`   - Eliminando asignación con Rosa María (ID: ${rosaMariaAssignment.id})`);
          const { error } = await supabase
            .from('assignments')
            .delete()
            .eq('id', rosaMariaAssignment.id);
          
          if (error) {
            console.error(`     ❌ Error al eliminar: ${error.message}`);
          } else {
            console.log(`     ✅ Asignación eliminada correctamente`);
          }
        }
      }

      if (user.name === 'Antonio' && user.surname === 'Moreno Calzado') {
        // Antonio Moreno debe estar solo con Nuria Apellido
        // Eliminar asignación con Rosa María
        const rosaMariaAssignment = assignments.find(a => 
          a.workers.name === 'Rosa María' && a.workers.surname === 'Robles Muñoz'
        );
        
        if (rosaMariaAssignment) {
          console.log(`   - Eliminando asignación con Rosa María (ID: ${rosaMariaAssignment.id})`);
          const { error } = await supabase
            .from('assignments')
            .delete()
            .eq('id', rosaMariaAssignment.id);
          
          if (error) {
            console.error(`     ❌ Error al eliminar: ${error.message}`);
          } else {
            console.log(`     ✅ Asignación eliminada correctamente`);
          }
        }
      }
    }

    console.log('\n✅ Corrección de asignaciones duplicadas completada');
    console.log('\n📊 Verificando resultado final...\n');

    // 4. Verificar el resultado
    const { data: finalAssignments, error: finalError } = await supabase
      .from('assignments')
      .select(`
        id,
        worker_id,
        user_id,
        status,
        workers:worker_id (id, name, surname),
        users:user_id (id, name, surname, monthly_hours)
      `)
      .eq('status', 'active')
      .order('worker_id');

    if (finalError) {
      console.error('Error al verificar resultado:', finalError);
      return;
    }

    // Agrupar por trabajadora
    const finalByWorker = {};
    finalAssignments.forEach(assignment => {
      const workerKey = `${assignment.workers.name} ${assignment.workers.surname}`;
      if (!finalByWorker[workerKey]) {
        finalByWorker[workerKey] = [];
      }
      finalByWorker[workerKey].push(assignment);
    });

    console.log('📋 Estado final de asignaciones:');
    Object.entries(finalByWorker).forEach(([workerName, workerAssignments]) => {
      console.log(`\n👤 ${workerName}:`);
      console.log(`   - Usuarios asignados: ${workerAssignments.length}`);
      workerAssignments.forEach(assignment => {
        const user = assignment.users;
        console.log(`     • ${user.name} ${user.surname} (${user.monthly_hours}h/mes)`);
      });
    });

    // Verificar que no hay duplicados
    const finalUsersWithMultipleWorkers = {};
    finalAssignments.forEach(assignment => {
      const userId = assignment.user_id;
      if (!finalUsersWithMultipleWorkers[userId]) {
        finalUsersWithMultipleWorkers[userId] = {
          user: assignment.users,
          workers: []
        };
      }
      finalUsersWithMultipleWorkers[userId].workers.push(assignment.workers);
    });

    const remainingDuplicates = Object.values(finalUsersWithMultipleWorkers).filter(userData => 
      userData.workers.length > 1
    );

    if (remainingDuplicates.length === 0) {
      console.log('\n✅ No quedan usuarios con múltiples trabajadoras');
    } else {
      console.log('\n⚠️  Aún quedan usuarios con múltiples trabajadoras:');
      remainingDuplicates.forEach(userData => {
        console.log(`   - ${userData.user.name} ${userData.user.surname}:`);
        userData.workers.forEach(worker => {
          console.log(`     • ${worker.name} ${worker.surname}`);
        });
      });
    }

  } catch (error) {
    console.error('Error en la corrección:', error);
  }
}

fixDuplicateAssignments(); 