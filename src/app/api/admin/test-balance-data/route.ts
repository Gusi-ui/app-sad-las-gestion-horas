import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!userId || !month || !year) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: userId, month, year' },
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

    // Obtener todas las asignaciones del usuario (no solo las de una trabajadora específica)
    // Temporalmente sin worker_type hasta que se ejecute la migración
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        workers:worker_id (
          id,
          name,
          surname
        ),
        users:user_id (
          id,
          name,
          surname,
          monthly_hours
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return NextResponse.json(
        { error: 'Error al obtener las asignaciones' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      assignments: assignments || [],
      success: true
    });

  } catch (error) {
    console.error('Error in test-balance-data API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 