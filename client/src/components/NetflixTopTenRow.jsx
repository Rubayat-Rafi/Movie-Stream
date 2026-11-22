import { useRef } from 'react'
import { ChevronLeft, ChevronRight, Film, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../api/tmdb'
import { formatRating } from '../utils/formatters'

export function NetflixTopTenRow({ movies = [], isLoading = false }) {
  const scrollRef = useRef(null)
  const topTen = movies.slice(0, 10)

  const scroll = (direction) => {
    if (!scrollRef.current) return
    const { clientWidth } = scrollRef.current
    const offset = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  if (!isLoading && topTen.length === 0) return null

  return (
    <section className="py-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-full bg-rose-600" />
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Top 10 Movies Today
          </h2>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll Top 10 left"
            className="rounded-xl border border-white/10 bg-zinc-900/90 p-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll Top 10 right"
            className="rounded-xl border border-white/10 bg-zinc-900/90 p-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-6 sm:gap-8 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-[220px] w-[195px] shrink-0 animate-pulse rounded-2xl bg-zinc-800/70"
              />
            ))
          : topTen.map((movie, idx) => {
              const posterUrl = getImageUrl(movie.poster_path, 'w500')
              return (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.id}`}
                  className="group relative flex shrink-0 items-end snap-start pl-8 sm:pl-10"
                >
                  {/* Giant Netflix-style outlined rank number */}
                  <span
                    className="pointer-events-none absolute left-0 bottom-0 z-0 select-none text-[110px] sm:text-[130px] font-black leading-[0.82] tracking-tighter text-transparent transition-transform duration-300 group-hover:scale-105"
                    style={{
                      WebkitTextStroke: '2px rgba(255,255,255,0.28)',
                    }}
                  >
                    {idx + 1}
                  </span>

                  <div className="relative z-10 aspect-[2/3] w-[135px] sm:w-[155px] overflow-hidden rounded-xl border border-white/15 bg-zinc-900 shadow-2xl transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-rose-500/60">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={movie.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-500">
                        <Film className="h-8 w-8" />
                      </div>
                    )}

                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {formatRating(movie.vote_average)}
                    </div>
                  </div>
                </Link>
              )
            })}
      </div>
    </section>
  )
}
