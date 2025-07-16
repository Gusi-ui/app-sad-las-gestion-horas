import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from './supabase-config'

export function createClient() {
  const config = getSupabaseConfig()
  
  // Solo crear el cliente si las variables de entorno están configuradas
  if (config.url === 'https://placeholder.supabase.co') {
    return null
  }
  
  return createBrowserClient(config.url, config.anonKey)
}

export const supabase = createClient() 