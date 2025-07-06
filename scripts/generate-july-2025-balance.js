require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateJuly2025Balance() {
  try {
    console.log('🎯 Generando balance mensual de Julio 2025 con nueva lógica de reasignación...\n');

    const month = 7;
    const year = 2025;

    // 1. Obtener todos los usuarios activos
    console.log('1. Obteniendo usuarios activos...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, surname, monthly_hours')
      .eq('is_active', true)
      .order('name');

    if (usersError) {
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log('❌ No se encontraron usuarios activos');
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuarios activos\n`);

    // 2. Obtener festivos de julio 2025
    console.log('2. Obteniendo festivos de julio 2025...');
    const { data: holidays, error: holidaysError } = await supabase
      .from('local_holidays')
      .select('day, name, type')
      .eq('year', year)
      .eq('month', month);

    if (holidaysError) {
      throw holidaysError;
    }

    const holidayDays = holidays?.map(h => h.day) || [];
    console.log(`✅ Encontrados ${holidayDays.length} festivos: ${holidayDays.join(', ')}\n`);

    // 3. Procesar cada usuario
    let processedUsers = 0;
    let errors = 0;

    for (const user of users) {
      try {
        console.log(`📊 Procesando usuario: ${user.name} ${user.surname}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Horas mensuales asignadas: ${user.monthly_hours || 0}h`);

        // 4. Obtener asignaciones del usuario
        const { data: assignments, error: assignmentsError } = await supabase
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
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (assignmentsError) {
          throw assignmentsError;
        }

        if (!assignments || assignments.length === 0) {
          console.log(`   ⚠️  No tiene asignaciones activas`);
          console.log('');
          continue;
        }

        console.log(`   📋 Asignaciones encontradas: ${assignments.length}`);

        // 5. Calcular días del mes
        const daysInMonth = new Date(year, month, 0).getDate();
        const laborableDays = [];
        const holidayWeekendDays = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month - 1, day);
          const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isHoliday = holidayDays.includes(day);

          if (isHoliday || isWeekend) {
            holidayWeekendDays.push(day);
          } else {
            laborableDays.push(day);
          }
        }

        console.log(`   📅 Días laborables: ${laborableDays.length} (${laborableDays.join(', ')})`);
        console.log(`   🌟 Días festivos/fines de semana: ${holidayWeekendDays.length} (${holidayWeekendDays.join(', ')})`);

        // 6. Calcular horas por trabajadora
        let totalLaborableHours = 0;
        let totalHolidayHours = 0;
        const workerDetails = [];

        for (const assignment of assignments) {
          const worker = assignment.workers;
          const workerType = worker.worker_type || 'laborable';
          
          console.log(`   👤 ${worker.name} ${worker.surname} (${workerType})`);

          let workerLaborableHours = 0;
          let workerHolidayHours = 0;

          // Calcular horas según el tipo de trabajadora
          if (workerType === 'laborable' || workerType === 'both') {
            // Horas en días laborables
            const hoursPerDay = assignment.assigned_hours_per_week / 5; // Asumiendo 5 días laborables por semana
            workerLaborableHours = laborableDays.length * hoursPerDay;
            totalLaborableHours += workerLaborableHours;
            console.log(`      📅 Días laborables: ${laborableDays.length} × ${hoursPerDay.toFixed(1)}h = ${workerLaborableHours.toFixed(1)}h`);
          }

          if (workerType === 'holiday_weekend' || workerType === 'both') {
            // Horas en festivos y fines de semana
            const hoursPerDay = 1.5; // Horas por día festivo/fin de semana
            workerHolidayHours = holidayWeekendDays.length * hoursPerDay;
            totalHolidayHours += workerHolidayHours;
            console.log(`      🌟 Festivos/fines de semana: ${holidayWeekendDays.length} × ${hoursPerDay}h = ${workerHolidayHours.toFixed(1)}h`);
          }

          workerDetails.push({
            worker: worker,
            laborableHours: workerLaborableHours,
            holidayHours: workerHolidayHours,
            totalHours: workerLaborableHours + workerHolidayHours
          });
        }

        const totalHours = totalLaborableHours + totalHolidayHours;
        console.log(`   📊 TOTAL: ${totalHours.toFixed(1)}h (${totalLaborableHours.toFixed(1)}h laborables + ${totalHolidayHours.toFixed(1)}h festivos)`);

        // 7. Verificar si coincide con las horas asignadas
        const assignedHours = user.monthly_hours || 0;
        const difference = totalHours - assignedHours;
        
        if (Math.abs(difference) > 0.1) {
          console.log(`   ⚠️  DIFERENCIA: ${difference > 0 ? '+' : ''}${difference.toFixed(1)}h respecto a las ${assignedHours}h asignadas`);
        } else {
          console.log(`   ✅ Coincide con las ${assignedHours}h asignadas`);
        }

        // 8. Crear o actualizar el balance mensual
        console.log(`   💾 Guardando balance en la base de datos...`);
        
        const balanceData = {
          user_id: user.id,
          month: month,
          year: year,
          total_hours: totalHours,
          laborable_hours: totalLaborableHours,
          holiday_hours: totalHolidayHours,
          assigned_hours: assignedHours,
          difference: difference,
          holiday_info: {
            holiday_days: holidayDays,
            laborable_days: laborableDays,
            holiday_weekend_days: holidayWeekendDays,
            workers: workerDetails.map(wd => ({
              worker_id: wd.worker.id,
              worker_name: `${wd.worker.name} ${wd.worker.surname}`,
              worker_type: wd.worker.worker_type,
              laborable_hours: wd.laborableHours,
              holiday_hours: wd.holidayHours,
              total_hours: wd.totalHours
            }))
          },
          created_at: new Date().toISOString()
        };

        // Verificar si ya existe un balance para este usuario/mes/año
        const { data: existingBalance } = await supabase
          .from('monthly_hours')
          .select('id')
          .eq('user_id', user.id)
          .eq('month', month)
          .eq('year', year)
          .single();

        let result;
        if (existingBalance) {
          // Actualizar balance existente
          result = await supabase
            .from('monthly_hours')
            .update(balanceData)
            .eq('id', existingBalance.id)
            .select();
        } else {
          // Crear nuevo balance
          result = await supabase
            .from('monthly_hours')
            .insert([balanceData])
            .select();
        }

        if (result.error) {
          throw result.error;
        }

        console.log(`   ✅ Balance ${existingBalance ? 'actualizado' : 'creado'} correctamente`);
        processedUsers++;

      } catch (error) {
        console.error(`   ❌ Error procesando ${user.name} ${user.surname}:`, error.message);
        errors++;
      }

      console.log('');
    }

    // 9. Resumen final
    console.log('🎉 RESUMEN FINAL:');
    console.log(`   ✅ Usuarios procesados: ${processedUsers}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📊 Total usuarios: ${users.length}`);
    console.log('');
    console.log('💡 El balance mensual de Julio 2025 ha sido generado con la nueva lógica de reasignación.');
    console.log('   Los balances incluyen información detallada sobre festivos y reasignaciones.');

  } catch (error) {
    console.error('❌ Error durante la generación del balance:', error.message);
    if (error.details) {
      console.error('Detalles:', error.details);
    }
  }
}

// Ejecutar la generación del balance
generateJuly2025Balance(); 