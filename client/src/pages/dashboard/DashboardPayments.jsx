import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Crown,
  DollarSign,
  Edit3,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Tag,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import { backendApi } from '../../api/backend'
import { ErrorState } from '../../components/ui/ErrorState'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../utils/formatters'

const EMPTY_PLAN = {
  name: '',
  description: '',
  priceMonthly: '9.99',
  priceYearly: '95.99',
  videoQuality: 'Great',
  resolution: '1080p (Full HD)',
  maxScreens: '2',
  downloadsEnabled: true,
  isPopular: false,
  featuresText: 'Unlimited movies & trailers\nWatch on 2 screens at once\n1080p Full HD quality',
}

export function DashboardPayments() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState('plans') // 'plans' | 'transactions'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Dynamic Plan Editor state
  const [editingId, setEditingId] = useState(null)
  const [planForm, setPlanForm] = useState(EMPTY_PLAN)
  const [planFeedback, setPlanFeedback] = useState('')

  const plansQuery = useQuery({
    queryKey: ['subscription', 'plans'],
    queryFn: backendApi.getPlans,
    enabled: user?.role === 'ADMIN',
  })

  const paymentsQuery = useQuery({
    queryKey: ['dashboard', 'admin', 'payments', user?.id],
    queryFn: backendApi.getAdminPayments,
    enabled: user?.role === 'ADMIN',
  })

  const savePlanMutation = useMutation({
    mutationFn: (payload) =>
      editingId
        ? backendApi.updatePlan(editingId, payload)
        : backendApi.createPlan(payload),
    onSuccess: (data) => {
      setPlanFeedback(
        editingId
          ? `Updated "${data.plan.name}" plan!`
          : `Created "${data.plan.name}" plan!`
      )
      setEditingId(null)
      setPlanForm(EMPTY_PLAN)
      queryClient.invalidateQueries({ queryKey: ['subscription', 'plans'] })
    },
  })

  const deletePlanMutation = useMutation({
    mutationFn: (id) => backendApi.deletePlan(id),
    onSuccess: () => {
      setPlanFeedback('Plan deleted.')
      queryClient.invalidateQueries({ queryKey: ['subscription', 'plans'] })
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (ref) => backendApi.verifyPayment(ref),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const payments = useMemo(() => paymentsQuery.data?.payments || [], [paymentsQuery.data])
  const plans = plansQuery.data?.plans || []

  const stats = useMemo(() => {
    const succeeded = payments.filter((p) => p.status === 'SUCCESS')
    const pending = payments.filter((p) => p.status === 'PENDING')
    const totalRevenue = succeeded.reduce((sum, p) => sum + Number(p.finalAmount || 0), 0)
    const totalDiscounts = succeeded.reduce((sum, p) => sum + Number(p.discountAmount || 0), 0)
    return {
      totalRevenue,
      totalDiscounts,
      successCount: succeeded.length,
      pendingCount: pending.length,
    }
  }, [payments])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return payments.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false
      if (!q) return true
      return (
        p.externalReference?.toLowerCase().includes(q) ||
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q) ||
        p.couponCode?.toLowerCase().includes(q) ||
        p.plan?.name?.toLowerCase().includes(q)
      )
    })
  }, [payments, search, statusFilter])

  if (user?.role !== 'ADMIN') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-amber-400" />
        <h2 className="mt-3 text-lg font-bold text-white">Admin Access Required</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Only administrators can manage pricing plans and payment transactions.
        </p>
      </div>
    )
  }

  const startEditPlan = (plan) => {
    setPlanFeedback('')
    setEditingId(plan.id)
    setPlanForm({
      name: plan.name,
      description: plan.description,
      priceMonthly: String(Number(plan.priceMonthly)),
      priceYearly: String(Number(plan.priceYearly)),
      videoQuality: plan.videoQuality,
      resolution: plan.resolution,
      maxScreens: String(plan.maxScreens),
      downloadsEnabled: Boolean(plan.downloadsEnabled),
      isPopular: Boolean(plan.isPopular),
      featuresText: Array.isArray(plan.features) ? plan.features.join('\n') : '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlanSubmit = (e) => {
    e.preventDefault()
    setPlanFeedback('')
    const features = planForm.featuresText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    savePlanMutation.mutate({
      name: planForm.name,
      description: planForm.description,
      priceMonthly: Number(planForm.priceMonthly),
      priceYearly: Number(planForm.priceYearly),
      videoQuality: planForm.videoQuality,
      resolution: planForm.resolution,
      maxScreens: Number(planForm.maxScreens),
      downloadsEnabled: planForm.downloadsEnabled,
      isPopular: planForm.isPopular,
      features,
    })
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Revenue</span>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white">
            ${stats.totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Pricing Plans</span>
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white">{plans.length}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Completed Payments</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white">{stats.successCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Coupon Discounts</span>
            <Tag className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white">
            ${stats.totalDiscounts.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setTab('plans')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer ${
            tab === 'plans'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-zinc-900/70 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Crown className="h-4 w-4" />
          Dynamic Pricing Plans ({plans.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('transactions')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer ${
            tab === 'transactions'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-zinc-900/70 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Transactions ({payments.length})
        </button>
      </div>

      {/* TAB 1: DYNAMIC PRICING PLANS */}
      {tab === 'plans' && (
        <div className="space-y-8">
          {/* Create / Edit Plan Form */}
          <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingId ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Changes update the public <code className="text-rose-400">/pricing</code> page immediately.
                </p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setPlanForm(EMPTY_PLAN)
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel Edit
                </button>
              )}
            </div>

            {planFeedback && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
                {planFeedback}
              </div>
            )}
            {(savePlanMutation.isError || deletePlanMutation.isError) && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
                {savePlanMutation.error?.message || deletePlanMutation.error?.message}
              </div>
            )}

            <form onSubmit={handlePlanSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Ultra VIP"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Monthly Price ($) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min={0}
                    value={planForm.priceMonthly}
                    onChange={(e) =>
                      setPlanForm((p) => ({ ...p, priceMonthly: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Yearly Price ($) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min={0}
                    value={planForm.priceYearly}
                    onChange={(e) =>
                      setPlanForm((p) => ({ ...p, priceYearly: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Resolution *
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.resolution}
                    onChange={(e) =>
                      setPlanForm((p) => ({ ...p, resolution: e.target.value }))
                    }
                    placeholder="4K (Ultra HD) + HDR"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Video Quality Label
                  </label>
                  <input
                    type="text"
                    value={planForm.videoQuality}
                    onChange={(e) =>
                      setPlanForm((p) => ({ ...p, videoQuality: e.target.value }))
                    }
                    placeholder="Good / Great / Best"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Max Simultaneous Screens
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={planForm.maxScreens}
                    onChange={(e) =>
                      setPlanForm((p) => ({ ...p, maxScreens: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-end gap-5 pb-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.isPopular}
                      onChange={(e) =>
                        setPlanForm((p) => ({ ...p, isPopular: e.target.checked }))
                      }
                      className="accent-rose-600"
                    />
                    Most Popular Badge
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.downloadsEnabled}
                      onChange={(e) =>
                        setPlanForm((p) => ({ ...p, downloadsEnabled: e.target.checked }))
                      }
                      className="accent-rose-600"
                    />
                    Downloads
                  </label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Short Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={planForm.description}
                    onChange={(e) =>
                      setPlanForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Full HD (1080p) streaming on 2 devices..."
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Features (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={planForm.featuresText}
                    onChange={(e) =>
                      setPlanForm((p) => ({ ...p, featuresText: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savePlanMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500 cursor-pointer"
              >
                {savePlanMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingId ? 'Save Plan Changes' : 'Create Plan'}
              </button>
            </form>
          </div>

          {/* Existing Plans Grid */}
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0d111a] p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                        {plan.isPopular && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-600/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                            <Sparkles className="h-2.5 w-2.5" />
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{plan.resolution}</p>
                    </div>
                    <span className="text-right">
                      <p className="text-lg font-extrabold text-white">
                        ${Number(plan.priceMonthly).toFixed(2)}/mo
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        ${Number(plan.priceYearly).toFixed(2)}/yr
                      </p>
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => startEditPlan(plan)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePlanMutation.mutate(plan.id)}
                    disabled={deletePlanMutation.isPending}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                    aria-label={`Delete ${plan.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT TRANSACTIONS */}
      {tab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by TRX reference, user, email, or coupon..."
                className="w-full rounded-xl border border-white/10 bg-[#0d111a] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0d111a] px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {paymentsQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-zinc-900/70" />
          ) : paymentsQuery.isError ? (
            <ErrorState error={paymentsQuery.error} onRetry={paymentsQuery.refetch} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d111a]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase text-zinc-400">
                    <tr>
                      <th className="px-5 py-3.5">Reference</th>
                      <th className="px-5 py-3.5">Customer</th>
                      <th className="px-5 py-3.5">Plan</th>
                      <th className="px-5 py-3.5">Amount</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3.5">
                          <p className="font-mono text-xs font-semibold text-white">
                            {p.externalReference}
                          </p>
                          <p className="text-[11px] text-zinc-500">{p.provider}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-white">{p.user?.name || 'User'}</p>
                          <p className="text-xs text-zinc-400">{p.user?.email}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-zinc-200">{p.plan?.name}</p>
                          <p className="text-xs text-zinc-400">{p.billingCycle}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-white">
                            ${Number(p.finalAmount).toFixed(2)}
                          </p>
                          {p.couponCode && (
                            <p className="text-[11px] text-emerald-400">
                              {p.couponCode} (-${Number(p.discountAmount).toFixed(2)})
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {p.status === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              Success
                            </span>
                          ) : p.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
                              <XCircle className="h-3 w-3" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-zinc-400">
                          {formatDate(p.completedAt || p.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {p.status === 'PENDING' && (
                            <button
                              type="button"
                              disabled={verifyMutation.isPending}
                              onClick={() => verifyMutation.mutate(p.externalReference)}
                              className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600 hover:text-white cursor-pointer"
                            >
                              Approve & Verify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-10 text-center text-sm text-zinc-400"
                        >
                          No payment transactions found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
