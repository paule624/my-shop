import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { useCartStore } from '@/features/cart/store'
import { supabase } from '@/lib/supabase'
import type { CartLine } from '@/types/ecommerce'
import type { AccountOrder } from '@/types/orders'

// Signed-in user's orders, newest first, with their lines (nested select through the foreign keys)
export function useMyOrders() {
  const { session } = useAuth()
  const userId = session?.user.id

  return useQuery({
    // userId in the key = one cache entry per user, so a new sign-in never shows the previous user's cache.
    // It is not a filter: the query has no user_id condition, the "read own orders" policy does the filtering.
    queryKey: ['orders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, created_at, order_items(quantity, products(name, price))')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      // Without generated DB types, supabase-js cannot know products is many-to-one and types it as an array;
      // PostgREST actually returns a single object. Hence the cast through unknown.
      return data as unknown as AccountOrder[]
    },
    enabled: Boolean(userId),
  })
}

// Creates the order then its lines. Two inserts, not atomic (accepted TP simplification):
// if the second one fails, an empty order remains.
export function usePlaceOrder() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const clearCart = useCartStore((state) => state.clearCart)

  return useMutation({
    mutationFn: async (lines: CartLine[]) => {
      if (!session) throw new Error('Connectez-vous pour commander.')
      const { data: order, error } = await supabase
        .from('orders')
        .insert({ user_id: session.user.id })
        .select()
        .single()
      if (error) throw new Error(error.message)

      const { error: itemsError } = await supabase.from('order_items').insert(
        lines.map((line) => ({ order_id: order.id, product_id: line.productId, quantity: line.quantity })),
      )
      if (itemsError) throw new Error(itemsError.message)
    },
    onSuccess: () => {
      // Every write invalidates the keys it changes: the orders list refetches next time it is shown
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      clearCart()
    },
  })
}
