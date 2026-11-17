import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'

// Guards the séance 3 accessibility work: axe-core (the engine behind axe DevTools and Lighthouse's
// accessibility score) scans each page once its content is loaded. Same rule set as the audit: WCAG 2.1 A + AA.
const WCAG_21_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_21_AA).analyze()
  // Readable failure: rule, what it asks, and the faulty elements
  expect(violations.map((v) => `${v.id}: ${v.help} -> ${v.nodes.map((node) => node.target.join(' ')).join(' | ')}`)).toEqual([])
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/Mot de passe/).fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/account$/)
}

// Each page with the element that proves its data is displayed (not the loading skeleton)
const publicPages: { name: string; path: string; loaded: (page: Page) => Locator }[] = [
  { name: 'accueil', path: '/', loaded: (page) => page.getByRole('article').first() },
  { name: 'catalogue', path: '/products', loaded: (page) => page.getByRole('article').first() },
  { name: 'fiche produit', path: '/products/lampe-aria', loaded: (page) => page.getByRole('heading', { level: 1, name: 'Lampe Aria.' }) },
  { name: 'connexion', path: '/login', loaded: (page) => page.getByRole('heading', { level: 1, name: 'Connexion.' }) },
  { name: 'inscription', path: '/signup', loaded: (page) => page.getByRole('heading', { level: 1, name: 'Inscription.' }) },
  { name: 'page 404', path: '/page-inconnue', loaded: (page) => page.getByRole('heading', { level: 1, name: /existe pas/ }) },
]

test.describe('accessibilité WCAG 2.1 AA (axe-core)', () => {
  // The cards and intros fade in (opacity animation): scanned mid-animation, text looks low-contrast.
  // The app already honours prefers-reduced-motion (animations ~0 ms): axe then checks the final rendering.
  test.use({ reducedMotion: 'reduce' })

  for (const { name, path, loaded } of publicPages) {
    test(name, async ({ page }) => {
      await page.goto(path)
      await expect(loaded(page)).toBeVisible()
      await expectNoViolations(page)
    })
  }

  test('catalogue avec un panier rempli', async ({ page }) => {
    await page.goto('/products')
    await page.getByRole('button', { name: 'Ajouter au panier', disabled: false }).first().click()
    await expect(page.getByRole('complementary', { name: /Le panier/ })).toContainText('Total')
    await expectNoViolations(page)
  })

  test('espace client (/account)', async ({ page }) => {
    const email = process.env.E2E_EMAIL
    const password = process.env.E2E_PASSWORD
    test.skip(!email || !password, 'E2E_EMAIL / E2E_PASSWORD absents du .env')
    await signIn(page, email!, password!)
    await expect(page.getByRole('heading', { name: 'Mes commandes' })).toBeVisible()
    await expectNoViolations(page)
  })

  test('admin : catalogue, formulaire produit ouvert, commandes', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL
    const password = process.env.E2E_ADMIN_PASSWORD
    test.skip(!email || !password, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD absents du .env')
    await signIn(page, email!, password!)

    await page.goto('/admin')
    await expect(page.getByRole('table')).toBeVisible()
    await expectNoViolations(page)

    // Modal dialog open: the rest of the page is inert, axe checks the form
    await page.getByRole('button', { name: 'Nouveau produit' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoViolations(page)
    await page.getByRole('button', { name: 'Annuler' }).click()

    await page.goto('/admin/orders')
    await expect(page.getByRole('table')).toBeVisible()
    await expectNoViolations(page)
  })
})
