import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { calculateMonthlyBalance, PlanningDay } from "@/lib/calculateMonthlyBalance";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planning, assigned_hours, user_id, worker_id, month, year } = body;

    if (!planning || !assigned_hours || !user_id || !worker_id || !month || !year) {
      return NextResponse.json({ error: "Faltan parámetros obligatorios" }, { status: 400 });
    }

    // Calcular el balance mensual
    const balanceResult = calculateMonthlyBalance(planning as PlanningDay[], assigned_hours);

    // Guardar o actualizar el balance en la tabla monthly_balances
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase no está configurado en el servidor" }, { status: 500 });
    }
    // Preparar los datos del balance
    const balanceData: any = {
      user_id,
      worker_id,
      month,
      year,
      assigned_hours: balanceResult.assigned_hours,
      scheduled_hours: balanceResult.scheduled_hours,
      balance: balanceResult.balance,
      status: balanceResult.status,
      message: balanceResult.message,
      planning: balanceResult.planning,
    };

    // Añadir holiday_info solo si está disponible
    if (balanceResult.holidayInfo) {
      balanceData.holiday_info = balanceResult.holidayInfo;
    }

    const { data, error } = await supabase
      .from("monthly_balances")
      .upsert([balanceData], { onConflict: "user_id,worker_id,month,year" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ balance: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
} 