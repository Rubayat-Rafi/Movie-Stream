import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, ShieldAlert, Trash2 } from 'lucide-react'
import { backendApi } from '../../api/backend'
import { ErrorState } from '../../components/ui/ErrorState'
import { useAuth } from '../../hooks/useAuth'
import { useDebounce } from '../../hooks/useDebounce'
import { formatDate } from '../../utils/formatters'

export function DashboardUsers() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const usersQuery = useQuery({
    queryKey: ['dashboard', 'admin', 'users', debouncedSearch, roleFilter],
    queryFn: () => backendApi.getAdminUsers({ search: debouncedSearch, role: roleFilter }),
    enabled: user?.role === 'ADMIN',
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => backendApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (userId) => backendApi.deleteAdminUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (user?.role !== 'ADMIN') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-amber-400" />
        <h2 className="mt-3 text-lg font-bold text-white">Admin Access Required</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Sign in with an administrator account to view and manage users.
        </p>
      </div>
    )
  }

  const users = usersQuery.data?.users || []

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full rounded-xl border border-white/10 bg-[#0d111a] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0d111a] px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admins</option>
          <option value="USER">Users</option>
        </select>
      </div>

      {usersQuery.isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-zinc-900/70" />
      ) : usersQuery.isError ? (
        <ErrorState error={usersQuery.error} onRetry={usersQuery.refetch} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d111a]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Subscription</th>
                  <th className="px-5 py-3.5">Activity</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: u.avatarColor || '#e11d48' }}
                        >
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-xs text-zinc-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {u.subscription?.plan ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                          {u.subscription.plan.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">
                          Free
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-zinc-400">
                      {u._count?.watchlist ?? 0} saved • {u._count?.history ?? 0} watched
                    </td>

                    <td className="px-5 py-3.5">
                      <select
                        value={u.role}
                        disabled={u.id === user.id || roleMutation.isPending}
                        onChange={(e) =>
                          roleMutation.mutate({ userId: u.id, role: e.target.value })
                        }
                        className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1 text-xs text-white focus:border-rose-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-zinc-400">
                      {formatDate(u.createdAt)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {u.id !== user.id && (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(u.id)}
                          disabled={deleteMutation.isPending}
                          className="rounded-lg p-2 text-zinc-400 transition hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                          aria-label={`Delete ${u.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-400">
                      No users matched your filter.
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
