import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { backendApi } from '../../api/backend'
import { useAuth } from '../../hooks/useAuth'

export function DashboardProfiles() {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [isKids, setIsKids] = useState(false)

  const addMutation = useMutation({
    mutationFn: (payload) => backendApi.createProfile(payload),
    onSuccess: async () => {
      setName('')
      setIsKids(false)
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => backendApi.deleteProfile(id),
    onSuccess: async () => {
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
    },
  })

  const profiles = user?.profiles || []

  return (
    <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#0d111a] p-6 sm:p-8">
      <h2 className="text-xl font-bold text-white">Viewer Profiles</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Create up to 5 Netflix-style viewer profiles for your household.
      </p>

      <div className="mt-6 space-y-3">
        {profiles.map((prof) => (
          <div
            key={prof.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3.5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-sm font-bold text-white">
                {prof.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{prof.name}</p>
                <p className="text-xs text-zinc-400">
                  {prof.isKids ? 'Kids Profile' : 'Standard Profile'}
                </p>
              </div>
            </div>

            {profiles.length > 1 && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate(prof.id)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                aria-label={`Delete ${prof.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          addMutation.mutate({ name: name.trim(), isKids })
        }}
        className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add profile name..."
          className="flex-1 min-w-[180px] rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
        />

        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isKids}
            onChange={(e) => setIsKids(e.target.checked)}
            className="accent-rose-600"
          />
          Kids Profile
        </label>

        <button
          type="submit"
          disabled={addMutation.isPending || profiles.length >= 5}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 cursor-pointer disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Profile
        </button>
      </form>
    </div>
  )
}
