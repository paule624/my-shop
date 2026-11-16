import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/ecommerce'

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
