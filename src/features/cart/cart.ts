import type { CartLine, Product } from '@/types/ecommerce'

// Cart logic: pure functions, no React, no store. Tested in cart.test.ts, used by the Zustand store.

export type CartAction =
  | { type: 'addToCart'; productId: string; quantity: number }
  | { type: 'removeFromCart'; productId: string }
  | { type: 'clearCart' }
  | { type: 'applyDiscount'; percent: number }

export type Cart = Record<string, CartLine>

export function applyAction(cart: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'addToCart': {
      // Nothing to add: same cart returned (no empty line, no re-render)
      if (action.quantity <= 0) return cart
      const existing = cart[action.productId]
      return {
        ...cart,
        [action.productId]: {
          productId: action.productId,
          quantity: (existing?.quantity ?? 0) + action.quantity,
        },
      }
    }
    case 'removeFromCart': {
      const nextCart = { ...cart }
      delete nextCart[action.productId]
      return nextCart
    }
    case 'clearCart': {
      return {}
    }
    case 'applyDiscount': {
      return cart
    }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

// Cart total from the catalogue prices. Lines whose product is no longer in the catalogue count for 0.
export function computeCartTotal(lines: CartLine[], products: Pick<Product, 'id' | 'price'>[]): number {
  const total = lines.reduce((sum, line) => {
    const product = products.find((candidate) => candidate.id === line.productId)
    return sum + (product ? product.price * line.quantity : 0)
  }, 0)
  // Floating point: 24.9 * 3 = 74.69999999999999. Rounded to the cent.
  return Math.round(total * 100) / 100
}
