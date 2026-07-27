import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/errors'

export function RegisterForm() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const register = useRegister()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    register.mutate(
      { displayName, email, password },
      { onSuccess: () => navigate('/chat') }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="displayName" className="text-sm font-medium text-ink-soft">
          Display name
        </label>
        <input
          id="displayName"
          required
          maxLength={50}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
        />
      </div>

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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
        />
      </div>

      {register.isError && (
        <p className="text-sm text-red-600">{getErrorMessage(register.error)}</p>
      )}

      <button
        type="submit"
        disabled={register.isPending}
        className="rounded-md bg-accent px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {register.isPending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-ink-soft">
        Already on Converseo?{' '}
        <Link to="/login" className="font-medium text-accent">
          Sign in
        </Link>
      </p>
    </form>
  )
}