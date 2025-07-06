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
  let query = supabase.from("local_holidays").select("*").eq("year", year);
  if (month) query = query.eq("month", month);
  const { data, error } = await query.order("month").order("day");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ holidays: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, year, month, day, type } = body;
    if (!name || !year || !month || !day) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase.from("local_holidays").insert([
      { name, year, month, day, type: type || "local" }
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
  const { error } = await supabase.from("local_holidays").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 