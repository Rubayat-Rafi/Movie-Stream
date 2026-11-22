import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, ShieldAlert, Tag, Trash2 } from 'lucide-react'
import { backendApi } from '../../api/backend'
import { ErrorState } from '../../components/ui/ErrorState'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../utils/formatters'

export function DashboardCoupons() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('20')
  const [usageLimit, setUsageLimit] = useState('')
  const [minOrderAmount, setMinOrderAmount] = useState('0')
  const [expiryDate, setExpiryDate] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  const couponsQuery = useQuery({
    queryKey: ['dashboard', 'coupons', user?.id],
    queryFn: backendApi.getCoupons,
    enabled: user?.role === 'ADMIN',
  })

  const createMutation = useMutation({
    mutationFn: () =>
      backendApi.createCoupon({
        code,
        discountType,
        discountValue: Number(discountValue),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        minOrderAmount: Number(minOrderAmount) || 0,
        expiryDate: expiryDate || null,
      }),
    onSuccess: (data) => {
      setStatusMsg(`Coupon "${data.coupon.code}" created!`)
      setCode('')
      setUsageLimit('')
      setExpiryDate('')
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'coupons'] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => backendApi.toggleCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'coupons'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => backendApi.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'coupons'] })
    },
  })

  if (user?.role !== 'ADMIN') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-amber-400" />
        <h2 className="mt-3 text-lg font-bold text-white">Admin Access Required</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Only administrators can create and manage promo coupons.
        </p>
      </div>
    )
  }

  const coupons = couponsQuery.data?.coupons || []

  return (
    <div className="space-y-8">
      {/* Create Coupon Form */}
      <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-6">
        <div className="flex items-center gap-2.5">
          <Tag className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-bold text-white">Create Promo Coupon</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Generate percentage or fixed-dollar discount codes usable on the Pricing & Checkout page.
        </p>

        {statusMsg && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
            {statusMsg}
          </div>
        )}
        {createMutation.isError && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
            {createMutation.error.message}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setStatusMsg('')
            createMutation.mutate()
          }}
          className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., SAVE30"
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Discount Type
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount ($)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Discount Value *
            </label>
            <input
              type="number"
              required
              step="0.01"
              min={1}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Usage Limit (optional)
            </label>
            <input
              type="number"
              min={1}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Unlimited"
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Min Order Amount ($)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Expiry Date (optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 pt-1">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500 cursor-pointer"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Coupon
            </button>
          </div>
        </form>
      </div>

      {/* Coupons Table */}
      {couponsQuery.isLoading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-900/70" />
      ) : couponsQuery.isError ? (
        <ErrorState error={couponsQuery.error} onRetry={couponsQuery.refetch} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d111a]">
          <div className="border-b border-white/10 px-6 py-4">
            <h3 className="text-base font-bold text-white">Active & Past Coupons</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Discount</th>
                  <th className="px-5 py-3.5">Usage</th>
                  <th className="px-5 py-3.5">Expiry</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-mono font-bold text-white">{c.code}</td>
                    <td className="px-5 py-3.5 text-emerald-400 font-semibold">
                      {c.discountType === 'PERCENTAGE'
                        ? `${Number(c.discountValue)}% OFF`
                        : `$${Number(c.discountValue).toFixed(2)} OFF`}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-300">
                      {c.usedCount} / {c.usageLimit || '∞'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-400">
                      {c.expiryDate ? formatDate(c.expiryDate) : 'No expiry'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(c.id)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer ${
                          c.isActive
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border border-white/10 bg-white/5 text-zinc-400'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(c.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                        aria-label={`Delete ${c.code}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-400">
                      No coupons yet. Create your first promo code above.
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
