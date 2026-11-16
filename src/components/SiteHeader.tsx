import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { selectItemCount, useCartStore } from '@/features/cart/store'
import { supabase } from '@/lib/supabase'

type SiteHeaderProps = {
  activePage: 'home' | 'products' | 'orders' | 'account' | null
}

function SiteHeader({ activePage }: SiteHeaderProps) {
  const { session, booted } = useAuth()
  const cartCount = useCartStore(selectItemCount)

  return (
    <header className="topbar">
      <Link className="wordmark" to="/">
        <span className="wordmark-mark" aria-hidden="true">m.</span>
        maison moderne
      </Link>
      <nav className="main-nav" aria-label="Navigation principale">
        <Link className={`nav-link${activePage === 'home' ? ' is-active' : ''}`} to="/">
          Accueil
        </Link>
        <Link className={`nav-link${activePage === 'products' ? ' is-active' : ''}`} to="/products">
          Boutique
        </Link>
        <Link className={`nav-link${activePage === 'orders' ? ' is-active' : ''}`} to="/orders">
          Commandes
        </Link>
      </nav>
      <div className="topbar-actions">
        {/* Rendered once the stored session is read: a signed-in user never sees "Connexion" flash */}
        {booted && (session ? (
          <>
            <Link className={`nav-link account-link${activePage === 'account' ? ' is-active' : ''}`} to="/account">
              {/* Full email on desktop, short label on small screens (only one is displayed) */}
              <span className="account-email">{session.user.email}</span>
              <span className="account-short">Compte</span>
            </Link>
            <button className="nav-link" type="button" onClick={() => supabase.auth.signOut()}>
              Déconnexion
            </button>
          </>
        ) : (
          <Link className="nav-link" to="/login">Connexion</Link>
        ))}
        <Link
          className="cart-button"
          to={activePage === 'home' || activePage === 'products' ? '#basket' : '/#basket'}
        >
          {/* Accessible name comes from the content ("Panier 0 article(s)"), so it always contains
              the visible text (WCAG 2.5.3 label in name) instead of diverging through an aria-label */}
          <span>Panier</span>{' '}
          <span className="cart-count">{cartCount}</span>{' '}
          <span className="sr-only">article(s)</span>
        </Link>
      </div>
    </header>
  )
}

export default SiteHeader
