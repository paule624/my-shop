import { lazy, Suspense } from 'react'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useFetch } from '@/hooks/useFetch'
import { useCart } from '@/hooks/useCart'
import HomePage from '@/pages/HomePage'
import ProductsPage from '@/pages/ProductsPage'
import type { Product } from '@/types/ecommerce'
import '@/App.css'

// Main landing routes (/ and /products) stay in the main bundle to avoid an extra request before their LCP.
// Secondary routes are split into their own chunks, downloaded only when visited.
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function App() {
  const { cart, itemCount, addToCart, removeFromCart, clearCart } = useCart()
  const { pathname } = useLocation()
  const productsResult = useFetch<Product[]>('/data/products.json')
  const products = productsResult.status === 'success' ? productsResult.data : []
  const pageProps = {
    cart,
    products,
    productsResult,
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
        : null

  return (
    <div className="app-shell">
      <SiteHeader
        activePage={activePage}
        cartCount={itemCount}
      />
      <Suspense
        fallback={(
          // Full-height placeholder keeps the footer below the fold while a route chunk loads (no layout shift)
          <main className="route-fallback">
            <p className="fetch-message" role="status">Chargement de la page…</p>
          </main>
        )}
      >
        <Routes>
          <Route path="/" element={<HomePage {...pageProps} />} />
          <Route path="/products" element={<ProductsPage {...pageProps} />} />
          <Route path="/products/:id" element={<ProductDetailPage {...pageProps} />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <SiteFooter />
    </div>
  )
}

export default App
