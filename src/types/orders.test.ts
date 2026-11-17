import { describe, expect, it } from 'vitest'
import { orderTotal, ordersTotal, type AccountOrder } from './orders'

// Builds an order from [price, quantity] pairs: only the fields the totals read matter
function order(...lines: [price: number, quantity: number][]): AccountOrder {
  return {
    id: 'o1',
    status: 'pending',
    created_at: '2026-11-17T10:00:00Z',
    order_items: lines.map(([price, quantity]) => ({ quantity, products: { name: 'Produit', price } })),
  }
}

describe('orderTotal', () => {
  it('additionne prix × quantité de chaque ligne', () => {
    expect(orderTotal(order([129, 2], [89, 1]))).toBe(347)
  })

  it('retourne 0 pour une commande sans ligne', () => {
    expect(orderTotal(order())).toBe(0)
  })

  it('arrondit au centime : 3 tasses à 24,90 € font 74,70 €, pas 74,69999…', () => {
    expect(orderTotal(order([24.9, 3]))).toBe(74.7)
  })
})

describe('ordersTotal (montant total affiché dans l’admin)', () => {
  it('additionne les commandes et arrondit au centime (0,10 + 0,20 vaut 0,30000000000000004 en JavaScript)', () => {
    expect(ordersTotal([order([0.1, 1]), order([0.2, 1])])).toBe(0.3)
  })
})
