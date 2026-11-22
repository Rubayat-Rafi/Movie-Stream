import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { backendApi, getStoredToken, setStoredToken } from '../api/backend'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [watchlist, setWatchlist] = useState([])
  const [history, setHistory] = useState([])
  const [authLoading, setAuthLoading] = useState(() => Boolean(getStoredToken()))

  const loadUserData = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      setWatchlist([])
      setHistory([])
      setAuthLoading(false)
      return
    }

    try {
      const [meRes, wlRes, histRes] = await Promise.all([
        backendApi.getMe(),
        backendApi.getWatchlist(),
        backendApi.getHistory(),
      ])
      setUser(meRes.user)
      setWatchlist(
        (wlRes.items || []).map((item) => ({
          id: item.movieId,
          title: item.title,
          poster_path: item.posterPath,
          backdrop_path: item.backdropPath,
          vote_average: item.voteAverage,
          release_date: item.releaseDate,
        }))
      )
      setHistory(histRes.items || [])
    } catch {
      setStoredToken(null)
      setUser(null)
      setWatchlist([])
      setHistory([])
    } finally {
      setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    let cancelled = false
    Promise.all([
      backendApi.getMe(),
      backendApi.getWatchlist(),
      backendApi.getHistory(),
    ])
      .then(([meRes, wlRes, histRes]) => {
        if (cancelled) return
        setUser(meRes.user)
        setWatchlist(
          (wlRes.items || []).map((item) => ({
            id: item.movieId,
            title: item.title,
            poster_path: item.posterPath,
            backdrop_path: item.backdropPath,
            vote_average: item.voteAverage,
            release_date: item.releaseDate,
          }))
        )
        setHistory(histRes.items || [])
      })
      .catch(() => {
        if (cancelled) return
        setStoredToken(null)
        setUser(null)
        setWatchlist([])
        setHistory([])
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const signUp = async ({ name, email, password }) => {
    const data = await backendApi.register({ name, email, password })
    queryClient.clear()
    setStoredToken(data.token)
    setUser(data.user)
    setWatchlist([])
    setHistory([])
    return data.user
  }

  const signIn = async ({ email, password }) => {
    const data = await backendApi.login({ email, password })
    queryClient.clear()
    setStoredToken(data.token)
    await loadUserData()
    return data.user
  }

  const signOut = () => {
    setStoredToken(null)
    setUser(null)
    setWatchlist([])
    setHistory([])
    queryClient.clear()
  }

  const refreshUser = async () => {
    await loadUserData()
  }

  const toggleWatchlist = async (movie) => {
    if (!movie?.id) return
    if (!user) {
      throw new Error('Please sign in to save movies to your watchlist.')
    }
    const res = await backendApi.toggleWatchlist(movie)
    if (res.saved) {
      setWatchlist((prev) => [
        {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
        },
        ...prev.filter((m) => m.id !== movie.id),
      ])
    } else {
      setWatchlist((prev) => prev.filter((m) => m.id !== movie.id))
    }
  }

  const recordWatchHistory = async (movie, progressPercent = 35) => {
    if (!user || !movie?.id) return
    try {
      const res = await backendApi.recordHistory(movie, progressPercent)
      setHistory((prev) => [
        res.item,
        ...prev.filter((h) => h.movieId !== movie.id),
      ])
    } catch {
      // Non-blocking telemetry
    }
  }

  const isInWatchlist = (movieId) => watchlist.some((m) => m.id === Number(movieId))

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        watchlist,
        history,
        subscription: user?.subscription || null,
        signIn,
        signUp,
        signOut,
        refreshUser,
        toggleWatchlist,
        recordWatchHistory,
        isInWatchlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
