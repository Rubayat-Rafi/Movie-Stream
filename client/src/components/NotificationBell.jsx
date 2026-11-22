import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, CreditCard, Film, Sparkles, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { backendApi } from '../api/backend'
import { useAuth } from '../hooks/useAuth'

function getTypeIcon(type) {
  switch (type) {
    case 'NEW_MOVIE':
      return <Film className="h-4 w-4 text-rose-400" />
    case 'PAYMENT':
      return <CreditCard className="h-4 w-4 text-emerald-400" />
    case 'PROMO':
      return <Tag className="h-4 w-4 text-amber-400" />
    default:
      return <Sparkles className="h-4 w-4 text-sky-400" />
  }
}

export function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const notifQuery = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: backendApi.getNotifications,
    enabled: Boolean(user),
    refetchInterval: 30000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => backendApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: backendApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    },
  })

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  if (!user) return null

  const notifications = notifQuery.data?.notifications || []
  const unreadCount = notifQuery.data?.unreadCount || 0

  const handleItemClick = (n) => {
    if (!n.isRead) {
      markReadMutation.mutate(n.id)
    }
    setOpen(false)
    if (n.link) {
      navigate(n.link)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-zinc-900/90 text-zinc-300 transition hover:border-white/25 hover:text-white cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 overflow-hidden rounded-2xl border border-white/10 bg-[#0d111a]/95 shadow-2xl shadow-black/80 backdrop-blur-xl z-50">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-bold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 divide-y divide-white/5 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-zinc-400">
                You’re all caught up! New updates will appear here.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/[0.05] cursor-pointer ${
                    n.isRead ? 'opacity-70' : 'bg-rose-500/[0.04]'
                  }`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    {getTypeIcon(n.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-white">
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
