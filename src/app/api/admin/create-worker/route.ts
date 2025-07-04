import { NextRequest, NextResponse } from 'next/server'

// Importa la librería de Supabase con la service role key
import { createClient } from '@supabase/supabase-js'

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

function generarPassword(longitud = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  let password = ''
  for (let i = 0; i < longitud; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    const body = await req.json()
    const { email, full_name, worker_type = 'regular' } = body

    if (!email || !full_name) {
      console.error('Faltan datos obligatorios', { email, full_name });
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })
    }

    const password = generarPassword()

    // 1. Crear usuario en Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    // console.log('Resultado createUser:', { userData, userError });

    if (userError || !userData?.user) {
      console.error('Error creando usuario en Auth:', userError);
      return NextResponse.json({ error: userError?.message || 'Error creando usuario en Auth' }, { status: 500 })
    }

    const userId = userData.user.id

    // 2. Eliminar perfil duplicado si existe
    await supabase.from('worker_profiles').delete().eq('id', userId)
    await supabase.from('workers').delete().eq('id', userId)

    // 3. Crear perfil en worker_profiles
    const { error: profileError } = await supabase.from('worker_profiles').insert({
      id: userId,
      email,
      full_name,
      worker_type,
      role: 'worker',
      created_at: new Date().toISOString()
    })
    // console.log('Resultado insert worker_profiles:', { profileError });

    if (profileError) {
      // Si falla el perfil, elimina el usuario creado en Auth para evitar inconsistencias
      await supabase.auth.admin.deleteUser(userId)
      console.error('Error creando perfil:', profileError);
      return NextResponse.json({ error: profileError.message || 'Error creando perfil' }, { status: 500 })
    }

    // 4. Crear registro en workers (solo con los datos básicos)
    const [name, ...surnameParts] = full_name.split(' ')
    const surname = surnameParts.join(' ')
    const { error: workersError } = await supabase.from('workers').insert({
      id: userId,
      name: name || '',
      surname: surname || '',
      email,
      is_active: true,
      hire_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    // console.log('Resultado insert workers:', { workersError });

    if (workersError) {
      // Si falla, elimina el usuario y el perfil para evitar inconsistencias
      await supabase.from('worker_profiles').delete().eq('id', userId)
      await supabase.auth.admin.deleteUser(userId)
      console.error('Error creando en workers:', workersError);
      return NextResponse.json({ error: workersError.message || 'Error creando en workers' }, { status: 500 })
    }

    // 5. Devuelve la contraseña generada para que la administración la comunique
    return NextResponse.json({ success: true, password })
  } catch (error) {
    console.error('Error en create-worker:', error, JSON.stringify(error));
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
} 