import { useState } from 'react'
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Clock,
  DollarSign,
  Film,
  Play,
  Star,
  User,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getImageUrl } from '../api/tmdb'
import { MovieRow } from '../components/MovieRow'
import { ErrorState } from '../components/ui/ErrorState'
import { DetailSkeleton } from '../components/ui/Skeleton'
import { TrailerModal } from '../components/ui/TrailerModal'
import { useAuth } from '../hooks/useAuth'
import { useMovieDetails } from '../hooks/useMovies'
import {
  formatCurrency,
  formatDate,
  formatRating,
  formatRuntime,
  getPrimaryTrailer,
} from '../utils/formatters'

export function MovieDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trailerOpen, setTrailerOpen] = useState(false)
  const { isInWatchlist, toggleWatchlist } = useAuth()

  const { data: movie, isLoading, isError, error, refetch } = useMovieDetails(id)
  const saved = isInWatchlist(id)

  if (isLoading) return <DetailSkeleton />

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    )
  }

  if (!movie) return null

  const backdropUrl = getImageUrl(movie.backdrop_path, 'original')
  const posterUrl = getImageUrl(movie.poster_path, 'w500')
  const trailer = getPrimaryTrailer(movie.videos?.results)
  const cast = (movie.credits?.cast || []).slice(0, 14)
  const similar = movie.similar?.results || []
  const recommendations = movie.recommendations?.results || []

  return (
    <div>
      {/* Backdrop Hero */}
      <div className="relative h-[42vh] sm:h-[52vh] min-h-[300px] w-full overflow-hidden bg-zinc-950">
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={movie.title}
            className="h-full w-full object-cover object-center opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/65 to-black/40" />

        <div className="absolute top-5 left-0 right-0 z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-xs sm:text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/75 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto -mt-32 sm:-mt-40 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Poster */}
          <div className="mx-auto w-48 sm:w-60 md:w-72 shrink-0 md:mx-0">
            <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/15 bg-zinc-900 shadow-2xl">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-500">
                  <Film className="h-10 w-10 opacity-50" />
                  <span className="text-xs px-4 text-center">{movie.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-5 text-center md:text-left">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="mt-2 text-sm sm:text-base italic text-zinc-400">
                  "{movie.tagline}"
                </p>
              )}
            </div>

            {/* Meta Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs sm:text-sm text-zinc-300">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/90 px-3 py-1 font-semibold text-white">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {formatRating(movie.vote_average)}
                <span className="text-zinc-500 font-normal">
                  ({movie.vote_count?.toLocaleString()})
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/90 px-3 py-1">
                <Clock className="h-4 w-4 text-zinc-400" />
                {formatRuntime(movie.runtime)}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/90 px-3 py-1">
                <Calendar className="h-4 w-4 text-zinc-400" />
                {formatDate(movie.release_date)}
              </span>
            </div>

            {/* Genres */}
            {movie.genres?.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {movie.genres.map((genre) => (
                  <Link
                    key={genre.id}
                    to={`/discover?genre=${genre.id}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-200 transition hover:border-rose-500/50 hover:bg-rose-500/15 hover:text-white"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Trailer & Watchlist CTAs */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              {trailer && (
                <button
                  type="button"
                  onClick={() => setTrailerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500 active:scale-[0.98] cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Watch Trailer
                </button>
              )}

              <button
                type="button"
                onClick={() => toggleWatchlist(movie)}
                className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition active:scale-[0.98] cursor-pointer ${
                  saved
                    ? 'border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                    : 'border-white/15 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                {saved ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            </div>

            {/* Overview */}
            <div className="pt-2">
              <h2 className="text-base font-semibold text-white">Overview</h2>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-zinc-300">
                {movie.overview || 'No overview available for this movie.'}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-left">
              <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3.5">
                <p className="text-xs text-zinc-400">Status</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {movie.status || 'Unknown'}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3.5">
                <p className="flex items-center gap-1 text-xs text-zinc-400">
                  <DollarSign className="h-3.5 w-3.5" /> Budget
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {formatCurrency(movie.budget)}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-xl border border-white/10 bg-zinc-900/60 p-3.5">
                <p className="flex items-center gap-1 text-xs text-zinc-400">
                  <DollarSign className="h-3.5 w-3.5" /> Revenue
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {formatCurrency(movie.revenue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Cast */}
        {cast.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg sm:text-xl font-bold text-white">Top Cast</h2>
            <div className="no-scrollbar flex gap-3.5 overflow-x-auto pb-2">
              {cast.map((person) => {
                const profileUrl = getImageUrl(person.profile_path, 'w185')
                return (
                  <div
                    key={person.cast_id || `${person.id}-${person.character}`}
                    className="w-32 sm:w-36 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/70"
                  >
                    <div className="aspect-[2/3] w-full bg-zinc-800">
                      {profileUrl ? (
                        <img
                          src={profileUrl}
                          alt={person.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-500">
                          <User className="h-8 w-8 opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-xs sm:text-sm font-semibold text-white">
                        {person.name}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        {person.character}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Recommendations & Similar */}
        {recommendations.length > 0 && (
          <MovieRow title="Recommended For You" movies={recommendations} />
        )}

        {similar.length > 0 && (
          <MovieRow title="Similar Movies" movies={similar} />
        )}
      </div>

      <TrailerModal
        videoKey={trailerOpen ? trailer?.key : null}
        title={movie.title}
        onClose={() => setTrailerOpen(false)}
      />
    </div>
  )
}
