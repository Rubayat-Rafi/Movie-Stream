import { useEffect, useMemo, useState } from 'react'
import { Info, Play, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../api/tmdb'
import { useAuth } from '../hooks/useAuth'
import { useMovieDetails, useMovieGenres } from '../hooks/useMovies'
import { formatRating, formatYear, getPrimaryTrailer } from '../utils/formatters'
import { HeroSkeleton } from './ui/Skeleton'
import { TrailerModal } from './ui/TrailerModal'

export function HeroBanner({ movies = [], isLoading = false }) {
  const featured = useMemo(() => movies.slice(0, 5), [movies])
  const [activeIndex, setActiveIndex] = useState(0)
  const [trailerOpen, setTrailerOpen] = useState(false)

  const { recordWatchHistory } = useAuth()
  const genresQuery = useMovieGenres()
  const movie = featured[activeIndex] || featured[0]
  const detailsQuery = useMovieDetails(movie?.id)

  useEffect(() => {
    if (featured.length <= 1 || trailerOpen) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featured.length)
    }, 8500)
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
  const matchPercent = Math.min(99, Math.max(82, Math.round((movie.vote_average || 7.5) * 10 + 12)))

  const handlePlay = () => {
    recordWatchHistory(movie, 25)
    setTrailerOpen(true)
  }

  return (
    <section className="relative min-h-[580px] sm:min-h-[640px] lg:h-[84vh] lg:max-h-[820px] w-full overflow-hidden bg-[#07090e]">
      {backdropUrl && (
        <img
          key={movie.id}
          src={backdropUrl}
          alt={movie.title}
          className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-700 scale-[1.03]"
        />
      )}

      {/* Netflix-style multi-layered vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/50 to-black/35" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07090e]/95 via-[#07090e]/60 to-transparent" />
      <div className="pointer-events-none absolute -bottom-28 left-1/4 h-80 w-[28rem] rounded-full bg-rose-600/20 blur-[130px]" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pt-24 pb-12 sm:px-6 sm:pb-16 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-2xl space-y-4">
          {/* Netflix Original Style Eyebrow */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-rose-600 text-xs font-black tracking-tighter text-white shadow">
              S
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-200">
              Featured Film • #{activeIndex + 1} Today
            </span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.05] drop-shadow-md">
            {movie.title}
          </h1>

          {/* Netflix Match + Metadata Row */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-medium">
            <span className="font-bold text-emerald-400">{matchPercent}% Match</span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-200">{formatYear(movie.release_date)}</span>
            <span className="rounded border border-white/25 bg-white/5 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-200">
              4K HDR
            </span>
            <span className="inline-flex items-center gap-1 text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              {formatRating(movie.vote_average)}
            </span>
            {movieGenres.map((genre) => (
              <Link
                key={genre.id}
                to={`/discover?genre=${genre.id}`}
                className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs text-zinc-200 transition hover:border-rose-500/50 hover:bg-rose-500/20"
              >
                {genre.name}
              </Link>
            ))}
          </div>

          {movie.overview && (
            <p className="line-clamp-3 text-sm sm:text-base text-zinc-200/90 leading-relaxed max-w-xl">
              {movie.overview}
            </p>
          )}

          {/* Netflix-style Play + More Info CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {trailer ? (
              <button
                type="button"
                onClick={handlePlay}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm sm:text-base font-bold text-zinc-950 shadow-xl transition hover:bg-zinc-200 active:scale-[0.98] cursor-pointer"
              >
                <Play className="h-5 w-5 fill-current" />
                Play
              </button>
            ) : (
              <Link
                to={`/movie/${movie.id}`}
                onClick={() => recordWatchHistory(movie, 20)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm sm:text-base font-bold text-zinc-950 shadow-xl transition hover:bg-zinc-200 active:scale-[0.98]"
              >
                <Play className="h-5 w-5 fill-current" />
                Play
              </Link>
            )}

            <Link
              to={`/movie/${movie.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-zinc-700/60 px-6 py-3 text-sm sm:text-base font-semibold text-white backdrop-blur-md transition hover:bg-zinc-600/70"
            >
              <Info className="h-5 w-5" />
              More Info
            </Link>
          </div>
        </div>

        {/* Right: Featured Queue + Maturity Badge */}
        {featured.length > 1 && (
          <div className="mt-8 lg:mt-0 flex flex-col items-start lg:items-end gap-3">
            <div className="hidden lg:flex items-center gap-2.5 rounded-2xl border border-white/10 bg-black/55 p-2 backdrop-blur-xl">
              {featured.map((item, idx) => {
                const thumbUrl = getImageUrl(item.poster_path, 'w185')
                const isActive = idx === activeIndex
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Select ${item.title}`}
                    className={`relative h-20 w-14 overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'scale-105 border-rose-500 ring-2 ring-rose-500/40 shadow-lg'
                        : 'border-white/10 opacity-55 hover:opacity-100 hover:border-white/30'
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
