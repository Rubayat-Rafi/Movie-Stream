import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Compass, Film, Play, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { backendApi } from '../api/backend'
import { ContinueWatchingRow } from '../components/ContinueWatchingRow'
import { HeroBanner } from '../components/HeroBanner'
import { MovieRow } from '../components/MovieRow'
import { NetflixTopTenRow } from '../components/NetflixTopTenRow'
import { ErrorState } from '../components/ui/ErrorState'
import { useAuth } from '../hooks/useAuth'
import {
  useDiscoverMovies,
  useMovieGenres,
  useMoviesByCategory,
  useTrendingMovies,
} from '../hooks/useMovies'

export function HomePage() {
  const [trendingWindow, setTrendingWindow] = useState('day')
  const { history } = useAuth()

  const trending = useTrendingMovies(trendingWindow)
  const nowPlaying = useMoviesByCategory('now_playing')
  const popular = useMoviesByCategory('popular')
  const topRated = useMoviesByCategory('top_rated')
  const upcoming = useMoviesByCategory('upcoming')
  const actionMovies = useDiscoverMovies({ genreId: '28', sortBy: 'popularity.desc' })
  const sciFiMovies = useDiscoverMovies({ genreId: '878', sortBy: 'popularity.desc' })
  const genresQuery = useMovieGenres()
  const customMoviesQuery = useQuery({
    queryKey: ['custom-movies'],
    queryFn: backendApi.getCustomMovies,
    retry: false,
  })
  const originals = customMoviesQuery.data?.movies || []

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
          <div className="mb-3 flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-2">
            <Link
              to="/discover"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-600/15 border border-rose-500/30 px-3.5 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-600 hover:text-white"
            >
              <Compass className="h-3.5 w-3.5" />
              Browse All
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

        {/* Continue Watching (Logged-in user history) */}
        <ContinueWatchingRow items={history} />

        {/* StreamMovies Uploaded Originals */}
        {originals.length > 0 && (
          <section className="py-6 sm:py-8">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="h-5 w-1 rounded-full bg-rose-600" />
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                StreamMovies Originals
              </h2>
            </div>

            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              {originals.map((movie) => (
                <Link
                  key={movie.id}
                  to={`/originals/${movie.id}`}
                  className="group w-[155px] sm:w-[180px] shrink-0 snap-start"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-lg transition group-hover:-translate-y-1 group-hover:border-rose-500/60">
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-500">
                        <Film className="h-8 w-8 opacity-50" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl">
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      </span>
                    </div>
                    <span className="absolute top-2.5 left-2.5 rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      ORIGINAL
                    </span>
                    <span className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {movie.rating}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-zinc-100 group-hover:text-rose-400">
                    {movie.title}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {movie.releaseYear} • {movie.videoQuality}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Netflix Top 10 Row */}
        <NetflixTopTenRow
          movies={trending.data?.results || []}
          isLoading={trending.isLoading}
        />

        <MovieRow
          title="Trending Now"
          movies={trending.data?.results || []}
          isLoading={trending.isLoading}
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
          title="Now Playing in Theaters"
          movies={nowPlaying.data?.results || []}
          isLoading={nowPlaying.isLoading}
          viewAllTo="/movies/now-playing"
        />

        <MovieRow
          title="Popular on StreamMovies"
          movies={popular.data?.results || []}
          isLoading={popular.isLoading}
          viewAllTo="/movies/popular"
        />

        <MovieRow
          title="Action & Adrenaline"
          movies={actionMovies.data?.results || []}
          isLoading={actionMovies.isLoading}
          viewAllTo="/discover?genre=28"
        />

        <MovieRow
          title="Sci-Fi & Future Worlds"
          movies={sciFiMovies.data?.results || []}
          isLoading={sciFiMovies.isLoading}
          viewAllTo="/discover?genre=878"
        />

        <MovieRow
          title="Critically Acclaimed Classics"
          movies={topRated.data?.results || []}
          isLoading={topRated.isLoading}
          viewAllTo="/movies/top-rated"
        />

        <MovieRow
          title="Coming Soon"
          movies={upcoming.data?.results || []}
          isLoading={upcoming.isLoading}
          viewAllTo="/movies/upcoming"
        />
      </div>
    </div>
  )
}
