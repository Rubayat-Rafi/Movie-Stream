import { useRef } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MovieCard } from './MovieCard'
import { MovieCardSkeleton } from './ui/Skeleton'

export function MovieRow({
  title,
  movies = [],
  isLoading = false,
  viewAllTo,
  headerAction,
  showRank = false,
}) {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (!scrollRef.current) return
    const { clientWidth } = scrollRef.current
    const offset = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <section className="py-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-1 rounded-full bg-rose-500" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {title}
            </h2>
          </div>
          {headerAction}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label={`Scroll ${title} left`}
              className="rounded-xl border border-white/10 bg-zinc-900/90 p-2 text-zinc-300 transition hover:border-white/20 hover:bg-zinc-800 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label={`Scroll ${title} right`}
              className="rounded-xl border border-white/10 bg-zinc-900/90 p-2 text-zinc-300 transition hover:border-white/20 hover:bg-zinc-800 hover:text-white cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {viewAllTo && (
            <Link
              to={viewAllTo}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs sm:text-sm font-medium text-rose-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory"
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="w-[148px] sm:w-[172px] md:w-[190px] shrink-0 snap-start"
              >
                <MovieCardSkeleton />
              </div>
            ))
          : movies.map((movie, idx) => (
              <div
                key={movie.id}
                className="w-[148px] sm:w-[172px] md:w-[190px] shrink-0 snap-start"
              >
                <MovieCard movie={movie} rank={showRank ? idx + 1 : undefined} />
              </div>
            ))}
      </div>
    </section>
  )
}
