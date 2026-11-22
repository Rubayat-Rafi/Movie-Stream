import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Copy, Sparkles, Tag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { backendApi } from '../api/backend'

export function PromoPopupModal() {
  const [dismissedId, setDismissedId] = useState(() => {
    try {
      return Number(sessionStorage.getItem('stream_movies_dismissed_popup') || 0)
    } catch {
      return 0
    }
  })
  const [copied, setCopied] = useState(false)

  const marketingQuery = useQuery({
    queryKey: ['marketing', 'public'],
    queryFn: backendApi.getPublicMarketing,
    staleTime: 1000 * 60 * 2,
    retry: false,
  })

  const popup = marketingQuery.data?.activePopup
  const isVisible = Boolean(
    popup && popup.isActive && (!popup.showOncePerSession || dismissedId !== popup.id)
  )

  const handleClose = () => {
    if (!popup) return
    setDismissedId(popup.id)
    try {
      sessionStorage.setItem('stream_movies_dismissed_popup', String(popup.id))
    } catch {
      // Ignore storage error
    }
  }

  useEffect(() => {
    if (!isVisible) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  })

  if (!isVisible || !popup) return null

  const copyCode = () => {
    if (!popup.couponCode) return
    navigator.clipboard?.writeText(popup.couponCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={popup.title}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#0d111a] shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close announcement"
          className="absolute top-3.5 right-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-zinc-300 backdrop-blur-md transition hover:bg-black/85 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {popup.imageUrl && (
          <div className="h-44 w-full overflow-hidden bg-zinc-900">
            <img
              src={popup.imageUrl}
              alt={popup.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-7 text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
            <Sparkles className="h-3.5 w-3.5" />
            Special Announcement
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            {popup.title}
          </h2>

          <p className="mt-2.5 text-sm text-zinc-300 leading-relaxed">
            {popup.message}
          </p>

          {popup.couponCode && (
            <button
              type="button"
              onClick={copyCode}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-rose-500/50 bg-rose-500/10 px-4 py-2 text-xs font-mono font-bold text-rose-300 transition hover:bg-rose-500/20 cursor-pointer"
            >
              <Tag className="h-3.5 w-3.5" />
              <span>{popup.couponCode}</span>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 opacity-75" />
              )}
            </button>
          )}

          <div className="mt-6 flex flex-col gap-2.5">
            {popup.buttonLink && (
              <Link
                to={popup.buttonLink}
                onClick={handleClose}
                className="w-full rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500"
              >
                {popup.buttonText || 'Claim Offer'}
              </Link>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-xl py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
