import { Bookmark, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MovieCard } from '../components/MovieCard'
import { useAuth } from '../hooks/useAuth'

export function WatchlistPage() {
  const { user, watchlist } = useAuth()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            My Watchlist
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {user
              ? `Saved movies for ${user.name}`
              : 'Movies you bookmark are saved locally in your browser.'}
          </p>
        </div>

        <span className="text-xs font-medium text-zinc-400">
          {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'} saved
        </span>
      </div>

      {watchlist.length === 0 ? (
        <div className="my-16 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/40 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <Bookmark className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-white">Your watchlist is empty</h2>
          <p className="mt-1.5 max-w-sm text-sm text-zinc-400">
            Open any movie and click "Add to Watchlist" to keep track of what you want to watch next.
          </p>
          <Link
            to="/discover"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500"
          >
            <Compass className="h-4 w-4" />
            Discover Movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {watchlist.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  )
}
