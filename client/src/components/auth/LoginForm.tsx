import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/errors'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const login = useLogin()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    login.mutate(
      { email, password },
      { onSuccess: () => navigate('/chat') }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-ink-soft">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-ink-soft">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
        />
      </div>

      {login.isError && (
        <p className="text-sm text-red-600">{getErrorMessage(login.error)}</p>
      )}

      <button
        type="submit"
        disabled={login.isPending}
        className="rounded-md bg-accent px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-sm text-ink-soft">
        New to Converseo?{' '}
        <Link to="/register" className="font-medium text-accent">
          Create an account
        </Link>
      </p>
    </form>
  )
}