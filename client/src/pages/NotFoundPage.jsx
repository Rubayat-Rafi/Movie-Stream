import { Film } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-rose-500">
        <Film className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-white">404</h1>
      <p className="mt-2 text-base text-zinc-400">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Back to Home
      </Link>
    </div>
  )
}
