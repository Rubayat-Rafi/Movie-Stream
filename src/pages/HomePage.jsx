import { useState } from 'react'
import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HeroBanner } from '../components/HeroBanner'
import { MovieRow } from '../components/MovieRow'
import { ErrorState } from '../components/ui/ErrorState'
import { useMovieGenres, useMoviesByCategory, useTrendingMovies } from '../hooks/useMovies'

export function HomePage() {
  const [trendingWindow, setTrendingWindow] = useState('day')

  const trending = useTrendingMovies(trendingWindow)
  const nowPlaying = useMoviesByCategory('now_playing')
  const popular = useMoviesByCategory('popular')
  const topRated = useMoviesByCategory('top_rated')
  const upcoming = useMoviesByCategory('upcoming')
  const genresQuery = useMovieGenres()

  const primaryError =
    trending.error || nowPlaying.error || popular.error || topRated.error || upcoming.error

  if (primaryError && !trending.data && !popular.data) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <ErrorState error={primaryError} onRetry={() => trending.refetch()} />
      </div>
    )
  }

  const quickGenres = (genresQuery.data?.genres || []).slice(0, 12)

  return (
    <div className="relative overflow-hidden">
      <HeroBanner
        movies={trending.data?.results || []}
        isLoading={trending.isLoading}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        {/* Quick Genre Explore Strip */}
        {quickGenres.length > 0 && (
          <div className="mb-4 flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-2">
            <Link
              to="/discover"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-600/15 border border-rose-500/30 px-3.5 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-600 hover:text-white"
            >
              <Compass className="h-3.5 w-3.5" />
              Explore All
            </Link>
            {quickGenres.map((genre) => (
              <Link
                key={genre.id}
                to={`/discover?genre=${genre.id}`}
                className="shrink-0 rounded-full border border-white/10 bg-zinc-900/70 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/25 hover:bg-zinc-800 hover:text-white"
              >
                {genre.name}
              </Link>
            ))}
          </div>
        )}

        <MovieRow
          title="Trending"
          movies={trending.data?.results || []}
          isLoading={trending.isLoading}
          showRank
          headerAction={
            <div className="inline-flex rounded-full border border-white/10 bg-zinc-900/90 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTrendingWindow('day')}
                className={`rounded-full px-3 py-1 font-medium transition cursor-pointer ${
                  trendingWindow === 'day'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setTrendingWindow('week')}
                className={`rounded-full px-3 py-1 font-medium transition cursor-pointer ${
                  trendingWindow === 'week'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                This Week
              </button>
            </div>
          }
        />

        <MovieRow
          title="Now Playing"
          movies={nowPlaying.data?.results || []}
          isLoading={nowPlaying.isLoading}
          viewAllTo="/movies/now-playing"
        />

        <MovieRow
          title="Popular Movies"
          movies={popular.data?.results || []}
          isLoading={popular.isLoading}
          viewAllTo="/movies/popular"
        />

        <MovieRow
          title="Top Rated"
          movies={topRated.data?.results || []}
          isLoading={topRated.isLoading}
          viewAllTo="/movies/top-rated"
        />

        <MovieRow
          title="Upcoming Releases"
          movies={upcoming.data?.results || []}
          isLoading={upcoming.isLoading}
          viewAllTo="/movies/upcoming"
        />
      </div>
    </div>
  )
}
