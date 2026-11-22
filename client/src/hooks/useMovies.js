import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  discoverMovies,
  getMovieDetails,
  getMovieGenres,
  getMoviesByCategory,
  getTrendingMovies,
  searchMovies,
} from '../api/tmdb'

export function useTrendingMovies(timeWindow = 'day', page = 1) {
  return useQuery({
    queryKey: ['movies', 'trending', timeWindow, page],
    queryFn: () => getTrendingMovies(timeWindow, page),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })
}

export function useMoviesByCategory(category = 'popular', page = 1) {
  return useQuery({
    queryKey: ['movies', 'category', category, page],
    queryFn: () => getMoviesByCategory(category, page),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })
}

export function useMovieDetails(movieId) {
  return useQuery({
    queryKey: ['movie', 'details', movieId],
    queryFn: () => getMovieDetails(movieId),
    enabled: Boolean(movieId),
    staleTime: 1000 * 60 * 10,
  })
}

export function useMovieGenres() {
  return useQuery({
    queryKey: ['movies', 'genres'],
    queryFn: getMovieGenres,
    staleTime: 1000 * 60 * 60 * 24, // Genres rarely change
  })
}

export function useDiscoverMovies({ genreId = '', sortBy = 'popularity.desc', page = 1 } = {}) {
  return useQuery({
    queryKey: ['movies', 'discover', genreId, sortBy, page],
    queryFn: () => discoverMovies({ genreId, sortBy, page }),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })
}

export function useSearchMovies(query, page = 1) {
  const trimmedQuery = query.trim()
  return useQuery({
    queryKey: ['movies', 'search', trimmedQuery, page],
    queryFn: () => searchMovies(trimmedQuery, page),
    enabled: trimmedQuery.length > 0,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })
}
