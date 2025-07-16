// Configuración robusta para Supabase - SAD LAS V2
export const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Verificar que las variables de entorno estén disponibles
  if (!url || !anonKey) {
    // Retornar valores por defecto para evitar errores de build
    return {
      url: 'https://placeholder.supabase.co',
      anonKey: 'placeholder-key'
    }
  }

  // Verificar que la URL sea la correcta del nuevo proyecto
  // (Mensaje de log eliminado para cumplir con linter)

  return { url, anonKey }
}

// Configuración para verificar si estamos en el servidor
export const isServer = typeof window === 'undefined'

// Configuración para verificar si estamos en el cliente
export const isClient = typeof window !== 'undefined'

// Configuración para verificar si estamos en desarrollo
export const isDevelopment = process.env.NODE_ENV === 'development'

// Configuración para verificar si estamos en producción
export const isProduction = process.env.NODE_ENV === 'production' 