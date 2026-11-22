import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { MovieCard } from '../components/MovieCard'
import { ErrorState } from '../components/ui/ErrorState'
import { Pagination } from '../components/ui/Pagination'
import { MovieGridSkeleton } from '../components/ui/Skeleton'
import { useMoviesByCategory } from '../hooks/useMovies'

const CATEGORY_META = {
  popular: {
    apiKey: 'popular',
    title: 'Popular Movies',
    subtitle: 'Most watched and talked-about films right now.',
  },
  'top-rated': {
    apiKey: 'top_rated',
    title: 'Top Rated Movies',
    subtitle: 'Critically acclaimed cinema ranked by TMDB voters.',
  },
  upcoming: {
    apiKey: 'upcoming',
    title: 'Upcoming Movies',
    subtitle: 'Soon-to-be-released films hitting theaters.',
  },
  'now-playing': {
    apiKey: 'now_playing',
    title: 'Now Playing',
    subtitle: 'Movies currently screening in theaters.',
  },
}

export function MoviesCategoryPage() {
  const { category = 'popular' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const meta = CATEGORY_META[category] || CATEGORY_META.popular
  const { data, isLoading, isError, error, isFetching, refetch } = useMoviesByCategory(
    meta.apiKey,
    page
  )

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [category, page])

  const handlePageChange = (nextPage) => {
    setSearchParams({ page: String(nextPage) })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {meta.title}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">{meta.subtitle}</p>
      </div>

      {isLoading ? (
        <MovieGridSkeleton count={18} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {data?.results?.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={data?.total_pages}
            onPageChange={handlePageChange}
            isFetching={isFetching}
          />
        </>
      )}
    </div>
  )
}
