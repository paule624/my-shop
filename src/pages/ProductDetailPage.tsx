import { Link, useNavigate, useParams } from 'react-router-dom'
import CartPanel from '@/components/CartPanel'
import ProductImage from '@/features/products/ProductImage'
import { useCartStore } from '@/features/cart/store'
import { useProduct } from '@/hooks/useProducts'

// Detail image width per breakpoint, mirrors .shop-layout and .product-detail-card (max 720px) in App.css
const DETAIL_IMAGE_SIZES = '(max-width: 720px) calc(100vw - 36px), (max-width: 1000px) calc(100vw - 328px), 720px'

function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const productResult = useProduct(slug)
  const addToCart = useCartStore((state) => state.addToCart)
  const product = productResult.data

  return (
    <main className="products-page">
      <section className="intro-band products-intro">
        <div className="intro-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> La sélection du studio</p>
          <h1>{product ? <>{product.name}<em>.</em></> : <>Fiche <em>produit.</em></>}</h1>
          <button
            className="add-button detail-back-button"
            type="button"
            onClick={() => navigate('/products')}
          >
            <span aria-hidden="true">←</span> Retour à la boutique
          </button>
        </div>
      </section>
      <div className="shop-layout">
        <section className="catalog-section" aria-live="polite">
          {slug && productResult.isPending ? (
            <p className="fetch-message" role="status">Chargement du produit…</p>
          ) : productResult.isError ? (
            <p className="fetch-message error-message" role="alert">{productResult.error.message}</p>
          ) : !slug || !product ? (
            <div className="fetch-message">
              <p>{!slug ? 'Identifiant de produit manquant.' : `Aucun produit avec l’identifiant « ${slug} ».`}</p>
              <Link className="add-button" to="/products">Retour aux produits</Link>
            </div>
          ) : (
            <article className="product-detail-card">
              <div className="product-image-wrap">
                {product.image_url && (
                  <ProductImage src={product.image_url} alt={product.image_alt ?? product.name} sizes={DETAIL_IMAGE_SIZES} priority />
                )}
                {product.badge && <span className="product-badge">{product.badge}</span>}
                {product.category && <span className="product-category">{product.category}</span>}
              </div>
              <div className="product-details">
                <div className="product-title-row">
                  <h2>{product.name}</h2>
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
                    onClick={() => addToCart(product.id)}
                  >
                    Ajouter au panier <span aria-hidden="true">＋</span>
                  </button>
                </div>
              </div>
            </article>
          )}
        </section>
        <CartPanel />
      </div>
    </main>
  )
}

export default ProductDetailPage
