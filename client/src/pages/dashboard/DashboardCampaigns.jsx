import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Send,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { backendApi } from '../../api/backend'
import { ErrorState } from '../../components/ui/ErrorState'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../utils/formatters'

const AUDIENCE_LABELS = {
  ALL_USERS: 'All Users',
  ACTIVE_SUBSCRIBERS: 'Active Subscribers',
  FREE_USERS: 'Free Users',
  PREMIUM_USERS: 'Premium Members',
}

export function DashboardCampaigns() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [subject, setSubject] = useState('')
  const [audience, setAudience] = useState('ALL_USERS')
  const [body, setBody] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  const campaignsQuery = useQuery({
    queryKey: ['dashboard', 'campaigns'],
    queryFn: backendApi.getCampaigns,
    enabled: user?.role === 'ADMIN',
  })

  const createMutation = useMutation({
    mutationFn: (sendNow) =>
      backendApi.createCampaign({ subject, audience, body, sendNow }),
    onSuccess: (data, sendNow) => {
      setSubject('')
      setBody('')
      setStatusMsg(
        sendNow
          ? `Campaign "${data.campaign.subject}" sent to ${data.campaign.recipientCount} recipients!`
          : `Draft "${data.campaign.subject}" saved.`
      )
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
    },
  })

  const sendMutation = useMutation({
    mutationFn: (id) => backendApi.sendCampaign(id),
    onSuccess: (data) => {
      setStatusMsg(`Campaign "${data.campaign.subject}" sent!`)
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'campaigns'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => backendApi.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
    },
  })

  if (user?.role !== 'ADMIN') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-amber-400" />
        <h2 className="mt-3 text-lg font-bold text-white">Admin Access Required</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Only administrators can compose and send email campaigns.
        </p>
      </div>
    )
  }

  const campaigns = campaignsQuery.data?.campaigns || []
  const audienceCounts = campaignsQuery.data?.audienceCounts || {}

  return (
    <div className="space-y-8">
      {/* Audience Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(AUDIENCE_LABELS).map(([key, label]) => (
          <div
            key={key}
            className="rounded-2xl border border-white/10 bg-[#0d111a] p-4"
          >
            <p className="text-xs font-medium text-zinc-400">{label}</p>
            <p className="mt-1.5 text-2xl font-bold text-white">
              {audienceCounts[key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {/* Compose New Campaign */}
      <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-6">
        <div className="flex items-center gap-2.5">
          <Mail className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-bold text-white">Create Email Campaign</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Target specific subscriber segments and broadcast movie drops or promotions.
        </p>

        {statusMsg && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs sm:text-sm text-emerald-300">
            {statusMsg}
          </div>
        )}

        {createMutation.isError && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs sm:text-sm text-rose-300">
            {createMutation.error.message}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setStatusMsg('')
            createMutation.mutate(true)
          }}
          className="mt-5 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email Subject
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., New 4K Releases This Weekend on StreamMovies"
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Target Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none cursor-pointer"
              >
                {Object.entries(AUDIENCE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label} ({audienceCounts[key] ?? 0})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Message Content
            </label>
            <textarea
              rows={4}
              required
              minLength={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your newsletter announcement or offer..."
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500 cursor-pointer disabled:opacity-60"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Campaign Now
            </button>

            <button
              type="button"
              disabled={createMutation.isPending || !subject.trim() || !body.trim()}
              onClick={() => {
                setStatusMsg('')
                createMutation.mutate(false)
              }}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10 cursor-pointer disabled:opacity-40"
            >
              Save as Draft
            </button>
          </div>
        </form>
      </div>

      {/* Campaign History */}
      {campaignsQuery.isLoading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-900/70" />
      ) : campaignsQuery.isError ? (
        <ErrorState error={campaignsQuery.error} onRetry={campaignsQuery.refetch} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d111a]">
          <div className="border-b border-white/10 px-6 py-4">
            <h3 className="text-base font-bold text-white">Campaign History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Audience</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Recipients</th>
                  <th className="px-5 py-3.5">Open Rate</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-white">{c.subject}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">{c.body}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-300">
                      {AUDIENCE_LABELS[c.audience] || c.audience}
                    </td>
                    <td className="px-5 py-3.5">
                      {c.status === 'SENT' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Sent {c.sentAt ? `• ${formatDate(c.sentAt)}` : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                          <Clock className="h-3 w-3" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-200">{c.recipientCount}</td>
                    <td className="px-5 py-3.5 text-zinc-200">
                      {c.status === 'SENT' ? `${c.openRate}%` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {c.status !== 'SENT' && (
                          <button
                            type="button"
                            onClick={() => sendMutation.mutate(c.id)}
                            disabled={sendMutation.isPending}
                            className="rounded-lg bg-rose-600/20 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-600 hover:text-white cursor-pointer"
                          >
                            Send
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(c.id)}
                          disabled={deleteMutation.isPending}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                          aria-label="Delete campaign"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-400">
                      No email campaigns yet. Create your first one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
