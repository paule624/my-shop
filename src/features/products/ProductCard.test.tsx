import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useCartStore } from '@/features/cart/store'
import ProductCard from '@/features/products/ProductCard'
import { renderWithProviders } from '@/test/utils'
import type { Product } from '@/types/ecommerce'

const lampe: Product = {
  id: 'p1',
  slug: 'lampe-aria',
  name: 'Lampe Aria',
  price: 129,
  in_stock: true,
  category: 'Lumière',
  description: 'Une lumière douce.',
  image_url: null,
  image_alt: null,
  badge: null,
}

describe('ProductCard', () => {
  // The Zustand store lives outside React: empty it, or a test inherits the previous test's cart
  beforeEach(() => useCartStore.getState().clearCart())

  it("affiche le produit et l'ajoute au panier", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductCard product={lampe} />)

    // What the user sees...
    expect(screen.getByRole('heading', { name: 'Lampe Aria' })).toBeInTheDocument()
    expect(screen.getByText('129 €')).toBeInTheDocument()
    // ...and what they can do, reached by role and accessible name, not by CSS class
    await user.click(screen.getByRole('button', { name: 'Ajouter au panier' }))

    // The effect, read from the store outside React
    expect(useCartStore.getState().cart).toEqual({ p1: { productId: 'p1', quantity: 1 } })
  })

  it("empêche d'ajouter un produit épuisé", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductCard product={{ ...lampe, in_stock: false }} />)

    expect(screen.getByText('Épuisé')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Ajouter au panier' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(useCartStore.getState().cart).toEqual({})
  })
})
