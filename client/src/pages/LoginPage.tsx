import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <h1 className="font-display text-4xl text-ink">Converseo</h1>
        <LoginForm />
      </div>
    </div>
  )
}