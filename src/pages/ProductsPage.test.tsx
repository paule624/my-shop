import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProductsPage from '@/pages/ProductsPage'
import { renderWithProviders } from '@/test/utils'

// Fake Supabase client, hand-written. The page chains from().select().order().eq().range() then awaits:
// each method records its call and returns the same object; awaiting it (then) resolves with the fixtures.
// The fake does not filter: filtering is the database's job. The test checks what the page ASKS for.
const { requests } = vi.hoisted(() => ({ requests: [] as string[] }))
vi.mock('@/lib/supabase', () => {
  const products = [
    { id: '1', slug: 'lampe-aria', name: 'Lampe Aria', price: 129, in_stock: true, category: 'Lumière', description: null, image_url: null, image_alt: null, badge: null },
    { id: '2', slug: 'plaid-nuage', name: 'Plaid Nuage', price: 89, in_stock: true, category: 'Textile', description: null, image_url: null, image_alt: null, badge: null },
  ]
  return {
    supabase: {
      from: () => {
        const calls: string[] = []
        const query = {
          select: () => query,
          order: (column: string, options?: { ascending: boolean }) => {
            calls.push(`order(${column}${options?.ascending === false ? ' desc' : ''})`)
            return query
          },
          eq: (column: string, value: string) => {
            calls.push(`eq(${column}, ${value})`)
            return query
          },
          range: (from: number, to: number) => {
            calls.push(`range(${from}, ${to})`)
            return query
          },
          then: (resolve: (result: unknown) => void) => {
            requests.push(calls.join(' '))
            resolve({ data: products, error: null, count: products.length })
          },
        }
        return query
      },
    },
  }
})

// Shows the current URL query string, to check what the page writes into it
function CurrentSearch() {
  return <output aria-label="URL">{useLocation().search}</output>
}

describe('ProductsPage', () => {
  beforeEach(() => {
    requests.length = 0
  })

  it("lit les filtres dans l'URL et les envoie à la base", async () => {
    renderWithProviders(<ProductsPage />, '/products?category=Textile&sort=price-desc&page=2')

    // The products returned are displayed
    expect(await screen.findByRole('heading', { name: 'Plaid Nuage' })).toBeInTheDocument()
    // The form shows the URL state
    expect(await screen.findByRole('option', { name: 'Textile' })).toBeInTheDocument()
    expect(screen.getByLabelText('Catégorie')).toHaveValue('Textile')
    expect(screen.getByLabelText('Trier par')).toHaveValue('price-desc')
    // The page request carries the filter, the sort and the page (2nd page of 4 = rows 4 to 7)
    expect(requests).toContain('order(price desc) order(name) eq(category, Textile) range(4, 7)')
  })

  it("changer le tri réécrit l'URL et revient à la page 1", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <ProductsPage />
        <CurrentSearch />
      </>,
      '/products?category=Textile&page=2',
    )
    await screen.findByRole('heading', { name: 'Plaid Nuage' })

    await user.selectOptions(screen.getByLabelText('Trier par'), 'price-asc')

    expect(screen.getByRole('status', { name: 'URL' })).toHaveTextContent('?category=Textile&sort=price-asc')
    expect(requests).toContain('order(price) order(name) eq(category, Textile) range(0, 3)')
  })
})
