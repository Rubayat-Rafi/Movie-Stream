import { useQuery } from '@tanstack/react-query'
import {
  Bookmark,
  CreditCard,
  Crown,
  Film,
  Mail,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { backendApi } from '../../api/backend'
import { getImageUrl } from '../../api/tmdb'
import { ErrorState } from '../../components/ui/ErrorState'
import { useAuth } from '../../hooks/useAuth'

export function DashboardOverview() {
  const { user } = useAuth()

  const overviewQuery = useQuery({
    queryKey: ['dashboard', 'overview', user?.id, user?.role],
    queryFn: backendApi.getDashboardOverview,
    enabled: Boolean(user),
  })

  if (overviewQuery.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-900/80" />
        ))}
      </div>
    )
  }

  if (overviewQuery.isError) {
    return <ErrorState error={overviewQuery.error} onRetry={overviewQuery.refetch} />
  }

  const personal = overviewQuery.data?.personal
  const admin = overviewQuery.data?.admin
  const subscription = personal?.subscription || user?.subscription

  return (
    <div className="space-y-8">
      {/* Admin Platform Stats */}
      {user?.role === 'ADMIN' && admin && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Platform Analytics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Total Users</span>
                <Users className="h-5 w-5 text-rose-400" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-white">{admin.totalUsers}</p>
              <Link to="/dashboard/users" className="mt-2 inline-block text-xs text-rose-400 hover:underline">
                Manage users →
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Active Subscribers</span>
                <Crown className="h-5 w-5 text-amber-400" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-white">
                {admin.activeSubscriptions}
              </p>
              <p className="mt-2 text-xs text-zinc-400">Across all paid plans</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Estimated MRR</span>
                <CreditCard className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-white">
                ${admin.estimatedMrr.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-emerald-400">Monthly recurring revenue</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Email Campaigns</span>
                <Mail className="h-5 w-5 text-sky-400" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-white">
                {admin.campaignsCount ?? 0}
              </p>
              <Link to="/dashboard/campaigns" className="mt-2 inline-block text-xs text-sky-400 hover:underline">
                Open campaigns →
              </Link>
            </div>
          </div>

          {/* Plan Breakdown */}
          {admin.planBreakdown?.length > 0 && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-[#0d111a] p-6">
              <h3 className="text-base font-bold text-white">Subscription Plan Breakdown</h3>
              <div className="mt-4 space-y-3.5">
                {admin.planBreakdown.map((p) => {
                  const pct =
                    admin.activeSubscriptions > 0
                      ? Math.round((p.subscribers / admin.activeSubscriptions) * 100)
                      : 0
                  return (
                    <div key={p.id}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-200">{p.name}</span>
                        <span className="text-zinc-400">
                          {p.subscribers} subscribers ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Personal Stats */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Your Activity
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Your Plan</span>
              <Crown className="h-5 w-5 text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {subscription?.plan?.name || 'Free Tier'}
            </p>
            <Link
              to="/dashboard/subscriptions"
              className="mt-2 inline-block text-xs text-rose-400 hover:underline"
            >
              Manage billing →
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Saved in Watchlist</span>
              <Bookmark className="h-5 w-5 text-rose-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {personal?.watchlistCount ?? 0}
            </p>
            <Link
              to="/dashboard/watchlist"
              className="mt-2 inline-block text-xs text-rose-400 hover:underline"
            >
              Open watchlist →
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Movies Watched</span>
              <Film className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {personal?.historyCount ?? 0}
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              {personal?.profilesCount ?? 1} viewer profiles
            </p>
          </div>
        </div>
      </section>

      {/* Recently Watched */}
      <section className="rounded-2xl border border-white/10 bg-[#0d111a] p-6">
        <h3 className="text-base font-bold text-white">Recently Watched</h3>
        {personal?.recentHistory?.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {personal.recentHistory.map((item) => {
              const thumb = getImageUrl(item.posterPath, 'w342')
              return (
                <Link
                  key={item.id}
                  to={`/movie/${item.movieId}`}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-900"
                >
                  <div className="aspect-[2/3] bg-zinc-800">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-500">
                        <Film className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-medium text-white">{item.title}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-400">
            Play any movie trailer on the site and it will appear here automatically.
          </p>
        )}
      </section>
    </div>
  )
}
