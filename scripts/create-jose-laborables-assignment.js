const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createJoseLaborablesAssignment() {
  console.log('🔧 Creando asignación de días laborables para José Martínez...\n');

  try {
    // 1. Obtener José Martínez
    const { data: joseMartinez, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('name', 'Jose')
      .eq('surname', 'Martínez Blanquez')
      .single();

    if (userError || !joseMartinez) {
      console.error('❌ No se encontró José Martínez:', userError);
      return;
    }

    // 2. Obtener trabajadoras disponibles
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (workersError) {
      console.error('❌ Error al obtener trabajadoras:', workersError);
      return;
    }

    console.log(`👥 Trabajadoras disponibles:`);
    workers.forEach(worker => {
      console.log(`   - ${worker.name} ${worker.surname} (${worker.email})`);
    });

    // 3. Buscar Rosa María Robles Muñoz (que parece ser la trabajadora principal)
    const rosaMaria = workers.find(w => w.name === 'Rosa María' && w.surname === 'Robles Muñoz');
    
    if (!rosaMaria) {
      console.error('❌ No se encontró Rosa María Robles Muñoz');
      return;
    }

    console.log(`\n✅ Trabajadora seleccionada: ${rosaMaria.name} ${rosaMaria.surname}`);

    // 4. Calcular horas necesarias para días laborables
    const currentMonth = 7;
    const currentYear = 2025;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // Obtener festivos
    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${daysInMonth}`;
    
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('date, name, type')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_active', true);

    const holidayDates = new Set((holidays || []).map(h => new Date(h.date).getDate()));
    
    let laborableDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = date.getDay();
      const isHoliday = holidayDates.has(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (!isHoliday && !isWeekend) {
        laborableDays++;
      }
    }

    // Calcular horas semanales necesarias
    const hoursPerLaborableDay = 3.9; // Basado en el cálculo anterior
    const weeklyHours = Math.round(hoursPerLaborableDay * 5 * 10) / 10; // 5 días laborables por semana

    console.log(`\n📊 Cálculo de horas:`);
    console.log(`   - Días laborables en julio: ${laborableDays}`);
    console.log(`   - Horas por día laborable: ${hoursPerLaborableDay}h`);
    console.log(`   - Horas semanales necesarias: ${weeklyHours}h`);

    // 5. Crear horario para días laborables
    const laborablesSchedule = {
      monday: {
        enabled: true,
        timeSlots: [
          {
            start: "09:00",
            end: "12:00"
          }
        ]
      },
      tuesday: {
        enabled: true,
        timeSlots: [
          {
            start: "09:00",
            end: "12:00"
          }
        ]
      },
      wednesday: {
        enabled: true,
        timeSlots: [
          {
            start: "09:00",
            end: "12:00"
          }
        ]
      },
      thursday: {
        enabled: true,
        timeSlots: [
          {
            start: "09:00",
            end: "12:00"
          }
        ]
      },
      friday: {
        enabled: true,
        timeSlots: [
          {
            start: "09:00",
            end: "12:00"
          }
        ]
      },
      saturday: {
        enabled: false,
        timeSlots: []
      },
      sunday: {
        enabled: false,
        timeSlots: []
      },
      holiday: {
        enabled: false,
        timeSlots: []
      }
    };

    // 6. Crear la asignación
    const assignmentData = {
      user_id: joseMartinez.id,
      worker_id: rosaMaria.id,
      assignment_type: 'laborables',
      weekly_hours: weeklyHours,
      status: 'active',
      start_date: '2025-07-01',
      schedule: laborablesSchedule,
      notes: 'Asignación para días laborables - José Martínez'
    };

    console.log(`\n💾 Creando asignación...`);
    console.log(`   - Usuario: ${joseMartinez.name} ${joseMartinez.surname}`);
    console.log(`   - Trabajadora: ${rosaMaria.name} ${rosaMaria.surname}`);
    console.log(`   - Tipo: ${assignmentData.assignment_type}`);
    console.log(`   - Horas semanales: ${assignmentData.weekly_hours}h`);
    console.log(`   - Horario: L-V 9:00-12:00`);

    const { data: newAssignment, error: insertError } = await supabase
      .from('assignments')
      .insert([assignmentData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error al crear asignación:', insertError);
      return;
    }

    console.log(`\n✅ Asignación creada exitosamente:`);
    console.log(`   - ID: ${newAssignment.id}`);
    console.log(`   - Estado: ${newAssignment.status}`);

    // 7. Regenerar balances
    console.log(`\n🔄 Regenerando balances...`);
    
    // Ejecutar el script de generación de balances
    const { exec } = require('child_process');
    exec('node scripts/generate-monthly-balances-from-assignments.js', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error al regenerar balances:', error);
        return;
      }
      console.log('✅ Balances regenerados exitosamente');
      console.log('\n🎉 Proceso completado');
    });

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

createJoseLaborablesAssignment(); 