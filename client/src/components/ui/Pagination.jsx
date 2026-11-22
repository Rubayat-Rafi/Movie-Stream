import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, totalPages, onPageChange, isFetching = false }) {
  // TMDB caps paginated endpoints at 500 pages
  const safeTotalPages = Math.min(totalPages || 1, 500)

  if (safeTotalPages <= 1) return null

  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <button
        type="button"
        disabled={page <= 1 || isFetching}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/90 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>

      <span className="rounded-xl border border-white/5 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400">
        Page <strong className="text-white">{page}</strong> of{' '}
        <span className="text-zinc-300">{safeTotalPages}</span>
      </span>

      <button
        type="button"
        disabled={page >= safeTotalPages || isFetching}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/90 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
