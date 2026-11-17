import { describe, expect, it } from 'vitest'
import { pageHref, parseCatalogParams, withFilter } from './catalogParams'

describe('parseCatalogParams', () => {
  it("donne les valeurs par défaut quand l'URL est vide", () => {
    expect(parseCatalogParams(new URLSearchParams(''))).toEqual({ sort: 'name', category: null, page: 1 })
  })

  it("lit le tri, la catégorie et la page portés par l'URL", () => {
    const params = new URLSearchParams('sort=price-desc&category=Textile&page=2')

    expect(parseCatalogParams(params)).toEqual({ sort: 'price-desc', category: 'Textile', page: 2 })
  })

  it('résiste à une URL bricolée : tri inconnu et pages invalides', () => {
    // An edited or old link must never break the page: unknown values fall back to the defaults
    const read = (query: string) => parseCatalogParams(new URLSearchParams(query))

    expect(read('sort=drop-table').sort).toBe('name')
    expect(read('page=abc').page).toBe(1)
    expect(read('page=0').page).toBe(1)
    expect(read('page=-3').page).toBe(1)
    expect(read('page=2.7').page).toBe(2)
  })
})

describe('withFilter', () => {
  it('change un filtre et revient à la page 1', () => {
    const current = new URLSearchParams('category=Textile&page=3')

    const next = withFilter(current, 'sort', 'price-asc')

    expect(next.toString()).toBe('category=Textile&sort=price-asc')
  })

  it("retire le filtre de l'URL quand on choisit « Toutes »", () => {
    const next = withFilter(new URLSearchParams('category=Textile&sort=price-asc'), 'category', '')

    expect(next.toString()).toBe('sort=price-asc')
  })
})

describe('pageHref', () => {
  it('garde les filtres et change seulement la page', () => {
    expect(pageHref(new URLSearchParams('sort=price-desc'), 2)).toBe('?sort=price-desc&page=2')
  })

  it("n'écrit pas page=1 : l'URL de la première page reste /products", () => {
    expect(pageHref(new URLSearchParams('page=2'), 1)).toBe('/products')
  })
})
