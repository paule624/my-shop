import { describe, expect, it } from 'vitest'
import { applyAction, computeCartTotal, type Cart } from './cart'

describe('applyAction', () => {
  it('ajoute une ligne à un panier vide', () => {
    // Arrange
    const cart: Cart = {}
    // Act
    const next = applyAction(cart, { type: 'addToCart', productId: 'lampe', quantity: 1 })
    // Assert
    expect(next).toEqual({ lampe: { productId: 'lampe', quantity: 1 } })
  })

  it('cumule la quantité quand le produit est déjà dans le panier', () => {
    const cart: Cart = { lampe: { productId: 'lampe', quantity: 2 } }

    const next = applyAction(cart, { type: 'addToCart', productId: 'lampe', quantity: 1 })

    // Still one line, not two
    expect(Object.values(next)).toHaveLength(1)
    expect(next.lampe?.quantity).toBe(3)
  })

  it("ignore un ajout de quantité 0 (pas de ligne fantôme à 0 article)", () => {
    const cart: Cart = {}

    const next = applyAction(cart, { type: 'addToCart', productId: 'lampe', quantity: 0 })

    expect(next).toEqual({})
  })

  it('retire une ligne sans toucher aux autres', () => {
    const cart: Cart = {
      lampe: { productId: 'lampe', quantity: 1 },
      vase: { productId: 'vase', quantity: 2 },
    }

    const next = applyAction(cart, { type: 'removeFromCart', productId: 'lampe' })

    expect(next).toEqual({ vase: { productId: 'vase', quantity: 2 } })
  })

  it("ne modifie jamais le panier reçu (sinon Zustand ne voit pas le changement)", () => {
    const cart: Cart = { lampe: { productId: 'lampe', quantity: 1 } }

    const next = applyAction(cart, { type: 'addToCart', productId: 'lampe', quantity: 1 })

    // A new object is returned, the previous state is intact
    expect(next).not.toBe(cart)
    expect(cart.lampe?.quantity).toBe(1)
  })
})

describe('computeCartTotal', () => {
  // Hand-written catalogue: only the fields the function reads
  const products = [
    { id: 'lampe', price: 129 },
    { id: 'tasse', price: 24.9 },
  ]

  it('additionne prix × quantité de chaque ligne', () => {
    const lines = [
      { productId: 'lampe', quantity: 2 },
      { productId: 'tasse', quantity: 1 },
    ]

    const total = computeCartTotal(lines, products)

    expect(total).toBe(282.9)
  })

  it('retourne 0 pour un panier vide', () => {
    expect(computeCartTotal([], products)).toBe(0)
  })

  it('arrondit au centime (24,9 × 3 vaut 74,69999… en JavaScript)', () => {
    expect(computeCartTotal([{ productId: 'tasse', quantity: 3 }], products)).toBe(74.7)
  })

  it("ignore un produit qui n'est plus au catalogue (supprimé par l'admin)", () => {
    const lines = [
      { productId: 'lampe', quantity: 1 },
      { productId: 'supprime', quantity: 4 },
    ]

    expect(computeCartTotal(lines, products)).toBe(129)
  })
})
