import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Reuses the app's Vite config (React plugin + "@" alias), so tests resolve imports exactly like the app
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Simulated DOM: components render without a browser
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      // Unit and component tests live next to the code, in src/. The e2e/ folder belongs to Playwright.
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }),
)
