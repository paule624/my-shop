import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// What the DATABASE refuses, whatever the front-end does: the policies of supabase/03-*.sql to 06-*.sql,
// tested with the public anon key only (exactly what a visitor gets from the browser's JavaScript).
const env = process.env
const configured = [env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, env.E2E_EMAIL, env.E2E_PASSWORD, env.E2E_ADMIN_EMAIL, env.E2E_ADMIN_PASSWORD].every(Boolean)

// One client per identity, like one browser per person
const newClient = () =>
  createClient(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })

async function signIn(email: string, password: string) {
  const client = newClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`${email}: ${error.message}`)
  return { client, userId: data.user.id }
}

type Identity = Awaited<ReturnType<typeof signIn>>

describe.skipIf(!configured)('sécurité de la base (RLS)', () => {
  const anon = newClient()
  let customer: Identity
  let admin: Identity
  // Throwaway product created by the admin: the only target of forbidden writes, so a broken policy
  // could never damage the real catalogue. Not in stock: nobody can buy it while it exists.
  let sandbox: { id: string; price: number }
  // An order that does NOT belong to the customer (the admin account's own order)
  let foreignOrderId: string
  // A real product that can be bought: refusals must come from the policies, not from the stock check
  let inStockId: string

  beforeAll(async () => {
    customer = await signIn(env.E2E_EMAIL!, env.E2E_PASSWORD!)
    admin = await signIn(env.E2E_ADMIN_EMAIL!, env.E2E_ADMIN_PASSWORD!)

    const created = await admin.client
      .from('products')
      .insert({ slug: `rls-test-${Date.now()}`, name: 'Produit test RLS', price: 10, in_stock: false })
      .select('id, price')
      .single()
    if (created.error) throw new Error(created.error.message)
    sandbox = created.data

    const product = await anon.from('products').select('id').eq('in_stock', true).limit(1).single()
    if (product.error) throw new Error(product.error.message)
    inStockId = product.data.id

    // Reuses the admin's order if one exists, otherwise places one (once, then reused by later runs)
    const own = await admin.client.from('orders').select('id').eq('user_id', admin.userId).limit(1)
    if (own.error) throw new Error(own.error.message)
    if (own.data[0]) {
      foreignOrderId = own.data[0].id
    } else {
      const placed = await admin.client.rpc('place_order', { items: [{ product_id: inStockId, quantity: 1 }] })
      if (placed.error) throw new Error(placed.error.message)
      foreignOrderId = placed.data as string
    }
  })

  afterAll(async () => {
    if (sandbox) await admin.client.from('products').delete().eq('id', sandbox.id)
    await Promise.all([customer?.client.auth.signOut(), admin?.client.auth.signOut()])
  })

  describe('visiteur anonyme', () => {
    it('lit le catalogue (contrôle : la connexion à la base fonctionne)', async () => {
      const { data, error } = await anon.from('products').select('id')
      expect(error).toBeNull()
      expect(data!.length).toBeGreaterThan(0)
    })

    it('ne lit aucune commande', async () => {
      const { data } = await anon.from('orders').select('id')
      expect(data).toEqual([])
    })

    it('ne peut pas créer de produit', async () => {
      const { error } = await anon.from('products').insert({ slug: 'rls-hack-anon', name: 'Hack', price: 1 })
      expect(error?.code).toBe('42501')
    })

    it('ne peut pas commander', async () => {
      // In-stock product: the call goes past the stock check, so only the order policies can refuse it
      const { error } = await anon.rpc('place_order', { items: [{ product_id: inStockId, quantity: 1 }] })
      expect(error?.code).toBe('42501')
    })
  })

  describe('client connecté (points de contrôle 3 et 4)', () => {
    it('ne lit que ses propres commandes', async () => {
      const { data } = await customer.client.from('orders').select('id, user_id')
      // Control: he does see orders, so "no foreign order" below is not just an empty result
      expect(data!.length).toBeGreaterThan(0)
      expect(data!.every((order) => order.user_id === customer.userId)).toBe(true)
    })

    it("ne lit pas la commande d'un autre compte, même avec son id", async () => {
      const { data } = await customer.client.from('orders').select('id').eq('id', foreignOrderId)
      expect(data).toEqual([])
    })

    it("ne lit pas les lignes de la commande d'un autre compte", async () => {
      const { data } = await customer.client.from('order_items').select('id').eq('order_id', foreignOrderId)
      expect(data).toEqual([])
    })

    it("ne peut pas créer une commande au nom d'un autre compte", async () => {
      const { error } = await customer.client.from('orders').insert({ user_id: admin.userId })
      expect(error?.code).toBe('42501')
    })

    it('ne peut pas créer une commande déjà payée', async () => {
      const { error } = await customer.client.from('orders').insert({ user_id: customer.userId, status: 'paid' })
      expect(error?.code).toBe('42501')
    })

    it('ne peut pas créer de produit', async () => {
      const { error } = await customer.client.from('products').insert({ slug: 'rls-hack-customer', name: 'Hack', price: 1 })
      expect(error?.code).toBe('42501')
    })

    it('ne peut ni modifier ni supprimer un produit : 0 ligne touchée, produit intact', async () => {
      // A refused update/delete is not an error for PostgREST: it touches 0 rows
      const updated = await customer.client.from('products').update({ price: 1 }).eq('id', sandbox.id).select()
      const deleted = await customer.client.from('products').delete().eq('id', sandbox.id).select()
      expect(updated.data).toEqual([])
      expect(deleted.data).toEqual([])

      const check = await admin.client.from('products').select('price').eq('id', sandbox.id).single()
      expect(check.data?.price).toBe(sandbox.price)
    })

    it('ne lit que son propre profil', async () => {
      const { data } = await customer.client.from('profiles').select('id, role')
      expect(data).toEqual([{ id: customer.userId, role: 'user' }])
    })

    it('ne peut pas modifier son profil (donc pas se nommer admin)', async () => {
      // Writes the CURRENT value ("user"): if an update policy ever appeared, the returned row reveals it
      // without granting anything (writing "admin" would really promote the account).
      const { data } = await customer.client.from('profiles').update({ role: 'user' }).eq('id', customer.userId).select()
      expect(data).toEqual([])
    })

    it("ne peut pas envoyer d'image dans le stockage des produits", async () => {
      const image = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' })
      const { error } = await customer.client.storage.from('product-images').upload(`rls-test-${Date.now()}.png`, image)
      expect(error?.message).toMatch(/row-level security/)
    })
  })

  describe('admin (contrôles : ses droits fonctionnent)', () => {
    it('lit les commandes de tous les comptes', async () => {
      const { data } = await admin.client.from('orders').select('user_id')
      // At least the customer's orders AND the admin's own: a customer would only see one account
      const accounts = new Set(data!.map((order) => order.user_id))
      expect(accounts.has(customer.userId) && accounts.has(admin.userId)).toBe(true)
    })

    it('peut modifier un produit', async () => {
      const { data } = await admin.client.from('products').update({ price: 12 }).eq('id', sandbox.id).select('price')
      expect(data).toEqual([{ price: 12 }])
      sandbox.price = 12
    })
  })
})
