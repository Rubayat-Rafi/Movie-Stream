import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, Eye, Film, Star } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { backendApi } from '../api/backend'
import { ErrorState } from '../components/ui/ErrorState'
import { DetailSkeleton } from '../components/ui/Skeleton'
import { formatRuntime } from '../utils/formatters'

function extractYoutubeEmbed(url) {
  if (!url) return null
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : null
}

export function CustomMoviePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const movieQuery = useQuery({
    queryKey: ['custom-movie', id],
    queryFn: () => backendApi.getCustomMovie(id),
    enabled: Boolean(id),
  })

  if (movieQuery.isLoading) return <DetailSkeleton />
  if (movieQuery.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState error={movieQuery.error} onRetry={movieQuery.refetch} />
      </div>
    )
  }

  const movie = movieQuery.data?.movie
  if (!movie) return null

  const youtubeEmbed = extractYoutubeEmbed(movie.videoUrl)
  const genreList = (movie.genres || '')
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-zinc-800 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Video Player */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
        <div className="aspect-video w-full bg-zinc-950">
          {youtubeEmbed ? (
            <iframe
              src={youtubeEmbed}
              title={movie.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : movie.videoUrl ? (
            <video
              src={movie.videoUrl}
              poster={movie.backdropUrl || movie.posterUrl || undefined}
              controls
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-500">
              <Film className="h-12 w-12 opacity-50" />
              <p className="text-sm">No video source attached to this movie yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Movie Info */}
      <div className="mt-8 grid gap-8 md:grid-cols-[200px_1fr]">
        <div className="hidden md:block">
          <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500">
                <Film className="h-8 w-8" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-rose-600 px-3 py-0.5 font-bold text-white">
              StreamMovies Original
            </span>
            <span className="rounded border border-white/20 bg-white/5 px-2 py-0.5 text-zinc-200">
              {movie.videoQuality}
            </span>
            <span className="rounded border border-white/20 bg-white/5 px-2 py-0.5 text-zinc-200">
              {movie.maturityRating}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            {movie.title}
          </h1>

          {movie.tagline && (
            <p className="italic text-sm text-zinc-400">"{movie.tagline}"</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-zinc-300">
            <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="h-4 w-4 fill-amber-400" />
              {movie.rating}
            </span>
            <span>{movie.releaseYear}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4 text-zinc-400" />
              {formatRuntime(movie.runtimeMinutes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4 text-zinc-400" />
              {movie.views} views
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {genreList.map((g) => (
              <span
                key={g}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200"
              >
                {g}
              </span>
            ))}
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-zinc-300">
            {movie.overview}
          </p>
        </div>
      </div>
    </div>
  )
}
