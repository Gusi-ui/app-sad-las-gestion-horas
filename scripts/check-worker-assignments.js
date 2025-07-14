const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWorkerAssignments() {
  console.log('🔍 Verificando asignaciones de trabajadoras...\n');

  try {
    // 1. Obtener todas las trabajadoras
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, email')
      .order('name');

    if (workersError) {
      console.error('Error al obtener trabajadoras:', workersError);
      return;
    }

    console.log('📋 Trabajadoras encontradas:');
    workers.forEach(worker => {
      console.log(`  - ${worker.name} ${worker.surname} (${worker.email})`);
    });
    console.log('');

    // 2. Obtener todas las asignaciones activas
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

    console.log('📊 Resumen de asignaciones por trabajadora:');
    
    // Agrupar asignaciones por trabajadora
    const assignmentsByWorker = {};
    workers.forEach(worker => {
      assignmentsByWorker[worker.id] = {
        worker,
        assignments: [],
        totalUsers: 0,
        totalMonthlyHours: 0
      };
    });

    assignments.forEach(assignment => {
      if (assignmentsByWorker[assignment.worker_id]) {
        assignmentsByWorker[assignment.worker_id].assignments.push(assignment);
        assignmentsByWorker[assignment.worker_id].totalUsers++;
        assignmentsByWorker[assignment.worker_id].totalMonthlyHours += assignment.users?.monthly_hours || 0;
      }
    });

    // Mostrar resumen por trabajadora
    Object.values(assignmentsByWorker).forEach(workerData => {
      const { worker, assignments, totalUsers, totalMonthlyHours } = workerData;
      console.log(`\n👤 ${worker.name} ${worker.surname}:`);
      console.log(`   - Usuarios asignados: ${totalUsers}`);
      console.log(`   - Horas mensuales totales: ${totalMonthlyHours}h`);
      
      if (assignments.length > 0) {
        console.log('   - Usuarios específicos:');
        assignments.forEach(assignment => {
          const user = assignment.users;
          console.log(`     • ${user.name} ${user.surname} (${user.monthly_hours}h/mes)`);
        });
      } else {
        console.log('   - No tiene asignaciones activas');
      }
    });

    // 3. Verificar problemas específicos
    console.log('\n🔍 Verificando problemas específicos...\n');

    // Buscar María Rosa
    const mariaRosa = workers.find(w => 
      w.name.toLowerCase().includes('maría') && 
      w.surname.toLowerCase().includes('rosa')
    );

    if (mariaRosa) {
      const mariaRosaAssignments = assignmentsByWorker[mariaRosa.id];
      console.log(`⚠️  María Rosa tiene ${mariaRosaAssignments.assignments.length} asignaciones activas:`);
      mariaRosaAssignments.assignments.forEach(assignment => {
        const user = assignment.users;
        console.log(`   - ${user.name} ${user.surname} (${user.monthly_hours}h/mes)`);
      });
    } else {
      console.log('ℹ️  No se encontró María Rosa en la base de datos');
    }

    // Buscar María Caparrós
    const mariaCaparros = workers.find(w => 
      w.name.toLowerCase().includes('maría') && 
      w.surname.toLowerCase().includes('caparrós')
    );

    if (mariaCaparros) {
      const mariaCaparrosAssignments = assignmentsByWorker[mariaCaparros.id];
      console.log(`\n📋 María Caparrós tiene ${mariaCaparrosAssignments.assignments.length} asignaciones activas:`);
      mariaCaparrosAssignments.assignments.forEach(assignment => {
        const user = assignment.users;
        console.log(`   - ${user.name} ${user.surname} (${user.monthly_hours}h/mes)`);
      });
    } else {
      console.log('\nℹ️  No se encontró María Caparrós en la base de datos');
    }

    // Buscar María Romero
    const mariaRomero = workers.find(w => 
      w.name.toLowerCase().includes('maría') && 
      w.surname.toLowerCase().includes('romero')
    );

    if (mariaRomero) {
      const mariaRomeroAssignments = assignmentsByWorker[mariaRomero.id];
      console.log(`\n📋 María Romero tiene ${mariaRomeroAssignments.assignments.length} asignaciones activas:`);
      mariaRomeroAssignments.assignments.forEach(assignment => {
        const user = assignment.users;
        console.log(`   - ${user.name} ${user.surname} (${user.monthly_hours}h/mes)`);
      });
    } else {
      console.log('\nℹ️  No se encontró María Romero en la base de datos');
    }

    // 4. Verificar usuarios con múltiples trabajadoras
    console.log('\n🔍 Verificando usuarios con múltiples trabajadoras...\n');
    
    const usersWithMultipleWorkers = {};
    assignments.forEach(assignment => {
      const userId = assignment.user_id;
      if (!usersWithMultipleWorkers[userId]) {
        usersWithMultipleWorkers[userId] = {
          user: assignment.users,
          workers: []
        };
      }
      usersWithMultipleWorkers[userId].workers.push(assignment.workers);
    });

    Object.values(usersWithMultipleWorkers).forEach(userData => {
      if (userData.workers.length > 1) {
        console.log(`👥 ${userData.user.name} ${userData.user.surname} tiene ${userData.workers.length} trabajadoras:`);
        userData.workers.forEach(worker => {
          console.log(`   - ${worker.name} ${worker.surname}`);
        });
      }
    });

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('Error en la verificación:', error);
  }
}

checkWorkerAssignments(); 