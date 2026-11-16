import type { ReactNode } from 'react'
import type { Product } from '@/types/ecommerce'
import ProductCard from '@/features/products/ProductCard'
import ProductCardSkeleton from '@/features/products/ProductCardSkeleton'

type ProductListProps = {
  // State of the query that feeds the list (whole catalogue on the home page, one page on /products)
  status: 'pending' | 'error' | 'success'
  products: Product[] | undefined
  errorMessage?: string
  // Number of placeholder cards while loading: reserves the grid height (no layout shift)
  skeletonCount: number
}

function ProductList({ status, products, errorMessage, skeletonCount }: ProductListProps) {
  let content: ReactNode

  if (status === 'pending') {
    content = (
      <>
        <p className="sr-only" role="status">Chargement des produits…</p>
        {Array.from({ length: skeletonCount }, (_, index) => <ProductCardSkeleton key={index} />)}
      </>
    )
  } else if (status === 'error') {
    content = <p className="fetch-message error-message" role="alert">{errorMessage}</p>
  } else {
    content = products && products.length > 0
      ? products.map((product, index) => (
          // First card holds the LCP image: load it with high priority, lazy-load the rest
          <ProductCard key={product.id} product={product} priority={index === 0} />
        ))
      : <p className="fetch-message">Aucun produit à afficher pour le moment.</p>
  }

  return <div className="product-grid" aria-live="polite">{content}</div>
}

export default ProductList
