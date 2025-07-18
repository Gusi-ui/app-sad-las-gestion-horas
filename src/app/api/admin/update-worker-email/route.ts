import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseClient()
  
  const body = await req.json()
  const { userId, newEmail } = body

  if (!userId || !newEmail) {
    return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })
  }

  // 1. Actualizar email en Supabase Auth
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, { email: newEmail })
  if (authError) {
    return NextResponse.json({ error: authError.message || 'Error actualizando email en Auth' }, { status: 500 })
  }

  // 2. Actualizar email en worker_profiles
  const { error: profileError } = await supabase
    .from('worker_profiles')
    .update({ email: newEmail })
    .eq('id', userId)

  if (profileError) {
    return NextResponse.json({ error: profileError.message || 'Error actualizando email en perfil' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
} 