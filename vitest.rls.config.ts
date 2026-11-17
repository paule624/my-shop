import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// Database security suite: talks to the REAL Supabase project with test accounts, so it is kept out of
// "npm test" (fast, offline) and runs with "npm run test:rls".
export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    include: ['supabase/tests/**/*.test.ts'],
    // Every .env variable (not only VITE_*): the URL, the anon key and the test accounts
    env: loadEnv(mode, process.cwd(), ''),
    // Network round trips to Supabase
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
}))
