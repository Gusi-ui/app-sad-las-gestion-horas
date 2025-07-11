import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rutas que requieren autenticación
  if (!user) {
    // Rutas públicas que no requieren autenticación
    const publicPaths = [
      '/login',
      '/admin/login',
      '/worker/login',
      '/register',
      '/test-db',
      '/'
    ]
    
    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )
    
    if (!isPublicPath) {
      // Redirigir a login si no está autenticado
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Proteger rutas de admin (requieren rol de admin)
  if (user && request.nextUrl.pathname.startsWith('/admin/')) {
    // Verificar si el usuario es admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('id, is_active')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    if (!adminData) {
      // No es admin, redirigir a login
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  // Proteger rutas de worker (requieren rol de worker)
  if (user && request.nextUrl.pathname.startsWith('/worker/')) {
    // Verificar si el usuario es worker
    const { data: workerData } = await supabase
      .from('workers')
      .select('id, is_active')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    if (!workerData) {
      // No es worker, redirigir a login
      const url = request.nextUrl.clone()
      url.pathname = '/worker/login'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 