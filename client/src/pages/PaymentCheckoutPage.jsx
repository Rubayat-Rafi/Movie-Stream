import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck, Tag } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { backendApi } from '../api/backend'
import { ErrorState } from '../components/ui/ErrorState'
import { useAuth } from '../hooks/useAuth'

export function PaymentCheckoutPage() {
  const { ref } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()
  const [cardHolder, setCardHolder] = useState('')
  const [cardLast4, setCardLast4] = useState('4242 4242 4242 4242')

  const statusQuery = useQuery({
    queryKey: ['payment', 'status', ref],
    queryFn: () => backendApi.getPaymentStatus(ref),
    enabled: Boolean(ref),
  })

  const verifyMutation = useMutation({
    mutationFn: () => backendApi.verifyPayment(ref),
    onSuccess: async () => {
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['payment', 'status', ref] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (statusQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    )
  }

  if (statusQuery.isError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <ErrorState error={statusQuery.error} onRetry={statusQuery.refetch} />
      </div>
    )
  }

  const payment = verifyMutation.data?.payment || statusQuery.data?.payment
  if (!payment) return null

  const isSuccess = payment.status === 'SUCCESS'

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-white/10 bg-[#0d111a] p-6 sm:p-8 shadow-2xl">
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Payment Verified!
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Your <strong className="text-white">{payment.plan?.name}</strong> plan is now active.
            </p>
            <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Reference</span>
                <span className="font-mono text-zinc-200">{payment.externalReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Amount Paid</span>
                <span className="font-semibold text-emerald-400">
                  ${Number(payment.finalAmount).toFixed(2)}
                </span>
              </div>
              {payment.couponCode && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Coupon Applied</span>
                  <span className="font-semibold text-rose-400">{payment.couponCode}</span>
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/subscriptions')}
                className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-500 cursor-pointer"
              >
                Go to Dashboard
              </button>
              <Link
                to="/"
                className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Start Watching
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  StreamHub Secure Gateway ({payment.provider})
                </span>
                <h1 className="mt-1 text-2xl font-bold text-white">Complete Checkout</h1>
              </div>
              <CreditCard className="h-7 w-7 text-rose-500" />
            </div>

            {/* Order Summary */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Plan</span>
                <span className="font-semibold text-white">
                  {payment.plan?.name} ({payment.billingCycle})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Reference</span>
                <span className="font-mono text-xs text-zinc-300">
                  {payment.externalReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Subtotal</span>
                <span className="text-zinc-200">
                  ${Number(payment.originalAmount).toFixed(2)}
                </span>
              </div>
              {Number(payment.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span className="inline-flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    Coupon ({payment.couponCode})
                  </span>
                  <span>-${Number(payment.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-2.5 text-base font-bold text-white">
                <span>Total Due</span>
                <span>${Number(payment.finalAmount).toFixed(2)}</span>
              </div>
            </div>

            {verifyMutation.isError && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
                {verifyMutation.error.message}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                verifyMutation.mutate()
              }}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Card Number (Test Mode)
                </label>
                <input
                  type="text"
                  required
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm font-mono text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={verifyMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500 cursor-pointer disabled:opacity-60"
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Pay ${Number(payment.finalAmount).toFixed(2)} & Activate Plan
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Encrypted payment verification powered by StreamHub Gateway</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
