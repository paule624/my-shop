import { Link } from 'react-router-dom'

type SiteHeaderProps = {
  activePage: 'home' | 'products' | 'orders' | null
  cartCount: number
}

function SiteHeader({ activePage, cartCount }: SiteHeaderProps) {
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
    </header>
  )
}

export default SiteHeader
