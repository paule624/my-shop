import type { ChangeEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CartPanel from '@/components/CartPanel'
import Pagination from '@/components/Pagination'
import {
  PRODUCT_SORTS,
  PRODUCTS_PAGE_SIZE,
  pageHref,
  parseCatalogParams,
  withFilter,
} from '@/features/products/catalogParams'
import ProductList from '@/features/products/ProductList'
import { useProductPage, useProducts } from '@/hooks/useProducts'

function ProductsPage() {
  // Sort, filter and page live in the URL ("URL drawer"): shareable, bookmarkable, back button friendly
  const [searchParams, setSearchParams] = useSearchParams()
  const { sort, category, page } = parseCatalogParams(searchParams)

  const productPage = useProductPage({ sort, category, page })
  // Category options from the cached catalogue (already loaded for the cart panel)
  const { data: allProducts = [] } = useProducts()
  const categories = [...new Set(allProducts.map((product) => product.category).filter((value) => value !== null))].sort()
  const totalPages = Math.ceil((productPage.data?.count ?? 0) / PRODUCTS_PAGE_SIZE)

  function updateFilter(key: 'sort' | 'category') {
    return (event: ChangeEvent<HTMLSelectElement>) => setSearchParams((current) => withFilter(current, key, event.target.value))
  }

  const hrefFor = (target: number) => pageHref(searchParams, target)

  return (
    <main className="products-page">
      <section className="intro-band products-intro">
        <div className="intro-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> La sélection du studio</p>
          <h1>Nos <em>essentiels.</em></h1>
          <p className="intro-description">Des objets utiles, choisis pour durer et accompagner le quotidien.</p>
        </div>
      </section>
      <div className="shop-layout">
        <section className="catalog-section" aria-labelledby="products-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">La boutique</p>
              <h2 id="products-title">Tous les produits</h2>
            </div>
            <div className="catalog-filters">
              <label htmlFor="filter-category">Catégorie</label>
              <select id="filter-category" value={category ?? ''} onChange={updateFilter('category')}>
                <option value="">Toutes</option>
                {categories.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <label htmlFor="filter-sort">Trier par</label>
              <select id="filter-sort" value={sort} onChange={updateFilter('sort')}>
                {Object.entries(PRODUCT_SORTS).map(([value, option]) => (
                  <option key={value} value={value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          <ProductList
            status={productPage.status}
            products={productPage.data?.products}
            errorMessage={productPage.error?.message}
            skeletonCount={PRODUCTS_PAGE_SIZE}
          />
          <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
          {page > 1 && productPage.data?.products.length === 0 && (
            <Link className="add-button" to={hrefFor(1)}>Revenir à la première page</Link>
          )}
        </section>
        <CartPanel />
      </div>
    </main>
  )
}

export default ProductsPage
