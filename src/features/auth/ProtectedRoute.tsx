import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import PageLoader from '@/components/PageLoader'
import { useAuth } from '@/features/auth/AuthContext'

// Front-end guard only (comfort): the real protection is the RLS policies in the database
export function ProtectedRoute({ children }: PropsWithChildren) {
  const { session, booted } = useAuth()
  const location = useLocation()

  // Session not read yet: wait instead of redirecting a signed-in user to /login
  if (!booted) return <PageLoader />
  if (!session) {
    // Remember the requested page, /login sends the user back there once signed in
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
