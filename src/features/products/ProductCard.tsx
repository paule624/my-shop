import type { Product } from '@/types/ecommerce'
import { Link } from 'react-router-dom'
import ProductImage from '@/features/products/ProductImage'

// Card image width per breakpoint, mirrors .app-shell / .shop-layout / .product-grid in App.css
const CARD_IMAGE_SIZES = '(max-width: 390px) calc(100vw - 26px), (max-width: 720px) calc(50vw - 25px), (max-width: 1000px) calc(50vw - 174px), 460px'

type ProductCardProps = {
  product: Product
  onAddToCart: (productId: string) => void
  priority?: boolean
}

function ProductCard({ product, onAddToCart, priority = false }: ProductCardProps) {
  return (
    <article className="product-card">
      {/* Redundant with the title link below: kept clickable for the mouse, but removed from
          the tab order and the accessibility tree (one link per card for keyboard / screen readers) */}
      <Link className="product-image-link" to={`/products/${product.slug}`} aria-hidden="true" tabIndex={-1}>
        <div className="product-image-wrap">
          {product.image_url && (
            <ProductImage src={product.image_url} alt={product.image_alt ?? product.name} sizes={CARD_IMAGE_SIZES} priority={priority} />
          )}
          {product.badge && <span className="product-badge">{product.badge}</span>}
          {product.category && <span className="product-category">{product.category}</span>}
        </div>
      </Link>
      <div className="product-details">
        <div className="product-title-row">
          <h3><Link className="product-title-link" to={`/products/${product.slug}`}>{product.name}</Link></h3>
          <span className="product-price">{product.price} €</span>
        </div>
        {product.description && <p>{product.description}</p>}
        <div className="product-actions">
          <span className={product.in_stock ? 'stock-status' : 'stock-status is-out'}>
            <span aria-hidden="true" />
            {product.in_stock ? 'En stock' : 'Épuisé'}
          </span>
          <button
            className="add-button"
            type="button"
            disabled={!product.in_stock}
            onClick={() => onAddToCart(product.id)}
          >
            Ajouter au panier
            <span aria-hidden="true">＋</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
