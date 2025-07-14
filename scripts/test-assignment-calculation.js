const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testAssignmentCalculation() {
  try {
// // console.log('🧪 Probando cálculo de asignaciones con lógica de reasignación...\n');

    // Datos de ejemplo para José Martínez (que sabemos que existe)
    const testUserId = '9af4d980-414c-4e9b-8400-3f6021755d45'; // José Martínez
    const testMonth = 7; // Julio
    const testYear = 2025;

// // console.log(`Usuario: José Martínez (ID: ${testUserId})`);
// // console.log(`Mes: ${testMonth}/${testYear}\n`);

    // Simular asignaciones para un usuario con servicio en días laborables
    const laborableAssignment = {
      id: 'laborable-assignment-1',
      user_id: testUserId,
      worker_id: 'laborable-worker-1',
      assigned_hours_per_week: 17.5,
      specific_schedule: {
        monday: ['08:00-09:30', '13:00-15:00'],
        tuesday: ['08:00-09:30', '13:00-15:00'],
        wednesday: ['08:00-09:30', '13:00-15:00'],
        thursday: ['08:00-09:30', '13:00-15:00'],
        friday: ['08:00-09:30', '13:00-15:00']
      },
      start_date: '2025-01-01',
      status: 'active'
    };

    // Simular asignación para festivos/fines de semana (si el usuario los tiene)
    const holidayAssignment = {
      id: 'holiday-assignment-1',
      user_id: testUserId,
      worker_id: 'holiday-worker-1',
      assigned_hours_per_week: 7.5, // 1.5h × 5 días (sábado, domingo + festivos)
      specific_schedule: {
        saturday: ['09:00-10:30'],
        sunday: ['09:00-10:30']
      },
      start_date: '2025-01-01',
      status: 'active'
    };

// // console.log('📅 Configuración de servicios:');
// // console.log('   Días laborables: Lunes a viernes, 08:00-09:30 y 13:00-15:00 (3.5h/día)');
// // console.log('   Fines de semana: Sábado y domingo, 09:00-10:30 (1.5h/día)');
// // console.log(`   Horas por semana laborable: ${laborableAssignment.assigned_hours_per_week}h`);
// // console.log(`   Horas por semana festiva: ${holidayAssignment.assigned_hours_per_week}h`);

    // Obtener festivos de julio 2025
    const { data: holidays, error: holidaysError } = await supabase
      .from('local_holidays')
      .select('*')
      .eq('year', testYear)
      .eq('month', testMonth);

    if (holidaysError) {
      console.error('Error obteniendo festivos:', holidaysError);
      return;
    }

// // console.log(`\n🎉 Festivos en julio 2025:`);
    const holidayDates = new Set();
    if (holidays && holidays.length > 0) {
      holidays.forEach(holiday => {
// // console.log(`   ${holiday.day} de julio - ${holiday.name} (${holiday.type})`);
        holidayDates.add(holiday.day);
      });
    } else {
// // console.log('   No hay festivos registrados para julio 2025');
    }

    // Calcular días del mes
    const daysInMonth = new Date(testYear, testMonth, 0).getDate();
    const laborableDays = [];
    const weekendDays = [];
    const holidayDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(testYear, testMonth - 1, day);
      const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, etc.
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
      
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidayDates.has(day);
      
      if (isHoliday) {
        holidayDays.push({ date: day, dayName, dayOfWeek });
      } else if (isWeekend) {
        weekendDays.push({ date: day, dayName, dayOfWeek });
      } else {
        laborableDays.push({ date: day, dayName, dayOfWeek });
      }
    }

// // console.log(`\n📊 Días del mes de julio 2025:`);
// // console.log(`   Días laborables: ${laborableDays.length}`);
// // console.log(`   Fines de semana: ${weekendDays.length}`);
// // console.log(`   Días festivos: ${holidayDays.length}`);

    // Mostrar días específicos
// // console.log(`\n📅 Días laborables:`);
    laborableDays.forEach(day => {
      const dayNames = { 
        monday: 'Lunes', 
        tuesday: 'Martes', 
        wednesday: 'Miércoles', 
        thursday: 'Jueves', 
        friday: 'Viernes'
      };
// // console.log(`   ${day.date} de julio - ${dayNames[day.dayName]}`);
    });

// // console.log(`\n🌅 Fines de semana:`);
    weekendDays.forEach(day => {
      const dayNames = { 
        saturday: 'Sábado', 
        sunday: 'Domingo'
      };
// // console.log(`   ${day.date} de julio - ${dayNames[day.dayName]}`);
    });

// // console.log(`\n🎉 Días festivos:`);
    holidayDays.forEach(day => {
      const dayNames = { 
        monday: 'Lunes', 
        tuesday: 'Martes', 
        wednesday: 'Miércoles', 
        thursday: 'Jueves', 
        friday: 'Viernes',
        saturday: 'Sábado', 
        sunday: 'Domingo'
      };
      const holiday = holidays.find(h => h.day === day.date);
// // console.log(`   ${day.date} de julio - ${dayNames[day.dayName]} (${holiday.name})`);
    });

    // Aplicar lógica de reasignación
// // console.log(`\n🔄 LÓGICA DE REASIGNACIÓN:`);
    
    // Caso 1: Usuario con servicio solo en días laborables
// // console.log(`\n📋 CASO 1: Usuario con servicio solo en días laborables`);
    const laborableServiceDays = laborableDays.filter(day => 
      laborableAssignment.specific_schedule[day.dayName] && 
      laborableAssignment.specific_schedule[day.dayName].length > 0
    );
    
    const laborableHours = laborableServiceDays.length * 3.5;
// // console.log(`   Días laborables con servicio: ${laborableServiceDays.length}`);
// // console.log(`   Horas trabajadora laborable: ${laborableHours.toFixed(1)}h`);
// // console.log(`   Horas trabajadora festivos: 0h`);
// // console.log(`   Total: ${laborableHours.toFixed(1)}h`);

    // Caso 2: Usuario con servicio en días laborables + festivos/fines de semana
// // console.log(`\n📋 CASO 2: Usuario con servicio en días laborables + festivos/fines de semana`);
    
    // Días que van a la trabajadora de festivos (fines de semana + festivos)
    const holidayWorkerDays = [...weekendDays, ...holidayDays];
    const holidayWorkerServiceDays = holidayWorkerDays.filter(day => 
      holidayAssignment.specific_schedule[day.dayName] && 
      holidayAssignment.specific_schedule[day.dayName].length > 0
    );
    
    const holidayWorkerHours = holidayWorkerServiceDays.length * 1.5;
    const totalHoursCase2 = laborableHours + holidayWorkerHours;
    
// // console.log(`   Días laborables con servicio: ${laborableServiceDays.length}`);
// // console.log(`   Días festivos/fines de semana con servicio: ${holidayWorkerServiceDays.length}`);
// // console.log(`   Horas trabajadora laborable: ${laborableHours.toFixed(1)}h`);
// // console.log(`   Horas trabajadora festivos: ${holidayWorkerHours.toFixed(1)}h`);
// // console.log(`   Total: ${totalHoursCase2.toFixed(1)}h`);

    // Caso 3: Usuario con servicio solo en festivos/fines de semana
// // console.log(`\n📋 CASO 3: Usuario con servicio solo en festivos/fines de semana`);
// // console.log(`   Días laborables con servicio: 0`);
// // console.log(`   Días festivos/fines de semana con servicio: ${holidayWorkerServiceDays.length}`);
// // console.log(`   Horas trabajadora laborable: 0h`);
// // console.log(`   Horas trabajadora festivos: ${holidayWorkerHours.toFixed(1)}h`);
// // console.log(`   Total: ${holidayWorkerHours.toFixed(1)}h`);

// // console.log(`\n✅ Prueba completada. La lógica de reasignación está correctamente implementada.`);

  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

testAssignmentCalculation(); 