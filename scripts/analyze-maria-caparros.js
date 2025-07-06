const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeMariaCaparros() {
  try {
    console.log('🔍 Analizando caso de María Caparros...\n');
    
    // Buscar María Caparros
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .ilike('name', '%maria%')
      .ilike('surname', '%caparros%');

    if (usersError) {
      console.error('Error al buscar usuarios:', usersError);
      return;
    }

    if (users.length === 0) {
      console.log('❌ No se encontró María Caparros');
      return;
    }

    const mariaCaparros = users[0];
    console.log(`👤 Usuario encontrado: ${mariaCaparros.name} ${mariaCaparros.surname}`);
    console.log(`   ID: ${mariaCaparros.id}`);
    console.log(`   Horas mensuales asignadas: ${mariaCaparros.monthly_hours}h`);
    console.log(`   Activo: ${mariaCaparros.is_active ? 'Sí' : 'No'}\n`);

    // Obtener asignaciones de María Caparros
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        workers(name, email),
        users(name, surname)
      `)
      .eq('user_id', mariaCaparros.id);

    if (assignmentsError) {
      console.error('Error al obtener asignaciones:', assignmentsError);
      return;
    }

    console.log(`📋 Asignaciones encontradas: ${assignments.length}\n`);

    assignments.forEach((assignment, index) => {
      console.log(`Asignación ${index + 1}:`);
      console.log(`   Trabajadora: ${assignment.workers?.name || 'N/A'}`);
      console.log(`   Horario: ${JSON.stringify(assignment.schedule, null, 2)}`);
      console.log(`   Notas: ${assignment.notes || 'Sin notas'}`);
      console.log('');
    });

    // Obtener balance de julio 2025
    const { data: balance, error: balanceError } = await supabase
      .from('monthly_hours')
      .select('*')
      .eq('user_id', mariaCaparros.id)
      .eq('year', 2025)
      .eq('month', 7)
      .single();

    if (balanceError) {
      console.error('Error al obtener balance:', balanceError);
      return;
    }

    console.log('📊 Balance actual en la base de datos:');
    console.log(`   Asignadas: ${balance.assigned_hours}h`);
    console.log(`   Laborables: ${balance.laborable_hours}h`);
    console.log(`   Festivos: ${balance.holiday_hours}h`);
    console.log(`   Diferencia: ${balance.difference}h`);
    console.log(`   Creado: ${balance.created_at}`);
    console.log(`   Actualizado: ${balance.updated_at}\n`);

    // Calcular manualmente julio 2025
    console.log('🧮 CÁLCULO MANUAL JULIO 2025:');
    console.log('=============================\n');

    // Julio 2025 tiene 31 días
    const july2025 = {
      year: 2025,
      month: 7,
      days: 31
    };

    // Contar martes y jueves en julio 2025
    let tuesdayCount = 0;
    let thursdayCount = 0;
    let totalServiceDays = 0;

    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 6, day); // Mes 6 = Julio (0-indexed)
      const dayOfWeek = date.getDay(); // 0 = Domingo, 2 = Martes, 4 = Jueves
      
      if (dayOfWeek === 2) { // Martes
        tuesdayCount++;
        totalServiceDays++;
      } else if (dayOfWeek === 4) { // Jueves
        thursdayCount++;
        totalServiceDays++;
      }
    }

    console.log(`📅 Julio 2025 (31 días):`);
    console.log(`   Martes: ${tuesdayCount} días`);
    console.log(`   Jueves: ${thursdayCount} días`);
    console.log(`   Total días de servicio: ${totalServiceDays} días\n`);

    // Calcular horas
    const serviceDurationHours = 1.75; // 1 hora y 45 minutos = 1.75 horas
    const totalHours = totalServiceDays * serviceDurationHours;

    console.log(`⏰ Cálculo de horas:`);
    console.log(`   Duración del servicio: ${serviceDurationHours}h (1h 45min)`);
    console.log(`   Total horas = ${totalServiceDays} días × ${serviceDurationHours}h = ${totalHours}h\n`);

    // Comparar con balance actual
    console.log('📊 COMPARACIÓN:');
    console.log('================\n');
    console.log(`   Cálculo manual: ${totalHours}h`);
    console.log(`   Balance en BD: ${balance.laborable_hours}h`);
    console.log(`   Diferencia: ${Math.abs(totalHours - balance.laborable_hours).toFixed(2)}h`);
    
    if (Math.abs(totalHours - balance.laborable_hours) < 0.1) {
      console.log(`   ✅ Los valores coinciden`);
    } else {
      console.log(`   ❌ Los valores NO coinciden`);
    }

    // Verificar si hay festivos en julio 2025
    console.log('\n🎉 VERIFICACIÓN DE FESTIVOS:');
    console.log('============================\n');

    const { data: holidays, error: holidaysError } = await supabase
      .from('local_holidays')
      .select('*')
      .eq('year', 2025)
      .eq('month', 7);

    if (holidaysError) {
      console.error('Error al obtener festivos:', holidaysError);
    } else {
      console.log(`Festivos en julio 2025: ${holidays.length}`);
      holidays.forEach(holiday => {
        console.log(`   ${holiday.day}/${holiday.month}/${holiday.year}: ${holiday.name}`);
      });
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

analyzeMariaCaparros(); 