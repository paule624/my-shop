import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext, type AuthValue } from '@/features/auth/AuthContext'

// Renders a component under the app's providers. One fresh QueryClient per test: no cache shared between tests.
export function renderWithProviders(
  ui: ReactElement,
  // Starting URL: tests the URL state (filters, page) by changing it
  url = '/',
  // Signed-out visitor whose session is already read; pass a session to test the signed-in state
  auth: AuthValue = { session: null, booted: true },
) {
  const queryClient = new QueryClient({
    // No retry: a failing query errors at once instead of retrying 3 times (slow, flaky tests)
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}
