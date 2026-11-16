import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, Navigate, useLocation } from 'react-router-dom'
import PageLoader from '@/components/PageLoader'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase } from '@/lib/supabase'

type Credentials = { email: string; password: string }

// /login and /signup only differ by their texts and the Supabase call: one component, two modes
const modes = {
  login: {
    title: 'Connexion',
    submitLabel: 'Se connecter',
    passwordAutoComplete: 'current-password',
    switchText: 'Pas encore de compte ?',
    switchLink: { to: '/signup', label: 'Créer un compte' },
    // Throws the server message on failure; resolves with an optional info message
    submit: async ({ email, password }: Credentials): Promise<string | null> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      return null
    },
  },
  signup: {
    title: 'Inscription',
    submitLabel: 'Créer mon compte',
    passwordAutoComplete: 'new-password',
    switchText: 'Déjà un compte ?',
    switchLink: { to: '/login', label: 'Se connecter' },
    submit: async ({ email, password }: Credentials): Promise<string | null> => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw new Error(error.message)
      // No session when "Confirm email" is enabled in Supabase: the user must confirm first
      return data.session ? null : 'Compte créé : confirmez votre email, puis connectez-vous.'
    },
  },
} as const

type AuthPageProps = { mode: keyof typeof modes }

function AuthPage({ mode }: AuthPageProps) {
  const config = modes[mode]
  const { session, booted } = useAuth()
  const location = useLocation()
  const mutation = useMutation({ mutationFn: config.submit })
  // Page requested before ProtectedRoute redirected here, /account by default
  const from = (location.state as { from?: string } | null)?.from ?? '/account'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({ email: String(form.get('email')), password: String(form.get('password')) })
  }

  if (!booted) return <PageLoader />
  // Declarative redirect: as soon as a session exists (after submit, or already signed in), leave the form
  if (session) return <Navigate to={from} replace />

  return (
    <main className="auth-page">
      <section className="orders-intro">
        <p className="eyebrow"><span className="eyebrow-dot" /> Votre espace</p>
        <h1>{config.title}<em>.</em></h1>
      </section>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="auth-email">Email</label>
        <input id="auth-email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="auth-password">Mot de passe <span className="field-hint">(6 caractères minimum)</span></label>
        <input
          id="auth-password"
          name="password"
          type="password"
          autoComplete={config.passwordAutoComplete}
          minLength={6}
          required
        />
        {/* Server errors are shown as returned by Supabase, never swallowed */}
        {mutation.isError && <p className="form-message error-message" role="alert">{mutation.error.message}</p>}
        {mutation.data && <p className="form-message" role="status">{mutation.data}</p>}
        <button className="add-button auth-submit" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Patientez…' : config.submitLabel}
        </button>
      </form>
      <p className="auth-switch">
        {config.switchText}{' '}
        {/* Forwards the "from" state, so the redirect still works after switching form */}
        <Link to={config.switchLink.to} state={location.state}>{config.switchLink.label}</Link>
      </p>
    </main>
  )
}

export default AuthPage
