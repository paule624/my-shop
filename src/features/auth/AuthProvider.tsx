import { useEffect, useState, type PropsWithChildren } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthContext } from '@/features/auth/AuthContext'

// Kept apart from AuthContext.ts: React fast refresh needs .tsx files to export components only
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [booted, setBooted] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    // Initial read of the session stored by a previous visit
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setBooted(true)
    })
    // Then follow every change: sign in, sign out, token refresh, other tabs
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      // Signing out empties the server cache: no data of that account (orders, profile) survives in memory
      if (event === 'SIGNED_OUT') queryClient.clear()
    })
    return () => sub.subscription.unsubscribe()
  }, [queryClient])

  return <AuthContext.Provider value={{ session, booted }}>{children}</AuthContext.Provider>
}
