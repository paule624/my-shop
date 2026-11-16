import { useAuth } from '@/features/auth/AuthContext'

// Protected by <ProtectedRoute> in App: a session always exists here
function AccountPage() {
  const { session } = useAuth()

  return (
    <main className="account-page">
      <section className="orders-intro">
        <p className="eyebrow"><span className="eyebrow-dot" /> Votre espace</p>
        <h1>Bonjour<em>.</em></h1>
        <p>Vous êtes connecté avec {session?.user.email}.</p>
      </section>
    </main>
  )
}

export default AccountPage
