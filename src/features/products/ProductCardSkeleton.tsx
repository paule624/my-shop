// Loading placeholder mirroring ProductCard's structure and classes, so the grid
// reserves its final height while products load (prevents layout shift / CLS).
// Placeholder text is rendered transparent: it only drives the line heights.
function ProductCardSkeleton() {
  return (
    <div className="product-card product-card-skeleton" aria-hidden="true">
      <div className="product-image-wrap" />
      <div className="product-details">
        <div className="product-title-row">
          <h3><span className="skeleton-text">Nom du produit</span></h3>
          <span className="product-price"><span className="skeleton-text">00 €</span></span>
        </div>
        <p><span className="skeleton-text">Une courte description du produit sur deux lignes.</span></p>
        <div className="product-actions">
          <span className="stock-status"><span className="skeleton-text">En stock</span></span>
          <span className="add-button">Ajouter au panier<span>＋</span></span>
        </div>
      </div>
    </div>
  )
}

export default ProductCardSkeleton
