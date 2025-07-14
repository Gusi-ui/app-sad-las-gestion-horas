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
      .select('id, email')
      .eq('id', workerId)
      .eq('email', user.email)
      .single();

    if (workerError || !worker) {
      return NextResponse.json(
        { error: 'Trabajadora no encontrada o no autorizada' },
        { status: 403 }
      );
    }

    // Obtener los balances mensuales con información del usuario
    const { data: balances, error: balancesError } = await supabase
      .from('monthly_plans')
      .select(`
        *,
        users:user_id (
          name,
          surname,
          address
        )
      `)
      .eq('worker_id', workerId)
      .eq('month', parseInt(month))
      .eq('year', parseInt(year))
      .order('created_at', { ascending: false });

    if (balancesError) {
      console.error('Error fetching monthly balances:', balancesError);
      return NextResponse.json(
        { error: 'Error al obtener los balances mensuales' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      balances: balances || [],
      success: true
    });

  } catch (error) {
    console.error('Error in monthly balance API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 