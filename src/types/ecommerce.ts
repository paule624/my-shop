// Mirrors a row of the Supabase `products` table (snake_case columns, nullable columns as `| null`)
export interface Product {
  id: string
  // URL segment (/products/:slug), unique
  slug: string
  name: string
  price: number
  in_stock: boolean
  category: string | null
  description: string | null
  image_url: string | null
  // Describes what the photo actually shows (alt text); falls back to the product name
  image_alt: string | null
  badge: string | null
}

export type CartLine = { productId: string; quantity: number }

export function describe(line: CartLine | null): string {
  if (line === null) {
    return 'Panier vide'
  }
  return `${line.quantity} article(s)`
}

export function firstItem<T>(items: T[]): T | undefined {
  return items[0]
}

// Use this type for the compact product cards in the catalogue.
export type ProductPreview = Pick<Product, 'id' | 'name' | 'price'>

// Use this type for the product creation form.
export type CreateProductInput = Omit<Product, 'id'>

// Use this type for the product editing form.
export type UpdateProductInput = Partial<CreateProductInput>