import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Clock, Crown, Receipt } from 'lucide-react'
import { Link } from 'react-router-dom'
import { backendApi } from '../../api/backend'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../utils/formatters'

export function DashboardSubscriptions() {
  const { user, subscription, refreshUser } = useAuth()
  const queryClient = useQueryClient()

  const myPaymentsQuery = useQuery({
    queryKey: ['payments', 'my', user?.id],
    queryFn: backendApi.getMyPayments,
    enabled: Boolean(user),
  })

  const cancelSubMutation = useMutation({
    mutationFn: backendApi.cancelSubscription,
    onSuccess: async () => {
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
    },
  })

  const resumeSubMutation = useMutation({
    mutationFn: backendApi.resumeSubscription,
    onSuccess: async () => {
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
    },
  })

  const payments = myPaymentsQuery.data?.payments || []

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-6 sm:p-8">
      <h2 className="text-xl font-bold text-white">Your Membership</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Manage your StreamMovies plan, video quality tier, and billing cycle.
      </p>

      {subscription ? (
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
            <div>
              <span className="text-xs uppercase tracking-wider text-zinc-400">
                Active Plan
              </span>
              <p className="mt-1 text-2xl font-bold text-white">
                {subscription.plan.name}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {subscription.plan.resolution} • Up to {subscription.plan.maxScreens}{' '}
                screens • {subscription.billingCycle}
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  subscription.cancelAtPeriodEnd
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-emerald-500/15 text-emerald-300'
                }`}
              >
                {subscription.cancelAtPeriodEnd ? 'Cancels at Period End' : 'Active'}
              </span>
              <p className="mt-2 text-xs text-zinc-400">
                Next renewal: {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/pricing"
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              Switch Plan
            </Link>

            {subscription.cancelAtPeriodEnd ? (
              <button
                type="button"
                onClick={() => resumeSubMutation.mutate()}
                disabled={resumeSubMutation.isPending}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
              >
                Resume Membership
              </button>
            ) : (
              <button
                type="button"
                onClick={() => cancelSubMutation.mutate()}
                disabled={cancelSubMutation.isPending}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-rose-500/15 hover:text-rose-300 cursor-pointer"
              >
                Cancel Membership
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950/60 p-6">
          <p className="text-sm text-zinc-300">
            You don’t have an active paid subscription yet.
          </p>
          <Link
            to="/pricing"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500"
          >
            <Crown className="h-4 w-4" />
            Explore Plans
          </Link>
        </div>
      )}
      </div>

      {/* Personal Billing History */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d111a]">
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-rose-500" />
          <h3 className="text-base font-bold text-white">Billing & Payment History</h3>
        </div>
        {payments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-zinc-400">
            No payment invoices recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase text-zinc-400">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Paid</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-300">
                      {p.externalReference}
                    </td>
                    <td className="px-5 py-3 text-white">{p.plan?.name}</td>
                    <td className="px-5 py-3 font-semibold text-white">
                      ${Number(p.finalAmount).toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      {p.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                          {p.status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-400">
                      {formatDate(p.completedAt || p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
