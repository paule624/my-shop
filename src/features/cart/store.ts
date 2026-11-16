import { create } from 'zustand'
import { applyAction, type Cart } from '@/types/ecommerce'

type CartState = {
  cart: Cart
  addToCart: (productId: string) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
}

// Global client state: read by the header, product cards, cart panel and checkout without going through App props.
// Each component subscribes to the slice it needs (selector) and re-renders only when that slice changes.
// The cart logic itself stays in the pure applyAction reducer.
export const useCartStore = create<CartState>()((set) => ({
  cart: {},
  addToCart: (productId) =>
    set((state) => ({ cart: applyAction(state.cart, { type: 'addToCart', productId, quantity: 1 }) })),
  removeFromCart: (productId) =>
    set((state) => ({ cart: applyAction(state.cart, { type: 'removeFromCart', productId }) })),
  clearCart: () => set((state) => ({ cart: applyAction(state.cart, { type: 'clearCart' }) })),
}))

// Total quantity. The selector returns a number: subscribers re-render only when the count changes
export const selectItemCount = (state: CartState) =>
  Object.values(state.cart).reduce((total, line) => total + line.quantity, 0)
