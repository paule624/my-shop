// Catalogue URL state (?sort=…&category=…&page=…): pure functions, tested in catalogParams.test.ts

export const PRODUCT_SORTS = {
  name: { label: 'Nom (A → Z)', column: 'name', ascending: true },
  'price-asc': { label: 'Prix croissant', column: 'price', ascending: true },
  'price-desc': { label: 'Prix décroissant', column: 'price', ascending: false },
} as const
export type ProductSort = keyof typeof PRODUCT_SORTS
export const PRODUCTS_PAGE_SIZE = 4

export type CatalogParams = { sort: ProductSort; category: string | null; page: number }

const isSort = (value: string | null): value is ProductSort => value !== null && value in PRODUCT_SORTS

// Reads the URL. Unknown or edited values fall back to the defaults instead of breaking the page.
export function parseCatalogParams(params: URLSearchParams): CatalogParams {
  const sort = params.get('sort')
  return {
    sort: isSort(sort) ? sort : 'name',
    category: params.get('category'),
    // NaN (text) and 0 become 1, decimals are truncated, negatives are clamped to 1
    page: Math.max(1, Math.floor(Number(params.get('page'))) || 1),
  }
}

// New URL after a sort / category change: back to page 1, an empty value removes the parameter
export function withFilter(params: URLSearchParams, key: 'sort' | 'category', value: string): URLSearchParams {
  const next = new URLSearchParams(params)
  if (value) next.set(key, value)
  else next.delete(key)
  next.delete('page')
  return next
}

// Link to a page of the catalogue, keeping the filters (page 1 is the URL without ?page)
export function pageHref(params: URLSearchParams, page: number): string {
  const next = new URLSearchParams(params)
  if (page === 1) next.delete('page')
  else next.set('page', String(page))
  const query = next.toString()
  return query ? `?${query}` : '/products'
}
