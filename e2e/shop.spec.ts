import { expect, test } from '@playwright/test'

// The journey that makes the shop worth something: find a product and put it in the cart.
// Real browser, real dev server, real Supabase catalogue.
test('un visiteur parcourt le catalogue et remplit son panier', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Boutique' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Nos essentiels.' })).toBeVisible()

  // First product that can be bought (a sold-out product has a disabled button)
  const card = page.getByRole('article').filter({ has: page.getByRole('button', { name: 'Ajouter au panier', disabled: false }) }).first()
  const productName = await card.getByRole('heading').innerText()
  await card.getByRole('button', { name: 'Ajouter au panier' }).click()

  // The header counter and the cart panel show the chosen product
  await expect(page.getByRole('link', { name: 'Panier 1 article(s)' })).toBeVisible()
  const cart = page.getByRole('complementary', { name: /Le panier/ })
  await expect(cart).toContainText(productName)
  await expect(cart).toContainText('Quantité : 1')
})
