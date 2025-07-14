import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!workerId || !month || !year) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: workerId, month, year' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Verificar que el usuario esté autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que la trabajadora existe y coincide con el usuario autenticado
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, email, name')
      .eq('id', workerId)
      .eq('email', user.email)
      .single();

    if (workerError || !worker) {
      return NextResponse.json(
        { error: 'Trabajadora no encontrada o no autorizada' },
        { status: 403 }
      );
    }

    // 1. Obtener todas las asignaciones activas de la trabajadora
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
      .eq('worker_id', workerId)
      .eq('status', 'active');

    if (assignmentsError) {
      return NextResponse.json(
        { error: `Error al obtener asignaciones: ${assignmentsError.message}` },
        { status: 500 }
      );
    }

    if (!workerAssignments || workerAssignments.length === 0) {
      return NextResponse.json({
        workerId,
        workerName: worker.name,
        month: parseInt(month),
        year: parseInt(year),
        userBalances: [],
        totalAssignedHours: 0,
        totalUsedHours: 0,
        totalRemainingHours: 0,
        overallStatus: 'perfect'
      });
    }

    // 2. Obtener festivos del mes
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`;
    
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('date, name, type')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_active', true);

    if (holidaysError) {
      console.warn('Error al obtener festivos:', holidaysError);
    }

    const holidayDates = new Set((holidays || []).map(h => new Date(h.date).getDate()));

    // 3. Obtener usuarios únicos de las asignaciones de esta trabajadora
    const uniqueUserIds = [...new Set(workerAssignments.map(a => a.user_id))];

    // 4. Calcular balance por usuario (considerando TODAS las trabajadoras)
    const userBalances = [];
    let totalAssignedHours = 0;
    let totalUsedHours = 0;

    for (const userId of uniqueUserIds) {
      // Obtener TODAS las asignaciones de este usuario (de todas las trabajadoras)
      const { data: allUserAssignments, error: allAssignmentsError } = await supabase
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
          ),
          workers:worker_id (
            id,
            name,
            surname
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (allAssignmentsError) {
        console.error(`Error al obtener todas las asignaciones del usuario ${userId}:`, allAssignmentsError);
        continue;
      }

      const user = allUserAssignments?.[0]?.users;
      if (!user) continue;

      const monthlyHours = user.monthly_hours || 0;
      
      // Calcular días del mes
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      let laborableDays = 0;
      let festivoDays = 0;
      let laborableHours = 0;
      let festivoHours = 0;
      let totalAssignedHoursForUser = 0;
      let totalUsedHoursForUser = 0;
      let holidayHours = 0;
      let workingHours = 0;
      let totalHolidays = 0;
      let workingDays = 0;

      // Calcular días laborables y festivos correctamente
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(parseInt(year), parseInt(month) - 1, day);
        const dayOfWeek = date.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        const isHoliday = holidayDates.has(day);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const today = new Date();
        const isPastDay = date <= today;

        // Lógica correcta: si es festivo (local/nacional) o fin de semana, cuenta como festivo
        // Si no, cuenta como laborable
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

        // Calcular horas asignadas por tipo de día
        allUserAssignments?.forEach(assignment => {
          if (assignment.schedule && assignment.schedule[isFestivo ? (isHoliday ? 'holiday' : dayName) : dayName]) {
            const daySchedule = assignment.schedule[isFestivo ? (isHoliday ? 'holiday' : dayName) : dayName];
            if (daySchedule?.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
              let dayHours = 0;
              daySchedule.timeSlots.forEach((slot: any) => {
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
              // Solo contar como "usadas" si es un día pasado
              if (isPastDay) {
                totalUsedHoursForUser += dayHours;
              }
              // Contar como "asignadas" siempre
              totalAssignedHoursForUser += dayHours;
            }
          }
        });
      }

      // Actualizar las variables para usar los nombres correctos
      workingDays = laborableDays;
      workingHours = laborableHours;
      totalHolidays = festivoDays;
      holidayHours = festivoHours;

      // Calcular horas de esta trabajadora específica con este usuario
      let workerAssignedHours = 0;
      let workerUsedHours = 0;

      const workerUserAssignments = workerAssignments.filter(a => a.user_id === userId);
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(parseInt(year), parseInt(month) - 1, day);
        const dayOfWeek = date.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        const today = new Date();
        const isPastDay = date <= today;

                 workerUserAssignments.forEach(assignment => {
           if (assignment.schedule && assignment.schedule[dayName]) {
             const daySchedule = assignment.schedule[dayName];
             if (daySchedule?.enabled && daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
               let dayHours = 0;
               daySchedule.timeSlots.forEach((slot: any) => {
                 const [startHour, startMin] = slot.start.split(':').map(Number);
                 const [endHour, endMin] = slot.end.split(':').map(Number);
                 const startTime = startHour + startMin / 60;
                 const endTime = endHour + endMin / 60;
                 dayHours += Math.max(0, endTime - startTime);
               });

              if (isPastDay) {
                workerUsedHours += dayHours;
              }
              workerAssignedHours += dayHours;
            }
          }
        });
      }

      // Aplicar la lógica de balance: comparar total de horas asignadas al usuario vs horas realizadas
      const totalRemainingHours = Math.max(0, monthlyHours - totalUsedHoursForUser);
      const totalExcessHours = Math.max(0, totalUsedHoursForUser - monthlyHours);
      
      // Determinar estado basado en el total de horas del usuario
      let status;
      if (Math.abs(totalRemainingHours) < 0.1) {
        status = 'perfect';
      } else if (totalRemainingHours > 0) {
        status = 'deficit';
      } else {
        status = 'excess';
      }

      const percentage = monthlyHours > 0 ? (totalUsedHoursForUser / monthlyHours) * 100 : 0;

      userBalances.push({
        userId,
        userName: user.name,
        userSurname: user.surname,
        userAddress: user.address,
        userPhone: user.phone,
        monthlyHours,
        assignedHours: Math.round(totalAssignedHoursForUser * 10) / 10,
        usedHours: Math.round(totalUsedHoursForUser * 10) / 10,
        remainingHours: Math.round(Math.max(0, monthlyHours - totalUsedHoursForUser) * 10) / 10,
        status: (totalAssignedHoursForUser - monthlyHours) > 0.1 ? 'excess' : (monthlyHours - totalAssignedHoursForUser) > 0.1 ? 'deficit' : 'perfect',
        percentage: monthlyHours > 0 ? Math.round((totalUsedHoursForUser / monthlyHours) * 1000) / 10 : 0,
        assignments: workerAssignments.filter(a => a.user_id === userId),
        holidayInfo: {
          workingDays,
          workingHours: Math.round(workingHours * 10) / 10,
          totalHolidays,
          holidayHours: Math.round(holidayHours * 10) / 10
        }
      });

      totalAssignedHours += totalAssignedHoursForUser;
      totalUsedHours += totalUsedHoursForUser;
    }

    const totalRemainingHours = totalAssignedHours - totalUsedHours;
    
    // Determinar estado general
    let overallStatus;
    if (Math.abs(totalRemainingHours) < 0.1) {
      overallStatus = 'perfect';
    } else if (totalRemainingHours > 0) {
      overallStatus = 'deficit';
    } else {
      overallStatus = 'excess';
    }

    return NextResponse.json({
      workerId,
      workerName: worker.name,
      month: parseInt(month),
      year: parseInt(year),
      userBalances,
      totalAssignedHours: Math.round(totalAssignedHours * 10) / 10,
      totalUsedHours: Math.round(totalUsedHours * 10) / 10,
      totalRemainingHours: Math.round(totalRemainingHours * 10) / 10,
      overallStatus
    });

  } catch (error: any) {
    console.error('Error en user-balance API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 