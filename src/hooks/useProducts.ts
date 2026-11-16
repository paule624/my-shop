import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { compressImage } from '@/lib/images'
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

export const PRODUCT_SORTS = {
  name: { label: 'Nom (A → Z)', column: 'name', ascending: true },
  'price-asc': { label: 'Prix croissant', column: 'price', ascending: true },
  'price-desc': { label: 'Prix décroissant', column: 'price', ascending: false },
} as const
export type ProductSort = keyof typeof PRODUCT_SORTS
export const PRODUCTS_PAGE_SIZE = 4

type ProductPageParams = { sort: ProductSort; category: string | null; page: number }

// One page of the catalogue, sorted and filtered by the database (.order / .eq / .range):
// only PRODUCTS_PAGE_SIZE rows travel, whatever the catalogue size. count gives the number of pages.
export function useProductPage({ sort, category, page }: ProductPageParams) {
  return useQuery({
    // Every URL parameter is part of the key: each page / sort / filter combination has its own cache entry
    queryKey: ['products', 'page', { sort, category, page }],
    queryFn: async () => {
      const { column, ascending } = PRODUCT_SORTS[sort]
      let query = supabase.from('products').select('*', { count: 'exact' }).order(column, { ascending })
      // Tie-breaker for equal prices, so a product never appears on two pages
      if (column !== 'name') query = query.order('name')
      if (category) query = query.eq('category', category)
      const from = (page - 1) * PRODUCTS_PAGE_SIZE
      const { data, error, count } = await query.range(from, from + PRODUCTS_PAGE_SIZE - 1)
      // PGRST103: page beyond the last one (e.g. edited URL). Not an error for the visitor: an empty page
      if (error?.code === 'PGRST103') return { products: [] as Product[], count: 0 }
      if (error) throw new Error(error.message)
      return { products: data as Product[], count: count ?? 0 }
    },
    // Keeps the current page displayed while the next one loads: no skeleton flash, no layout shift
    placeholderData: keepPreviousData,
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
    mutationFn: async ({ id, values, imageFile }: { id?: string; values: CreateProductInput; imageFile?: File }) => {
      // A chosen file replaces the image URL: compressed, uploaded to Storage, then its public URL is saved
      const row = imageFile ? { ...values, image_url: await uploadProductImage(imageFile) } : values
      const request = id
        ? supabase.from('products').update(row).eq('id', id).select()
        : supabase.from('products').insert(row).select()
      const { data, error } = await request
      if (error) throw new Error(error.message)
      if (data.length === 0) throw new Error('Aucune ligne enregistrée : droits insuffisants.')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

// Uploads to the public product-images bucket (supabase/06-storage.sql: admin-only insert policy).
// Unique name: never overwrites another product's image, and the URL can be cached forever.
async function uploadProductImage(file: File): Promise<string> {
  const image = await compressImage(file)
  const path = `${crypto.randomUUID()}.${image.type === 'image/webp' ? 'webp' : 'jpg'}`
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, image, { contentType: image.type, cacheControl: '31536000' })
  if (error) throw new Error(error.message)
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
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
