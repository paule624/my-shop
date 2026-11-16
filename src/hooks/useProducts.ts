import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CreateProductInput, Product } from '@/types/ecommerce'

// Whole catalogue, shared through the React Query cache: every component calling it reuses one request
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select().order('name')
      if (error) throw new Error(error.message)
      return data as Product[]
    },
  })
}

// One product by its slug (the URL segment); resolves to null when no product matches
export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['products', { slug }],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select().eq('slug', slug!).maybeSingle()
      if (error) throw new Error(error.message)
      return data as Product | null
    },
    enabled: Boolean(slug),
  })
}

// Admin writes. Each one invalidates ['products'], which also covers ['products', { slug }] (prefix match).
// With RLS, a refused update/delete is not an error: it just affects 0 rows. `.select()` returns the
// affected rows, so an empty result is turned into a visible error instead of a silent no-op.
export function useSaveProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: CreateProductInput }) => {
      const request = id
        ? supabase.from('products').update(values).eq('id', id).select()
        : supabase.from('products').insert(values).select()
      const { data, error } = await request
      if (error) throw new Error(error.message)
      if (data.length === 0) throw new Error('Aucune ligne enregistrée : droits insuffisants.')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from('products').delete().eq('id', id).select()
      // A product already ordered cannot be deleted (order_items foreign key): Postgres error shown as is
      if (error) throw new Error(error.message)
      if (data.length === 0) throw new Error('Aucune ligne supprimée : droits insuffisants.')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
