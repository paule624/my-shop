/// <reference types="vite/client" />

// Typed env variables (defined in .env, see .env.example)
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}
