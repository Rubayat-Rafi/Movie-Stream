import { useEffect } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { MovieCard } from '../components/MovieCard'
import { ErrorState } from '../components/ui/ErrorState'
import { Pagination } from '../components/ui/Pagination'
import { MovieGridSkeleton } from '../components/ui/Skeleton'
import { useDiscoverMovies, useMovieGenres } from '../hooks/useMovies'

const SORT_OPTIONS = [
  { label: 'Most Popular', value: 'popularity.desc' },
  { label: 'Highest Rated', value: 'vote_average.desc' },
  { label: 'Newest Releases', value: 'primary_release_date.desc' },
  { label: 'Top Revenue', value: 'revenue.desc' },
]

export function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const genreId = searchParams.get('genre') || ''
  const sortBy = searchParams.get('sort') || 'popularity.desc'
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const genresQuery = useMovieGenres()
  const discoverQuery = useDiscoverMovies({ genreId, sortBy, page })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [genreId, sortBy, page])

  const updateFilter = (updates) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, val]) => {
      if (val) next.set(key, String(val))
      else next.delete(key)
    })
    if (!('page' in updates)) {
      next.set('page', '1')
    }
    setSearchParams(next)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Discover Movies
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Filter by genre and sort order across the TMDB catalog.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
          <label htmlFor="sort-select" className="sr-only">
            Sort movies
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => updateFilter({ sort: e.target.value })}
            className="rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 focus:border-rose-500 focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Genre Pills */}
      {genresQuery.data?.genres && (
        <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => updateFilter({ genre: '' })}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition cursor-pointer ${
              genreId === ''
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                : 'border border-white/10 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            All Genres
          </button>
          {genresQuery.data.genres.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => updateFilter({ genre: String(genre.id) })}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition cursor-pointer ${
                genreId === String(genre.id)
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                  : 'border border-white/10 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>
      )}

      {discoverQuery.isLoading ? (
        <MovieGridSkeleton count={18} />
      ) : discoverQuery.isError ? (
        <ErrorState error={discoverQuery.error} onRetry={discoverQuery.refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {discoverQuery.data?.results?.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={discoverQuery.data?.total_pages}
            onPageChange={(nextPage) => updateFilter({ page: nextPage })}
            isFetching={discoverQuery.isFetching}
          />
        </>
      )}
    </div>
  )
}
