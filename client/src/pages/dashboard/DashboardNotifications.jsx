import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Loader2, Send, ShieldAlert } from 'lucide-react'
import { backendApi } from '../../api/backend'
import { useAuth } from '../../hooks/useAuth'

export function DashboardNotifications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('UPDATE')
  const [audience, setAudience] = useState('ALL_USERS')
  const [link, setLink] = useState('/pricing')
  const [statusMsg, setStatusMsg] = useState('')

  const broadcastMutation = useMutation({
    mutationFn: () =>
      backendApi.broadcastNotification({
        title,
        message,
        type,
        audience,
        link: link.trim() || null,
      }),
    onSuccess: (data) => {
      setStatusMsg(`Notification delivered to ${data.sentCount} users!`)
      setTitle('')
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  if (user?.role !== 'ADMIN') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-amber-400" />
        <h2 className="mt-3 text-lg font-bold text-white">Admin Access Required</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Only administrators can broadcast update notifications.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#0d111a] p-6 sm:p-8">
      <div className="flex items-center gap-2.5">
        <Bell className="h-5 w-5 text-rose-500" />
        <h2 className="text-lg font-bold text-white">Broadcast Update Notification</h2>
      </div>
      <p className="mt-1 text-xs text-zinc-400">
        Instantly alert users in their Navbar & Dashboard notification bell about new movies, promos, or platform updates.
      </p>

      {statusMsg && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs sm:text-sm text-emerald-300">
          {statusMsg}
        </div>
      )}
      {broadcastMutation.isError && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs sm:text-sm text-rose-300">
          {broadcastMutation.error.message}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setStatusMsg('')
          broadcastMutation.mutate()
        }}
        className="mt-5 space-y-4"
      >
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Notification Title *
          </label>
          <input
            type="text"
            required
            minLength={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., New 4K Movies Dropped This Weekend!"
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
            >
              <option value="UPDATE">Platform Update</option>
              <option value="NEW_MOVIE">New Movie Release</option>
              <option value="PROMO">Promo / Coupon Offer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Target Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
            >
              <option value="ALL_USERS">All Users</option>
              <option value="ACTIVE_SUBSCRIBERS">Active Subscribers</option>
              <option value="FREE_USERS">Free Users</option>
              <option value="PREMIUM_USERS">Premium Members</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Message *
          </label>
          <textarea
            rows={3}
            required
            minLength={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a concise alert message..."
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Action Link (optional)
          </label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/pricing or /discover"
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={broadcastMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500 cursor-pointer"
        >
          {broadcastMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send Notification
        </button>
      </form>
    </div>
  )
}
