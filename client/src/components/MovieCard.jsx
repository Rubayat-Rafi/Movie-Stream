import { Film, Play, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../api/tmdb'
import { formatRating, formatYear } from '../utils/formatters'

export function MovieCard({ movie, rank }) {
  const posterUrl = getImageUrl(movie.poster_path, 'w500')
  const rating = formatRating(movie.vote_average)
  const year = formatYear(movie.release_date)

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group relative flex flex-col gap-2.5 focus:outline-none"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:border-rose-500/50 group-hover:shadow-2xl group-hover:shadow-rose-950/40 group-focus-visible:ring-2 group-focus-visible:ring-rose-500">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-900 p-4 text-center text-zinc-500">
            <Film className="h-8 w-8 opacity-50" />
            <span className="text-xs line-clamp-2">{movie.title}</span>
          </div>
        )}

        {/* Hover gradient + play indicator */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-600/90 text-white shadow-lg backdrop-blur-sm transition-transform duration-300 scale-75 group-hover:scale-100">
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </span>
        </div>

        {/* Optional rank badge */}
        {typeof rank === 'number' && (
          <div className="absolute top-2.5 left-2.5 rounded-lg border border-white/15 bg-black/75 px-2 py-0.5 text-xs font-bold text-rose-400 backdrop-blur-md">
            #{rank}
          </div>
        )}

        {/* Rating badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-lg border border-white/15 bg-black/75 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span>{rating}</span>
        </div>
      </div>

      <div className="px-0.5">
        <h3 className="truncate text-sm font-semibold text-zinc-100 transition-colors group-hover:text-rose-400">
          {movie.title}
        </h3>
        <p className="mt-0.5 text-xs text-zinc-400">{year}</p>
      </div>
    </Link>
  )
}
