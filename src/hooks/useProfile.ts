import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase } from '@/lib/supabase'

export type Profile = { id: string; email: string | null; role: 'user' | 'admin' }

// Signed-in user's profile (role). "read own profile" policy: only this user's row is readable.
export function useProfile() {
  const { session } = useAuth()
  const userId = session?.user.id

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, email, role').eq('id', userId!).maybeSingle()
      if (error) throw new Error(error.message)
      return data as Profile | null
    },
    enabled: Boolean(userId),
  })
}

// Convenience for UI decisions (nav link). Never a security check: the policies are.
export function useIsAdmin() {
  return useProfile().data?.role === 'admin'
}
