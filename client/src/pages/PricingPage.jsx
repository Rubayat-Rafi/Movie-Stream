import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, Crown, Loader2, ShieldCheck, Sparkles, Tag, Tv, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { backendApi } from '../api/backend'
import { ErrorState } from '../components/ui/ErrorState'
import { useAuth } from '../hooks/useAuth'

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('MONTHLY')
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const { user, subscription, refreshUser } = useAuth()
  const navigate = useNavigate()

  const plansQuery = useQuery({
    queryKey: ['subscription', 'plans'],
    queryFn: backendApi.getPlans,
  })

  const validateCouponMutation = useMutation({
    mutationFn: (code) =>
      backendApi.validateCoupon({
        code,
        orderAmount: 19.99,
      }),
    onSuccess: (data) => {
      setCouponError('')
      setAppliedCoupon(data.coupon)
    },
    onError: (err) => {
      setAppliedCoupon(null)
      setCouponError(err.message)
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: (planSlug) =>
      backendApi.createPayment({
        planSlug,
        billingCycle,
        couponCode: appliedCoupon?.code || '',
      }),
    onSuccess: async (data) => {
      if (data.mode === 'free_coupon') {
        await refreshUser()
        navigate('/dashboard/subscriptions')
        return
      }
      if (data.mode === 'stratos' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      if (data.checkoutUrl) {
        navigate(data.checkoutUrl)
      }
    },
  })

  const handleSelectPlan = (planSlug) => {
    if (!user) {
      navigate(`/auth?mode=signup&plan=${planSlug}`)
      return
    }
    checkoutMutation.mutate(planSlug)
  }

  const handleApplyCoupon = (e) => {
    e.preventDefault()
    const trimmed = couponInput.trim()
    if (!trimmed) return
    setCouponError('')
    validateCouponMutation.mutate(trimmed)
  }

  const computeDiscountedPrice = (basePrice) => {
    if (!appliedCoupon) return basePrice
    const discount =
      appliedCoupon.discountType === 'PERCENTAGE'
        ? (basePrice * appliedCoupon.discountValue) / 100
        : appliedCoupon.discountValue
    return Math.max(0, basePrice - discount)
  }

  const plans = plansQuery.data?.plans || []

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-[34rem] -translate-x-1/2 rounded-full bg-rose-600/20 blur-[140px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
            <Crown className="h-3.5 w-3.5" />
            StreamMovies Membership
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Choose the plan that’s right for you
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Watch all you want. Ad-free. Apply a promo coupon at checkout and cancel anytime.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-7 inline-flex items-center rounded-full border border-white/10 bg-zinc-900/90 p-1">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                billingCycle === 'MONTHLY'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('YEARLY')}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                billingCycle === 'YEARLY'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Save 20%
              </span>
            </button>
          </div>

          {/* Coupon Code Bar */}
          <div className="mx-auto mt-6 max-w-md">
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs sm:text-sm text-emerald-300">
                <span className="inline-flex items-center gap-2 font-semibold">
                  <Tag className="h-4 w-4" />
                  Coupon {appliedCoupon.code} applied (
                  {appliedCoupon.discountType === 'PERCENTAGE'
                    ? `${appliedCoupon.discountValue}% OFF`
                    : `$${appliedCoupon.discountValue} OFF`}
                  )
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null)
                    setCouponInput('')
                  }}
                  className="rounded-lg p-1 text-emerald-200 hover:bg-white/10 cursor-pointer"
                  aria-label="Remove coupon"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Have a coupon? Try WELCOME20"
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/90 py-2.5 pl-10 pr-3 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={validateCouponMutation.isPending}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 cursor-pointer"
                >
                  {validateCouponMutation.isPending ? 'Checking...' : 'Apply'}
                </button>
              </form>
            )}
            {couponError && (
              <p className="mt-2 text-xs text-rose-400">{couponError}</p>
            )}
          </div>
        </div>

        {checkoutMutation.isError && (
          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-300">
            {checkoutMutation.error.message}
          </div>
        )}

        {plansQuery.isLoading ? (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[440px] animate-pulse rounded-3xl border border-white/10 bg-zinc-900/60"
              />
            ))}
          </div>
        ) : plansQuery.isError ? (
          <ErrorState
            error={plansQuery.error}
            onRetry={plansQuery.refetch}
            title="Unable to load subscription plans"
          />
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const basePrice =
                billingCycle === 'YEARLY'
                  ? Number(plan.priceYearly)
                  : Number(plan.priceMonthly)
              const finalPrice = computeDiscountedPrice(basePrice)
              const isCurrentPlan =
                subscription?.plan?.slug === plan.slug &&
                subscription?.status === 'ACTIVE' &&
                subscription?.billingCycle === billingCycle
              const features = Array.isArray(plan.features) ? plan.features : []

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-3xl border p-6 sm:p-8 transition-all ${
                    plan.isPopular
                      ? 'border-rose-500/60 bg-gradient-to-b from-rose-950/35 via-[#0d111a] to-[#0d111a] shadow-2xl shadow-rose-950/30'
                      : 'border-white/10 bg-[#0d111a]/80 hover:border-white/25'
                  }`}
                >
                  {plan.isPopular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-rose-600 px-3.5 py-1 text-xs font-bold text-white shadow-lg">
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                      <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-zinc-200">
                        {plan.resolution}
                      </span>
                    </div>

                    <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-white">
                        ${finalPrice.toFixed(2)}
                      </span>
                      {appliedCoupon && finalPrice < basePrice && (
                        <span className="text-sm text-zinc-500 line-through">
                          ${basePrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-sm text-zinc-400">
                        /{billingCycle === 'YEARLY' ? 'year' : 'month'}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-4 border-y border-white/10 py-3 text-xs text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <Tv className="h-4 w-4 text-rose-400" />
                        {plan.maxScreens} {plan.maxScreens === 1 ? 'Screen' : 'Screens'}
                      </span>
                      <span>•</span>
                      <span>Quality: {plan.videoQuality}</span>
                    </div>

                    <ul className="mt-5 space-y-3">
                      {features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={isCurrentPlan || checkoutMutation.isPending}
                    onClick={() => handleSelectPlan(plan.slug)}
                    className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition cursor-pointer disabled:cursor-default ${
                      isCurrentPlan
                        ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : plan.isPopular
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 hover:bg-rose-500'
                        : 'border border-white/15 bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {checkoutMutation.isPending &&
                    checkoutMutation.variables === plan.slug ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {isCurrentPlan
                      ? 'Current Active Plan'
                      : user
                      ? `Continue to Payment`
                      : `Get Started with ${plan.name}`}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>StreamHub Payment Gateway • Instant verification & coupon support</span>
        </div>
      </div>
    </div>
  )
}
