const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUserBalanceCalculation() {
  console.log('🧪 Probando cálculo de balance por usuario...\n');

  try {
    // 1. Obtener una trabajadora para probar
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, email')
      .limit(1);

    if (workersError || !workers.length) {
      console.error('Error al obtener trabajadoras:', workersError);
      return;
    }

    const worker = workers[0];
    console.log(`👤 Probando con trabajadora: ${worker.name} ${worker.surname}`);

    // 2. Obtener festivos de julio 2025
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('date, name, type')
      .eq('year', 2025)
      .eq('month', 7)
      .eq('is_active', true);

    if (holidaysError) {
      console.warn('Error al obtener festivos:', holidaysError);
    }

    const holidayDates = new Set((holidays || []).map(h => new Date(h.date).getDate()));
    console.log(`📅 Festivos de julio 2025: ${holidays?.length || 0} encontrados`);
    if (holidays && holidays.length > 0) {
      holidays.forEach(holiday => {
        const date = new Date(holiday.date);
        console.log(`   - ${date.getDate()}/${date.getMonth() + 1}: ${holiday.name}`);
      });
    }

    // 3. Obtener asignaciones de la trabajadora
    const { data: workerAssignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        users:user_id (
          id,
          name,
          surname,
          address,
          phone,
          monthly_hours
        )
      `)
      .eq('worker_id', worker.id)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('Error al obtener asignaciones:', assignmentsError);
      return;
    }

    console.log(`\n📋 Asignaciones de ${worker.name}:`);
    workerAssignments.forEach(assignment => {
      const user = assignment.users;
      console.log(`   - ${user.name} ${user.surname} (${user.monthly_hours}h/mes)`);
    });

    // 4. Calcular balance manualmente para verificar
    const currentMonth = 7;
    const currentYear = 2025;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    console.log(`\n🔢 Cálculo manual para julio 2025 (${daysInMonth} días):`);

    let laborableDays = 0;
    let festivoDays = 0;
    let laborableHours = 0;
    let festivoHours = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const isHoliday = holidayDates.has(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let isFestivo = false;
      if (isHoliday) {
        isFestivo = true;
      } else if (isWeekend) {
        isFestivo = true;
      }

      if (isFestivo) {
        festivoDays++;
      } else {
        laborableDays++;
      }

      // Calcular horas para este día
      workerAssignments.forEach(assignment => {
        if (assignment.schedule && assignment.schedule[isFestivo ? (isHoliday ? 'holiday' : dayName) : dayName]) {
          const daySchedule = assignment.schedule[isFestivo ? (isHoliday ? 'holiday' : dayName) : dayName];
          if (daySchedule?.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
            let dayHours = 0;
            daySchedule.timeSlots.forEach((slot) => {
              const [startHour, startMin] = slot.start.split(':').map(Number);
              const [endHour, endMin] = slot.end.split(':').map(Number);
              const startTime = startHour + startMin / 60;
              const endTime = endHour + endMin / 60;
              dayHours += Math.max(0, endTime - startTime);
            });
            if (isFestivo) {
              festivoHours += dayHours;
            } else {
              laborableHours += dayHours;
            }
          }
        }
      });
    }

    console.log(`   - Días laborables: ${laborableDays}`);
    console.log(`   - Días festivos: ${festivoDays}`);
    console.log(`   - Horas laborables: ${laborableHours.toFixed(1)}h`);
    console.log(`   - Horas festivas: ${festivoHours.toFixed(1)}h`);
    console.log(`   - Total horas: ${(laborableHours + festivoHours).toFixed(1)}h`);

    // 5. Probar la API
    console.log(`\n🌐 Probando API de balance por usuario...`);
    
    // Simular la llamada a la API
    const apiUrl = `http://localhost:3000/api/worker/user-balance?workerId=${worker.id}&month=${currentMonth}&year=${currentYear}`;
    console.log(`   URL: ${apiUrl}`);
    
    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ API respondió correctamente`);
        console.log(`   - Trabajadora: ${data.workerName}`);
        console.log(`   - Usuarios en balance: ${data.userBalances.length}`);
        
        if (data.userBalances.length > 0) {
          console.log(`\n📊 Balance del primer usuario:`);
          const firstUser = data.userBalances[0];
          console.log(`   - Usuario: ${firstUser.userName} ${firstUser.userSurname}`);
          console.log(`   - Horas mensuales: ${firstUser.monthlyHours}h`);
          console.log(`   - Horas asignadas: ${firstUser.assignedHours}h`);
          console.log(`   - Horas realizadas: ${firstUser.usedHours}h`);
          console.log(`   - Estado: ${firstUser.status}`);
          console.log(`   - Días laborables: ${firstUser.holidayInfo.workingDays}`);
          console.log(`   - Horas laborables: ${firstUser.holidayInfo.workingHours}h`);
          console.log(`   - Días festivos: ${firstUser.holidayInfo.totalHolidays}`);
          console.log(`   - Horas festivas: ${firstUser.holidayInfo.holidayHours}h`);
        }
      } else {
        console.log(`   ❌ API respondió con error: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error al llamar API: ${error.message}`);
    }

    console.log('\n✅ Prueba completada');

  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

testUserBalanceCalculation(); 