import { AlertTriangle, KeyRound, RefreshCw } from 'lucide-react'
import { TmdbConfigError } from '../../api/tmdb'

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  const isConfigError = error instanceof TmdbConfigError || error?.name === 'TmdbConfigError'

  if (isConfigError) {
    return (
      <div className="max-w-2xl mx-auto my-12 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 text-center backdrop-blur-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold text-white">TMDB API Token Required</h2>
        <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
          To load live movies, trailers, and cast data, create a <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-amber-300">.env</code> file in the project root and add your TMDB API Read Access Token:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-zinc-950/90 border border-white/10 p-3.5 text-left text-xs text-zinc-200">
          VITE_TMDB_READ_ACCESS_TOKEN=your_tmdb_bearer_token_here
        </pre>
        <p className="mt-3 text-xs text-zinc-400">
          Get your token from{' '}
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noreferrer"
            className="text-rose-400 hover:text-rose-300 underline underline-offset-2"
          >
            themoviedb.org/settings/api
          </a>{' '}
          and restart the Vite dev server.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto my-12 rounded-2xl border border-rose-500/25 bg-zinc-900/70 p-6 sm:p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">
        {error?.message || 'Unable to fetch data from TMDB. Please try again.'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-500 active:scale-[0.98] cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  )
}
