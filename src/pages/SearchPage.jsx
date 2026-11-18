import { useEffect, useState } from 'react'
import { Film, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { MovieCard } from '../components/MovieCard'
import { ErrorState } from '../components/ui/ErrorState'
import { Pagination } from '../components/ui/Pagination'
import { MovieGridSkeleton } from '../components/ui/Skeleton'
import { useDebounce } from '../hooks/useDebounce'
import { useSearchMovies } from '../hooks/useMovies'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [inputValue, setInputValue] = useState(initialQuery)
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery)
  const debouncedQuery = useDebounce(inputValue, 400)

  // Keep local input synced if URL changes via Navbar search
  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery)
    setInputValue(initialQuery)
  }

  // Sync debounced input back to URL
  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    const currentUrlQuery = searchParams.get('q') || ''
    if (trimmed !== currentUrlQuery) {
      if (trimmed) {
        setSearchParams({ q: trimmed, page: '1' }, { replace: true })
      } else {
        setSearchParams({}, { replace: true })
      }
    }
  }, [debouncedQuery, searchParams, setSearchParams])

  const { data, isLoading, isError, error, isFetching, refetch } = useSearchMovies(
    debouncedQuery,
    page
  )

  const hasQuery = debouncedQuery.trim().length > 0
  const results = data?.results || []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Search Movies
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Find any movie by title across the TMDB database.
        </p>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a movie title (e.g., Interstellar, Dune, Inception)..."
            aria-label="Search movies by title"
            autoFocus
            className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 py-3.5 pl-12 pr-4 text-sm sm:text-base text-white placeholder:text-zinc-500 shadow-lg focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {!hasQuery ? (
        <div className="my-16 flex flex-col items-center justify-center text-center text-zinc-500">
          <Film className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm sm:text-base text-zinc-400">
            Start typing above to search thousands of movies.
          </p>
        </div>
      ) : isLoading ? (
        <MovieGridSkeleton count={12} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : results.length === 0 ? (
        <div className="my-16 rounded-2xl border border-white/10 bg-zinc-900/50 p-10 text-center">
          <p className="text-base font-medium text-white">
            No movies found for "{debouncedQuery.trim()}"
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Try checking the spelling or searching with fewer keywords.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm text-zinc-400">
            Showing results for{' '}
            <span className="font-semibold text-white">"{debouncedQuery.trim()}"</span>{' '}
            ({data?.total_results?.toLocaleString()} found)
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {results.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={data?.total_pages}
            onPageChange={(nextPage) =>
              setSearchParams({ q: debouncedQuery.trim(), page: String(nextPage) })
            }
            isFetching={isFetching}
          />
        </>
      )}
    </div>
  )
}
