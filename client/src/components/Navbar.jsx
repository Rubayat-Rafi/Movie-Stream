import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  Clapperboard,
  Crown,
  Film,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Search,
  Star,
  User as UserIcon,
  X,
} from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { getImageUrl } from '../api/tmdb'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'
import { useSearchMovies } from '../hooks/useMovies'
import { formatRating, formatYear } from '../utils/formatters'
import { NotificationBell } from './NotificationBell'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Discover', to: '/discover' },
  { label: 'Popular', to: '/movies/popular' },
  { label: 'Top Rated', to: '/movies/top-rated' },
  { label: 'Plans', to: '/pricing' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const searchContainerRef = useRef(null)
  const userMenuRef = useRef(null)
  const navigate = useNavigate()

  const { user, watchlist, signOut } = useAuth()

  const debouncedQuery = useDebounce(searchQuery, 300)
  const { data: searchData, isFetching } = useSearchMovies(debouncedQuery, 1)
  const liveResults = (searchData?.results || []).slice(0, 6)
  const hasTyped = searchQuery.trim().length > 0

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false)
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    setDropdownOpen(false)
    setMobileOpen(false)
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const handleSelectMovie = () => {
    setDropdownOpen(false)
    setMobileOpen(false)
    setSearchQuery('')
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07090e]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#07090e]/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-white transition hover:opacity-90 shrink-0"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-600/30">
            <Clapperboard className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Stream<span className="text-rose-500">Movies</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 rounded-full border border-white/5 bg-white/[0.03] p-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-950/50'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Controls: Live Search + Auth + Mobile Toggle */}
        <div className="flex items-center gap-2.5">
          <div ref={searchContainerRef} className="hidden sm:block relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => hasTyped && setDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setDropdownOpen(e.target.value.trim().length > 0)
                }}
                placeholder="Search movies..."
                aria-label="Search movies"
                className="w-48 md:w-56 xl:w-64 rounded-full border border-white/10 bg-zinc-900/90 py-2 pl-10 pr-8 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-rose-500/70 focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
              {isFetching && hasTyped && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-rose-400" />
              )}
            </form>

            {/* Live Search Dropdown */}
            {dropdownOpen && hasTyped && (
              <div className="absolute right-0 mt-2.5 w-80 lg:w-96 overflow-hidden rounded-2xl border border-white/10 bg-[#0d111a]/95 shadow-2xl shadow-black/80 backdrop-blur-xl">
                {debouncedQuery.trim() !== searchQuery.trim() || isFetching ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                    Searching...
                  </div>
                ) : liveResults.length === 0 ? (
                  <div className="px-4 py-7 text-center text-sm text-zinc-400">
                    No movies found for "{debouncedQuery.trim()}"
                  </div>
                ) : (
                  <>
                    <div className="max-h-[380px] divide-y divide-white/5 overflow-y-auto">
                      {liveResults.map((movie) => {
                        const thumb = getImageUrl(movie.poster_path, 'w185')
                        return (
                          <Link
                            key={movie.id}
                            to={`/movie/${movie.id}`}
                            onClick={handleSelectMovie}
                            className="flex items-center gap-3 px-3.5 py-2.5 transition hover:bg-white/[0.06]"
                          >
                            <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-800 border border-white/10">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={movie.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                  <Film className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">
                                {movie.title}
                              </p>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
                                <span>{formatYear(movie.release_date)}</span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-amber-400">
                                  <Star className="h-3 w-3 fill-amber-400" />
                                  {formatRating(movie.vote_average)}
                                </span>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="flex w-full items-center justify-center gap-1.5 border-t border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer"
                    >
                      View all results for "{searchQuery.trim()}"
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <Link
            to="/search"
            aria-label="Search page"
            className="sm:hidden rounded-lg p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <Search className="h-5 w-5" />
          </Link>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Auth / User Account */}
          {user ? (
            <div ref={userMenuRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/90 py-1.5 pl-1.5 pr-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-zinc-800 cursor-pointer"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-xs font-bold text-white">
                  {userInitial}
                </span>
                <span className="max-w-[100px] truncate hidden md:inline">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2.5 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#0d111a]/95 p-1.5 shadow-2xl shadow-black/80 backdrop-blur-xl">
                  <div className="border-b border-white/10 px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                    <p className="truncate text-xs text-zinc-400">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4 text-rose-400" />
                        Dashboard
                      </span>
                      {user.subscription?.plan?.name && (
                        <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                          {user.subscription.plan.name}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/pricing"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Crown className="h-4 w-4 text-amber-400" />
                      Subscription Plans
                    </Link>

                    <Link
                      to="/watchlist"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4 text-rose-400" />
                        My Watchlist
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
                        {watchlist.length}
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        signOut()
                        setUserMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/auth?mode=signin"
                className="rounded-full px-3.5 py-2 text-xs lg:text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/auth?mode=signup"
                className="rounded-full bg-rose-600 px-4 py-2 text-xs lg:text-sm font-semibold text-white shadow-md shadow-rose-950/50 transition hover:bg-rose-500"
              >
                Sign Up
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className="lg:hidden rounded-lg p-2 text-zinc-300 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#0b0e16]/95 backdrop-blur-xl px-4 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative sm:hidden">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies..."
              aria-label="Search movies"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
            />
          </form>

          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-rose-600/20 text-rose-400'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <NavLink
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-rose-600/20 text-rose-400'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/watchlist"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-rose-600/20 text-rose-400'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span>My Watchlist</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {watchlist.length}
              </span>
            </NavLink>
          </nav>

          <div className="border-t border-white/10 pt-3">
            {user ? (
              <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3.5 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
                    {userInitial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{user.name}</p>
                    <p className="truncate text-xs text-zinc-400">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    signOut()
                    setMobileOpen(false)
                  }}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/auth?mode=signin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-white"
                >
                  <UserIcon className="h-4 w-4" />
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
