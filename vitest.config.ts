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
      // Coverage = what the tests EXECUTED, not what they checked: a map of untested areas, not a goal
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.d.ts', 'src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
      },
    },
  }),
)
