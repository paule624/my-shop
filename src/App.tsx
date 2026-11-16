import { lazy, Suspense } from 'react'
import PageLoader from '@/components/PageLoader'
import RouteAnnouncer from '@/components/RouteAnnouncer'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useCart } from '@/hooks/useCart'
import { useProducts } from '@/hooks/useProducts'
import HomePage from '@/pages/HomePage'
import ProductsPage from '@/pages/ProductsPage'
import '@/App.css'

// Main landing routes (/ and /products) stay in the main bundle to avoid an extra request before their LCP.
// Secondary routes are split into their own chunks, downloaded only when visited.
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const AuthPage = lazy(() => import('@/pages/AuthPage'))
const AccountPage = lazy(() => import('@/pages/AccountPage'))

// Human-readable page names, used for the tab title and the route change announcement
const pageTitles: Record<string, string> = {
  '/': 'Accueil',
  '/products': 'Boutique',
  '/orders': 'Commandes',
  '/login': 'Connexion',
  '/signup': 'Inscription',
  '/account': 'Mon compte',
}

function App() {
  const { cart, itemCount, addToCart, removeFromCart, clearCart } = useCart()
  const { pathname } = useLocation()
  // Only needed for the product name in the page title; shares the cached catalogue query
  const { data: products = [] } = useProducts()
  const pageProps = {
    cart,
    onAddToCart: addToCart,
    onRemoveFromCart: removeFromCart,
    onClearCart: clearCart,
  }
  const activePage = pathname === '/'
    ? 'home'
    : pathname.startsWith('/products')
      ? 'products'
      : pathname === '/orders'
        ? 'orders'
        : pathname === '/account'
          ? 'account'
          : null
  const productName = products.find((product) => pathname === `/products/${product.slug}`)?.name
  const pageTitle = pageTitles[pathname]
    ?? (pathname.startsWith('/products/') ? productName ?? 'Fiche produit' : 'Page introuvable')

  return (
    <div className="app-shell">
      <RouteAnnouncer title={pageTitle} />
      <SiteHeader
        activePage={activePage}
        cartCount={itemCount}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage {...pageProps} />} />
          <Route path="/products" element={<ProductsPage {...pageProps} />} />
          <Route path="/products/:slug" element={<ProductDetailPage {...pageProps} />} />
          <Route path="/orders" element={<OrdersPage />} />
          {/* key: switching between the two modes remounts the form (no leftover error message) */}
          <Route path="/login" element={<AuthPage key="login" mode="login" />} />
          <Route path="/signup" element={<AuthPage key="signup" mode="signup" />} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <SiteFooter />
    </div>
  )
}

export default App
