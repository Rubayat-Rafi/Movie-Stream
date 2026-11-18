const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

/**
 * Error thrown when the TMDB Read Access Token is missing from environment variables.
 */
export class TmdbConfigError extends Error {
  constructor(message = 'TMDB API Read Access Token is not configured.') {
    super(message)
    this.name = 'TmdbConfigError'
  }
}

/**
 * Build a full TMDB image URL for posters, backdrops, or profile photos.
 * Returns null when path is missing so components can render a fallback.
 */
export function getImageUrl(path, size = 'w500') {
  if (!path) return null
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
}

/**
 * Core TMDB API v3 fetch wrapper using Bearer token authentication.
 */
async function tmdbFetch(endpoint, params = {}) {
  const token = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN?.trim()

  if (!token) {
    throw new TmdbConfigError(
      'Missing VITE_TMDB_READ_ACCESS_TOKEN. Add your TMDB API Read Access Token to a .env file in the project root.'
    )
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    let errorMessage = `TMDB request failed (${response.status})`
    try {
      const errorData = await response.json()
      if (errorData?.status_message) {
        errorMessage = errorData.status_message
      }
    } catch {
      // Ignore JSON parse failure on non-JSON error responses
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export function getTrendingMovies(timeWindow = 'day', page = 1) {
  return tmdbFetch(`/trending/movie/${timeWindow}`, {
    language: 'en-US',
    page,
  })
}

export function getMoviesByCategory(category = 'popular', page = 1) {
  return tmdbFetch(`/movie/${category}`, {
    language: 'en-US',
    page,
  })
}

export function getMovieDetails(movieId) {
  return tmdbFetch(`/movie/${movieId}`, {
    language: 'en-US',
    append_to_response: 'credits,videos,similar,recommendations',
  })
}

export function getMovieGenres() {
  return tmdbFetch('/genre/movie/list', {
    language: 'en-US',
  })
}

export function discoverMovies({ genreId = '', sortBy = 'popularity.desc', page = 1 } = {}) {
  return tmdbFetch('/discover/movie', {
    language: 'en-US',
    include_adult: false,
    include_video: false,
    sort_by: sortBy,
    with_genres: genreId || undefined,
    'vote_count.gte': sortBy.includes('vote_average') ? 200 : undefined,
    page,
  })
}

export function searchMovies(query, page = 1) {
  return tmdbFetch('/search/movie', {
    query,
    language: 'en-US',
    include_adult: false,
    page,
  })
}
