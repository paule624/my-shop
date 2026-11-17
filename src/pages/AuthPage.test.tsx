import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthPage from '@/pages/AuthPage'
import { renderWithProviders } from '@/test/utils'

// Supabase is external and slow: replaced by a fake. vi.hoisted creates the spy before vi.mock runs
// (vi.mock is moved to the top of the file), so the test can program and inspect it.
const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { signInWithPassword } } }))

describe('AuthPage (connexion)', () => {
  beforeEach(() => signInWithPassword.mockReset())

  it('affiche le message de Supabase quand les identifiants sont invalides', async () => {
    // Same shape as the real answer for a wrong password
    signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } })
    const user = userEvent.setup()
    renderWithProviders(<AuthPage mode="login" />, '/login')

    await user.type(screen.getByLabelText('Email'), 'camille@example.com')
    await user.type(screen.getByLabelText(/Mot de passe/), 'mauvais-mdp')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials')
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'camille@example.com', password: 'mauvais-mdp' })
  })

  it("n'envoie rien quand les champs sont vides", async () => {
    const user = userEvent.setup()
    renderWithProviders(<AuthPage mode="login" />, '/login')

    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(signInWithPassword).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Email')).toBeInvalid()
  })
})
