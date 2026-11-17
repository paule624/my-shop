import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// E2E_EMAIL / E2E_PASSWORD (test account for the sign-in journey) come from the git-ignored .env
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  // Outside src/: these tests drive the product, not the code
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:5173',
    // On failure only: screenshot + trace (DOM, network, console at each step), read with show-report
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Playwright starts the dev server itself, or reuses the one already running
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
