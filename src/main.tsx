import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
// Self-hosted variable fonts (same files Google Fonts served): wght axis for DM Sans, opsz + wght for Fraunces
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/fraunces/opsz.css'
import '@/index.css'
import App from '@/App'

// Server state cache. Data stays fresh for 1 minute: navigating between pages
// reuses the cache instead of refetching (writes invalidate their keys explicitly).
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
