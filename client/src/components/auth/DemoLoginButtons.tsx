import { useNavigate } from 'react-router-dom'
import { useLogin } from '@/hooks/useAuth'
import { DEMO_ACCOUNTS } from '@/lib/demoAccounts'

export function DemoLoginButtons() {
  const login = useLogin()
  const navigate = useNavigate()

  function handleDemoLogin(email: string, password: string) {
    login.mutate({ email, password }, { onSuccess: () => navigate('/chat') })
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-ink-soft">or try it instantly</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      {DEMO_ACCOUNTS.map((account) => (
        <button
          key={account.email}
          type="button"
          onClick={() => handleDemoLogin(account.email, account.password)}
          disabled={login.isPending}
          className="rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-accent-tint disabled:opacity-50"
        >
          Log in as {account.label}
        </button>
      ))}
      <p className="text-center text-xs text-ink-soft">
        Demo accounts reset to a clean state on every login.
      </p>
    </div>
  )
}