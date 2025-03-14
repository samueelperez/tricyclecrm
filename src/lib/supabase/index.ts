import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Cliente para uso en el navegador (componentes cliente)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Función para obtener un cliente de Supabase en componentes de servidor
export function getServerSupabaseClient() {
  return createServerComponentClient({ cookies });
} 