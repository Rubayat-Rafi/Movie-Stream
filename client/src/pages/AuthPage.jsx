import { useState } from 'react'
import { Clapperboard, Eye, EyeOff, Loader2, Lock, Mail, Shield, Sparkles, User } from 'lucide-react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'

  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSearchParams({ mode: nextMode }, { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await signUp({ name, email, password })
      } else {
        await signIn({ email, password })
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setError('')
    setSubmitting(true)
    try {
      await signIn({ email: demoEmail, password: demoPassword })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Unable to sign in. Make sure the backend & MySQL DB are seeded.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -top-24 left-1/3 h-80 w-80 rounded-full bg-rose-600/20 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/3 h-80 w-80 rounded-full bg-indigo-600/15 blur-[140px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0d111a]/90 p-6 sm:p-8 shadow-2xl shadow-black/70 backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-950/50">
            <Clapperboard className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'signin' ? 'Sign In to StreamMovies' : 'Create Your Account'}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {mode === 'signin'
              ? 'Access your subscription, profiles, and watchlist.'
              : 'Start streaming with your personalized profile.'}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-xl border border-white/10 bg-zinc-900/80 p-1">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`rounded-lg py-2 text-sm font-semibold transition cursor-pointer ${
              mode === 'signin'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`rounded-lg py-2 text-sm font-semibold transition cursor-pointer ${
              mode === 'signup'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs sm:text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/90 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-zinc-900/90 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-white/10 bg-zinc-900/90 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500 active:scale-[0.99] cursor-pointer disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-zinc-500">Seeded Accounts</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleQuickLogin('demo@streammovies.app', 'demo123')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] py-2.5 text-xs font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Demo User
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleQuickLogin('admin@streammovies.app', 'admin123')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] py-2.5 text-xs font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <Shield className="h-3.5 w-3.5 text-rose-400" />
            Demo Admin
          </button>
        </div>
      </div>
    </div>
  )
}
