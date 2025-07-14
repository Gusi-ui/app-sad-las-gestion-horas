import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  const worker_id = searchParams.get("worker_id");
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
  }

  let query = supabase.from("monthly_balances").select("*");

  if (user_id) query = query.eq("user_id", user_id);
  if (year) query = query.eq("year", year);
  if (month) query = query.eq("month", month);

  // Si se filtra por trabajadora, buscar todos los usuarios asignados a esa trabajadora
  if (worker_id) {
    const { data: assignments, error } = await supabase
      .from("assignments")
      .select("user_id")
      .eq("worker_id", worker_id)
      .eq("status", "active");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const userIds = assignments.map(a => a.user_id);
    if (userIds.length > 0) {
      query = query.in("user_id", userIds);
    } else {
      // Si la trabajadora no tiene usuarios asignados, devolver vacío
      return NextResponse.json({ balances: [] });
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ balances: data });
} 