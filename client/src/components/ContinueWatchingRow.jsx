import { Film, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../api/tmdb'

export function ContinueWatchingRow({ items = [] }) {
  if (!items || items.length === 0) return null

  return (
    <section className="py-6 sm:py-8">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="h-5 w-1 rounded-full bg-rose-600" />
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          Continue Watching
        </h2>
      </div>

      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {items.map((item) => {
          const backdropUrl =
            getImageUrl(item.backdropPath, 'w780') ||
            getImageUrl(item.posterPath, 'w500')

          return (
            <Link
              key={item.movieId}
              to={`/movie/${item.movieId}`}
              className="group relative w-[240px] sm:w-[275px] shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-lg transition hover:border-rose-500/50"
            >
              <div className="relative aspect-video w-full bg-zinc-800">
                {backdropUrl ? (
                  <img
                    src={backdropUrl}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-500">
                    <Film className="h-8 w-8 opacity-50" />
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover:opacity-100">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-950 shadow-xl">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3">
                  <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                </div>
              </div>

              {/* Netflix-style red progress bar */}
              <div className="h-1 w-full bg-zinc-800">
                <div
                  className="h-full bg-rose-600"
                  style={{ width: `${item.progressPercent || 30}%` }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
