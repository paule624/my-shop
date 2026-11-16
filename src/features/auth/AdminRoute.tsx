import type { PropsWithChildren } from 'react'
import PageLoader from '@/components/PageLoader'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useProfile } from '@/hooks/useProfile'

// Session check reused from ProtectedRoute, then role check on the profile.
// Front-end guard only: a non-admin who bypasses it still gets nothing, the RLS policies refuse.
export function AdminRoute({ children }: PropsWithChildren) {
  return (
    <ProtectedRoute>
      <RoleGate>{children}</RoleGate>
    </ProtectedRoute>
  )
}

function RoleGate({ children }: PropsWithChildren) {
  const profile = useProfile()

  if (profile.isPending) return <PageLoader />
  if (profile.data?.role !== 'admin') {
    return (
      <main className="not-found-page">
        <p className="eyebrow"><span className="eyebrow-dot" /> Erreur 403</p>
        <h1>Accès réservé.</h1>
        <p>Cette page est réservée aux administrateurs.</p>
      </main>
    )
  }
  return <>{children}</>
}
