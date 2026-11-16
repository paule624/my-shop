import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { useCartStore } from '@/features/cart/store'
import { supabase } from '@/lib/supabase'
import type { CartLine } from '@/types/ecommerce'
import type { AccountOrder, AdminOrder } from '@/types/orders'

// Signed-in user's orders, newest first, with their lines (nested select through the foreign keys)
export function useMyOrders() {
  const { session } = useAuth()
  const userId = session?.user.id

  return useQuery({
    // userId in the key = one cache entry per user, so a new sign-in never shows the previous user's cache
    queryKey: ['orders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, created_at, order_items(quantity, products(name, price))')
        // Not a security filter (the "read own orders" policy already restricts a customer to their rows).
        // Needed for the admin, whose "admin reads orders" policy returns every order: "my" orders stay mine.
        .eq('user_id', userId!)
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

// Admin: every order with its customer's email. Two requests in parallel joined here, because orders
// reference auth.users (not profiles), so PostgREST cannot embed the email. The admin policies allow both.
export function useAllOrders() {
  return useQuery({
    queryKey: ['orders', 'all'],
    queryFn: async () => {
      const [orders, profiles] = await Promise.all([
        supabase
          .from('orders')
          .select('id, user_id, status, created_at, order_items(quantity, products(name, price))')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, email'),
      ])
      if (orders.error) throw new Error(orders.error.message)
      if (profiles.error) throw new Error(profiles.error.message)
      const emailById = new Map(profiles.data.map((profile) => [profile.id, profile.email as string | null]))
      return (orders.data as unknown as Omit<AdminOrder, 'email'>[]).map((order) => ({
        ...order,
        email: order.user_id ? emailById.get(order.user_id) ?? null : null,
      }))
    },
  })
}
