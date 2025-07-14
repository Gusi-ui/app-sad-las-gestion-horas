import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;

  if (!year) {
    return NextResponse.json({ error: "Falta el parámetro year" }, { status: 400 });
  }

  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
  }
  
  // Construir el rango de fechas para el año y mes especificados
  const startDate = `${year}-${month ? month.toString().padStart(2, '0') : '01'}-01`;
  const endDate = month 
    ? `${year}-${month.toString().padStart(2, '0')}-31`
    : `${year}-12-31`;
  
  let query = supabase
    .from("holidays")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .eq("is_active", true);
    
  const { data, error } = await query.order("date");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ holidays: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, date, type, region, city } = body;
    if (!name || !date) {
      return NextResponse.json({ error: "Faltan campos obligatorios: name, date" }, { status: 400 });
    }
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }
    const { data, error } = await supabase.from("holidays").insert([
      { 
        name, 
        date, 
        type: type || "local",
        region: region || "Catalunya",
        city: city || "Mataró",
        is_active: true
      }
    ]).select().single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ holiday: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta el parámetro id" }, { status: 400 });
  }
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
  }
  const { error } = await supabase.from("holidays").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 