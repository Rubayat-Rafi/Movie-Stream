import { Clapperboard } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#05070b]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Link to="/" className="flex items-center gap-2 text-white font-bold">
            <Clapperboard className="h-5 w-5 text-rose-500" />
            <span>
              Stream<span className="text-rose-500">Movies</span>
            </span>
          </Link>
          <p className="text-xs text-zinc-500 text-center sm:text-left">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 text-xs sm:text-sm text-zinc-400">
          <Link to="/discover" className="hover:text-white transition">
            Discover
          </Link>
          <Link to="/movies/popular" className="hover:text-white transition">
            Popular
          </Link>
          <Link to="/movies/top-rated" className="hover:text-white transition">
            Top Rated
          </Link>
          <Link to="/movies/upcoming" className="hover:text-white transition">
            Upcoming
          </Link>
          <Link to="/search" className="hover:text-white transition">
            Search
          </Link>
        </div>
      </div>
    </footer>
  )
}
