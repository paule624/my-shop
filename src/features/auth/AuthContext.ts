import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export interface AuthValue {
  session: Session | null
  // Has the first session read (from local storage) finished?
  booted: boolean
}

// Context = value shared everywhere that rarely changes (sign in / sign out)
export const AuthContext = createContext<AuthValue>({ session: null, booted: false })

export const useAuth = () => useContext(AuthContext)
