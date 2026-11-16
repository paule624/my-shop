import type { ReactNode } from 'react'
import { useProducts } from '@/hooks/useProducts'
import ProductCard from '@/features/products/ProductCard'
import ProductCardSkeleton from '@/features/products/ProductCardSkeleton'

// Matches the current catalogue size, so the full grid height is reserved while loading
const DEFAULT_SKELETON_COUNT = 6

type ProductListProps = {
  maxItems?: number
}

function ProductList({ maxItems }: ProductListProps) {
  // Reads the catalogue straight from the React Query cache (no prop drilling from App)
  const result = useProducts()
  let content: ReactNode

  switch (result.status) {
    case 'pending':
      content = (
        <>
          <p className="sr-only" role="status">Chargement des produits…</p>
          {Array.from({ length: maxItems ?? DEFAULT_SKELETON_COUNT }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </>
      )
      break
    case 'error':
      content = <p className="fetch-message error-message" role="alert">{result.error.message}</p>
      break
    case 'success': {
      const products = maxItems === undefined ? result.data : result.data.slice(0, maxItems)
      content = products.length > 0
        ? products.map((product, index) => (
            // First card holds the LCP image: load it with high priority, lazy-load the rest
            <ProductCard key={product.id} product={product} priority={index === 0} />
          ))
        : <p className="fetch-message">Aucun produit à afficher pour le moment.</p>
      break
    }
    default: {
      const _exhaustive: never = result
      content = _exhaustive
    }
  }

  return <div className="product-grid" aria-live="polite">{content}</div>
}

export default ProductList
