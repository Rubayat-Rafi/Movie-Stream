import { useState } from 'react'
import { AuthContext } from './authContextValue'

const USERS_KEY = 'stream_movies_dummy_users'
const SESSION_KEY = 'stream_movies_current_user'
const WATCHLIST_KEY = 'stream_movies_watchlist'

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStorage(SESSION_KEY, null))
  const [watchlist, setWatchlist] = useState(() => readStorage(WATCHLIST_KEY, []))

  const saveSession = (nextUser) => {
    setUser(nextUser)
    if (nextUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }

  const signUp = ({ name, email, password }) => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()

    if (!cleanName || !cleanEmail || password.length < 6) {
      throw new Error('Please fill in all fields (password must be at least 6 characters).')
    }

    const users = readStorage(USERS_KEY, [])
    if (users.some((u) => u.email === cleanEmail)) {
      throw new Error('An account with this email already exists.')
    }

    const newUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: cleanName,
      email: cleanEmail,
      password,
    }

    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]))
    saveSession({ id: newUser.id, name: newUser.name, email: newUser.email })
  }

  const signIn = ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase()
    const users = readStorage(USERS_KEY, [])

    const matched = users.find(
      (u) => u.email === cleanEmail && u.password === password
    )

    if (!matched) {
      throw new Error('Invalid email or password. Try signing up or using the Demo Account.')
    }

    saveSession({ id: matched.id, name: matched.name, email: matched.email })
  }

  const signInDemo = () => {
    saveSession({
      id: 'demo-user',
      name: 'Alex Mercer',
      email: 'demo@streammovies.app',
      isDemo: true,
    })
  }

  const signOut = () => {
    saveSession(null)
  }

  const toggleWatchlist = (movie) => {
    if (!movie?.id) return
    setWatchlist((prev) => {
      const exists = prev.some((m) => m.id === movie.id)
      const next = exists
        ? prev.filter((m) => m.id !== movie.id)
        : [
            {
              id: movie.id,
              title: movie.title,
              poster_path: movie.poster_path,
              vote_average: movie.vote_average,
              release_date: movie.release_date,
            },
            ...prev,
          ]
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next))
      return next
    })
  }

  const isInWatchlist = (movieId) => watchlist.some((m) => m.id === Number(movieId))

  return (
    <AuthContext.Provider
      value={{
        user,
        watchlist,
        signIn,
        signUp,
        signInDemo,
        signOut,
        toggleWatchlist,
        isInWatchlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
