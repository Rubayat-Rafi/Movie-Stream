import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Loader2,
  Megaphone,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { backendApi } from '../../api/backend'
import { ErrorState } from '../../components/ui/ErrorState'
import { useAuth } from '../../hooks/useAuth'

export function DashboardMarketing() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('ticker') // 'ticker' | 'popup'
  const [feedback, setFeedback] = useState('')

  // Ticker form
  const [tickerText, setTickerText] = useState('')
  const [tickerBadge, setTickerBadge] = useState('NEW')
  const [tickerLink, setTickerLink] = useState('/pricing')
  const [tickerPriority, setTickerPriority] = useState('10')

  // Popup form
  const [popupTitle, setPopupTitle] = useState('')
  const [popupMessage, setPopupMessage] = useState('')
  const [popupImage, setPopupImage] = useState('')
  const [popupBtnText, setPopupBtnText] = useState('Claim Offer')
  const [popupBtnLink, setPopupBtnLink] = useState('/pricing')
  const [popupCoupon, setPopupCoupon] = useState('')
  const [popupOnce, setPopupOnce] = useState(true)

  const tickersQuery = useQuery({
    queryKey: ['dashboard', 'tickers', user?.id],
    queryFn: backendApi.getTickers,
    enabled: user?.role === 'ADMIN',
  })

  const popupsQuery = useQuery({
    queryKey: ['dashboard', 'popups', user?.id],
    queryFn: backendApi.getPopups,
    enabled: user?.role === 'ADMIN',
  })

  const invalidateMarketing = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'tickers'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'popups'] })
    queryClient.invalidateQueries({ queryKey: ['marketing', 'public'] })
  }

  const createTickerMutation = useMutation({
    mutationFn: () =>
      backendApi.createTicker({
        text: tickerText,
        badge: tickerBadge,
        link: tickerLink.trim() || null,
        priority: Number(tickerPriority) || 0,
        isActive: true,
      }),
    onSuccess: () => {
      setTickerText('')
      setFeedback('News ticker item added and live on the website!')
      invalidateMarketing()
    },
  })

  const toggleTickerMutation = useMutation({
    mutationFn: ({ id, isActive }) => backendApi.updateTicker(id, { isActive }),
    onSuccess: invalidateMarketing,
  })

  const deleteTickerMutation = useMutation({
    mutationFn: (id) => backendApi.deleteTicker(id),
    onSuccess: invalidateMarketing,
  })

  const createPopupMutation = useMutation({
    mutationFn: () =>
      backendApi.createPopup({
        title: popupTitle,
        message: popupMessage,
        imageUrl: popupImage.trim() || null,
        buttonText: popupBtnText || 'Claim Offer',
        buttonLink: popupBtnLink || '/pricing',
        couponCode: popupCoupon.trim() || null,
        isActive: true,
        showOncePerSession: popupOnce,
      }),
    onSuccess: () => {
      setPopupTitle('')
      setPopupMessage('')
      setPopupImage('')
      setPopupCoupon('')
      setFeedback('Promo popup created and activated!')
      invalidateMarketing()
    },
  })

  const togglePopupMutation = useMutation({
    mutationFn: ({ id, isActive }) => backendApi.updatePopup(id, { isActive }),
    onSuccess: invalidateMarketing,
  })

  const deletePopupMutation = useMutation({
    mutationFn: (id) => backendApi.deletePopup(id),
    onSuccess: invalidateMarketing,
  })

  if (user?.role !== 'ADMIN') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-amber-400" />
        <h2 className="mt-3 text-lg font-bold text-white">Admin Access Required</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Only administrators can configure sitewide popups and news tickers.
        </p>
      </div>
    )
  }

  const tickers = tickersQuery.data?.tickers || []
  const popups = popupsQuery.data?.popups || []

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => {
            setTab('ticker')
            setFeedback('')
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer ${
            tab === 'ticker'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-zinc-900/70 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          News Ticker ({tickers.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('popup')
            setFeedback('')
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer ${
            tab === 'popup'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-zinc-900/70 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Promo Popups ({popups.length})
        </button>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs sm:text-sm text-emerald-300">
          {feedback}
        </div>
      )}

      {/* TAB 1: NEWS TICKER */}
      {tab === 'ticker' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-6">
            <h2 className="text-lg font-bold text-white">Add News Ticker Item</h2>
            <p className="mt-1 text-xs text-zinc-400">
              Active items scroll continuously in the top Live News bar across the entire site.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                setFeedback('')
                createTickerMutation.mutate()
              }}
              className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Ticker Message *
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={tickerText}
                  onChange={(e) => setTickerText(e.target.value)}
                  placeholder="e.g., New 4K sci-fi originals dropping this Friday!"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Badge
                </label>
                <select
                  value={tickerBadge}
                  onChange={(e) => setTickerBadge(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                >
                  <option value="NEW">NEW</option>
                  <option value="PROMO">PROMO</option>
                  <option value="LIVE">LIVE</option>
                  <option value="UPDATE">UPDATE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Priority (higher = first)
                </label>
                <input
                  type="number"
                  value={tickerPriority}
                  onChange={(e) => setTickerPriority(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Click Link (optional)
                </label>
                <input
                  type="text"
                  value={tickerLink}
                  onChange={(e) => setTickerLink(e.target.value)}
                  placeholder="/pricing or /discover"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={createTickerMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 cursor-pointer"
                >
                  {createTickerMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Ticker
                </button>
              </div>
            </form>
          </div>

          {tickersQuery.isError ? (
            <ErrorState error={tickersQuery.error} onRetry={tickersQuery.refetch} />
          ) : (
            <div className="space-y-3">
              {tickers.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0d111a] px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                        {t.badge}
                      </span>
                      <p className="text-sm font-medium text-white">{t.text}</p>
                    </div>
                    {t.link && (
                      <p className="mt-1 text-xs text-zinc-400">Link: {t.link}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        toggleTickerMutation.mutate({ id: t.id, isActive: !t.isActive })
                      }
                      className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer ${
                        t.isActive
                          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border border-white/10 bg-white/5 text-zinc-400'
                      }`}
                    >
                      {t.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTickerMutation.mutate(t.id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                      aria-label="Delete ticker"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROMO POPUPS */}
      {tab === 'popup' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-6">
            <h2 className="text-lg font-bold text-white">Create Sitewide Promo Popup</h2>
            <p className="mt-1 text-xs text-zinc-400">
              Only one popup is active at a time. Activating a new popup automatically replaces the previous active popup.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                setFeedback('')
                createPopupMutation.mutate()
              }}
              className="mt-5 space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Popup Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={popupTitle}
                    onChange={(e) => setPopupTitle(e.target.value)}
                    placeholder="e.g., Weekend Flash Sale — 30% Off!"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Coupon Code Badge (optional)
                  </label>
                  <input
                    type="text"
                    value={popupCoupon}
                    onChange={(e) => setPopupCoupon(e.target.value.toUpperCase())}
                    placeholder="WELCOME20"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm font-mono text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Message *
                </label>
                <textarea
                  rows={3}
                  required
                  value={popupMessage}
                  onChange={(e) => setPopupMessage(e.target.value)}
                  placeholder="Describe the promotion or important site update..."
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Banner Image URL (optional)
                  </label>
                  <input
                    type="url"
                    value={popupImage}
                    onChange={(e) => setPopupImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={popupBtnText}
                    onChange={(e) => setPopupBtnText(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    CTA Button Link
                  </label>
                  <input
                    type="text"
                    value={popupBtnLink}
                    onChange={(e) => setPopupBtnLink(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popupOnce}
                    onChange={(e) => setPopupOnce(e.target.checked)}
                    className="accent-rose-600"
                  />
                  Show once per browser session
                </label>

                <button
                  type="submit"
                  disabled={createPopupMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 cursor-pointer"
                >
                  {createPopupMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Publish Popup
                </button>
              </div>
            </form>
          </div>

          {popupsQuery.isError ? (
            <ErrorState error={popupsQuery.error} onRetry={popupsQuery.refetch} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {popups.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0d111a] p-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-white">{p.title}</h3>
                      <button
                        type="button"
                        onClick={() =>
                          togglePopupMutation.mutate({ id: p.id, isActive: !p.isActive })
                        }
                        className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold cursor-pointer ${
                          p.isActive
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border border-white/10 bg-white/5 text-zinc-400'
                        }`}
                      >
                        {p.isActive ? 'Live' : 'Inactive'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{p.message}</p>
                    {p.couponCode && (
                      <span className="mt-3 inline-block rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 font-mono text-xs font-bold text-rose-300">
                        {p.couponCode}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-400">
                    <span>
                      CTA: {p.buttonText} ({p.buttonLink})
                    </span>
                    <button
                      type="button"
                      onClick={() => deletePopupMutation.mutate(p.id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                      aria-label="Delete popup"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
