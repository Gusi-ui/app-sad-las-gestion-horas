const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepAnalyzeMaria() {
  try {
    console.log('🔍 ANÁLISIS PROFUNDO - María Caparros...\n');
    
    const mariaId = 'd004a547-9a2f-4a7f-94bd-3ba192306008';

    // 1. Verificar todas las tablas relacionadas
    console.log('📋 1. VERIFICANDO ASIGNACIONES...\n');
    
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', mariaId);

    console.log(`Asignaciones directas: ${assignments?.length || 0}`);
    if (assignments && assignments.length > 0) {
      assignments.forEach((a, i) => {
        console.log(`   ${i + 1}. ID: ${a.id}, Worker: ${a.worker_id}, Schedule: ${JSON.stringify(a.schedule)}`);
      });
    }

    // 2. Verificar si hay asignaciones con otros nombres
    console.log('\n📋 2. BUSCANDO ASIGNACIONES POR NOMBRE...\n');
    
    const { data: allAssignments, error: allAssignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        users!inner(name, surname)
      `)
      .ilike('users.name', '%maria%')
      .ilike('users.surname', '%caparros%');

    console.log(`Asignaciones por nombre: ${allAssignments?.length || 0}`);
    if (allAssignments && allAssignments.length > 0) {
      allAssignments.forEach((a, i) => {
        console.log(`   ${i + 1}. User: ${a.users.name} ${a.users.surname}, ID: ${a.id}, Worker: ${a.worker_id}`);
        console.log(`      Schedule: ${JSON.stringify(a.schedule)}`);
      });
    }

    // 3. Verificar trabajadoras
    console.log('\n📋 3. VERIFICANDO TRABAJADORAS...\n');
    
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*');

    console.log(`Total trabajadoras: ${workers?.length || 0}`);
    if (workers && workers.length > 0) {
      workers.forEach((w, i) => {
        console.log(`   ${i + 1}. ${w.name} (${w.email}) - Tipo: ${w.worker_type || 'No definido'}`);
      });
    }

    // 4. Verificar si hay asignaciones con trabajadoras específicas
    console.log('\n📋 4. BUSCANDO ASIGNACIONES POR TRABAJADORA...\n');
    
    if (workers && workers.length > 0) {
      for (const worker of workers) {
        const { data: workerAssignments, error: workerAssignmentsError } = await supabase
          .from('assignments')
          .select(`
            *,
            users(name, surname)
          `)
          .eq('worker_id', worker.id)
          .eq('user_id', mariaId);

        if (workerAssignments && workerAssignmentsError === null && workerAssignments.length > 0) {
          console.log(`Trabajadora ${worker.name} tiene asignaciones con María:`);
          workerAssignments.forEach((a, i) => {
            console.log(`   ${i + 1}. User: ${a.users.name} ${a.users.surname}`);
            console.log(`      Schedule: ${JSON.stringify(a.schedule)}`);
          });
        }
      }
    }

    // 5. Verificar balance detallado
    console.log('\n📋 5. BALANCE DETALLADO...\n');
    
    const { data: balance, error: balanceError } = await supabase
      .from('monthly_hours')
      .select('*')
      .eq('user_id', mariaId)
      .eq('year', 2025)
      .eq('month', 7)
      .single();

    if (balance) {
      console.log('Balance completo:');
      console.log(JSON.stringify(balance, null, 2));
      
      if (balance.holiday_info) {
        console.log('\nInformación de festivos:');
        console.log(JSON.stringify(balance.holiday_info, null, 2));
      }
    }

    // 6. Calcular manualmente considerando festivos
    console.log('\n📋 6. CÁLCULO MANUAL CON FESTIVOS...\n');
    
    // Julio 2025 - 28 de julio es festivo (lunes)
    const july2025 = {
      year: 2025,
      month: 7,
      days: 31,
      holidayDay: 28 // Lunes festivo
    };

    let mondayCount = 0;
    let thursdayCount = 0;
    let mondayHolidayCount = 0;
    let thursdayHolidayCount = 0;

    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 6, day);
      const dayOfWeek = date.getDay();
      const isHoliday = day === 28;
      
      if (dayOfWeek === 1) { // Lunes
        if (isHoliday) {
          mondayHolidayCount++;
        } else {
          mondayCount++;
        }
      } else if (dayOfWeek === 4) { // Jueves
        if (isHoliday) {
          thursdayHolidayCount++;
        } else {
          thursdayCount++;
        }
      }
    }

    console.log(`📅 Julio 2025 con festivos:`);
    console.log(`   Lunes laborables: ${mondayCount} días`);
    console.log(`   Jueves laborables: ${thursdayCount} días`);
    console.log(`   Lunes festivos: ${mondayHolidayCount} días`);
    console.log(`   Jueves festivos: ${thursdayHolidayCount} días`);
    console.log(`   Total días laborables: ${mondayCount + thursdayCount} días`);
    console.log(`   Total días festivos: ${mondayHolidayCount + thursdayHolidayCount} días\n`);

    const serviceDurationHours = 1.75;
    const laborableHours = (mondayCount + thursdayCount) * serviceDurationHours;
    const holidayHours = (mondayHolidayCount + thursdayHolidayCount) * serviceDurationHours;
    const totalHours = laborableHours + holidayHours;

    console.log(`⏰ Cálculo detallado:`);
    console.log(`   Horas laborables: ${mondayCount + thursdayCount} días × ${serviceDurationHours}h = ${laborableHours}h`);
    console.log(`   Horas festivas: ${mondayHolidayCount + thursdayHolidayCount} días × ${serviceDurationHours}h = ${holidayHours}h`);
    console.log(`   Total horas: ${totalHours}h\n`);

    // Comparar con balance
    if (balance) {
      console.log('📊 COMPARACIÓN FINAL:');
      console.log('=====================\n');
      console.log(`   Cálculo manual laborables: ${laborableHours}h`);
      console.log(`   Balance BD laborables: ${balance.laborable_hours}h`);
      console.log(`   Diferencia laborables: ${Math.abs(laborableHours - balance.laborable_hours).toFixed(2)}h`);
      
      console.log(`   Cálculo manual festivos: ${holidayHours}h`);
      console.log(`   Balance BD festivos: ${balance.holiday_hours}h`);
      console.log(`   Diferencia festivos: ${Math.abs(holidayHours - balance.holiday_hours).toFixed(2)}h`);
      
      console.log(`   Total manual: ${totalHours}h`);
      console.log(`   Total BD: ${balance.laborable_hours + balance.holiday_hours}h`);
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

deepAnalyzeMaria(); 