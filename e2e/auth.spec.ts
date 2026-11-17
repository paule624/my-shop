import { expect, test } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

// Bonus: sign-in journey on the real Supabase Auth. Needs a test account in .env (see .env.example).
test('un client se connecte depuis une page protégée, puis se déconnecte', async ({ page }) => {
  test.skip(!email || !password, 'E2E_EMAIL / E2E_PASSWORD absents du .env')

  // Protected page: the visitor is sent to the login form...
  await page.goto('/account')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Email').fill(email!)
  await page.getByLabel(/Mot de passe/).fill(password!)
  await page.getByRole('button', { name: 'Se connecter' }).click()

  // ...and comes back to the page they asked for, signed in
  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Bonjour.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mes commandes' })).toBeVisible()

  await page.getByRole('button', { name: 'Déconnexion' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('link', { name: 'Connexion' })).toBeVisible()
})
