import { createClient } from '@supabase/supabase-js'

// Public client: the anon key only grants what the RLS policies allow.
// Never put the service_role key here, it bypasses RLS and would ship in the bundle.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
