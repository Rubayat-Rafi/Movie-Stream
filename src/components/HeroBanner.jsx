import { useEffect, useMemo, useState } from 'react'
import { Calendar, Flame, Info, Play, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../api/tmdb'
import { useMovieDetails, useMovieGenres } from '../hooks/useMovies'
import { formatRating, formatYear, getPrimaryTrailer } from '../utils/formatters'
import { HeroSkeleton } from './ui/Skeleton'
import { TrailerModal } from './ui/TrailerModal'

export function HeroBanner({ movies = [], isLoading = false }) {
  const featured = useMemo(() => movies.slice(0, 5), [movies])
  const [activeIndex, setActiveIndex] = useState(0)
  const [trailerOpen, setTrailerOpen] = useState(false)

  const genresQuery = useMovieGenres()
  const movie = featured[activeIndex] || featured[0]
  const detailsQuery = useMovieDetails(movie?.id)

  useEffect(() => {
    if (featured.length <= 1 || trailerOpen) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featured.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [featured.length, trailerOpen])

  const genreMap = useMemo(() => {
    const map = new Map()
    genresQuery.data?.genres?.forEach((g) => map.set(g.id, g.name))
    return map
  }, [genresQuery.data])

  if (isLoading) return <HeroSkeleton />
  if (featured.length === 0 || !movie) return null

  const backdropUrl = getImageUrl(movie.backdrop_path, 'original')
  const movieGenres = (movie.genre_ids || [])
    .slice(0, 3)
    .map((id) => ({ id, name: genreMap.get(id) }))
    .filter((g) => g.name)
  const trailer = getPrimaryTrailer(detailsQuery.data?.videos?.results)

  return (
    <section className="relative min-h-[540px] sm:min-h-[600px] lg:h-[78vh] lg:max-h-[760px] w-full overflow-hidden bg-[#07090e]">
      {/* Backdrop Image */}
      {backdropUrl && (
        <img
          key={movie.id}
          src={backdropUrl}
          alt={movie.title}
          className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-700 scale-[1.02]"
        />
      )}

      {/* Multi-layered Cinematic Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/75 to-transparent" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-96 rounded-full bg-rose-600/20 blur-[120px]" />

      {/* Content Container */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pt-20 pb-10 sm:px-6 sm:pb-14 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        {/* Left: Main Movie Info */}
        <div className="max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-3 py-1 text-white shadow-lg shadow-rose-950/50">
              <Flame className="h-3.5 w-3.5 fill-current" />
              Trending #{activeIndex + 1}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-zinc-100 backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {formatRating(movie.vote_average)}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-zinc-200 backdrop-blur-md">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              {formatYear(movie.release_date)}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.08] drop-shadow-sm">
            {movie.title}
          </h1>

          {movieGenres.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {movieGenres.map((genre) => (
                <Link
                  key={genre.id}
                  to={`/discover?genre=${genre.id}`}
                  className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-zinc-200 backdrop-blur-sm transition hover:border-rose-500/50 hover:bg-rose-500/15 hover:text-white"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          )}

          {movie.overview && (
            <p className="line-clamp-3 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
              {movie.overview}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {trailer ? (
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-rose-950/60 transition hover:bg-rose-500 active:scale-[0.98] cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                Watch Trailer
              </button>
            ) : (
              <Link
                to={`/movie/${movie.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-rose-950/60 transition hover:bg-rose-500 active:scale-[0.98]"
              >
                <Play className="h-4 w-4 fill-current" />
                Explore Movie
              </Link>
            )}

            <Link
              to={`/movie/${movie.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <Info className="h-4 w-4" />
              More Details
            </Link>
          </div>
        </div>

        {/* Right: Desktop Interactive Featured Queue */}
        {featured.length > 1 && (
          <div className="mt-8 lg:mt-0 flex flex-col items-start lg:items-end gap-3">
            <span className="hidden lg:block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Featured Queue
            </span>

            <div className="hidden lg:flex items-center gap-2.5 rounded-2xl border border-white/10 bg-black/45 p-2 backdrop-blur-xl">
              {featured.map((item, idx) => {
                const thumbUrl = getImageUrl(item.poster_path, 'w185')
                const isActive = idx === activeIndex
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Select ${item.title}`}
                    className={`group relative h-20 w-14 overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'scale-105 border-rose-500 ring-2 ring-rose-500/40 shadow-lg'
                        : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                    }`}
                  >
                    {thumbUrl && (
                      <img
                        src={thumbUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Mobile / Tablet Dots */}
            <div className="flex lg:hidden items-center gap-2">
              {featured.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Show featured movie ${item.title}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === activeIndex
                      ? 'w-8 bg-rose-500'
                      : 'w-2.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <TrailerModal
        videoKey={trailerOpen ? trailer?.key : null}
        title={movie.title}
        onClose={() => setTrailerOpen(false)}
      />
    </section>
  )
}
