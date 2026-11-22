import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Lock, Save } from 'lucide-react'
import { backendApi } from '../../api/backend'
import { useAuth } from '../../hooks/useAuth'

const AVATAR_COLORS = ['#e11d48', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2']

export function DashboardSettings() {
  const { user, refreshUser } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || '#e11d48')
  const [profileMsg, setProfileMsg] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordErr, setPasswordErr] = useState('')

  const profileMutation = useMutation({
    mutationFn: (payload) => backendApi.updateProfile(payload),
    onSuccess: async () => {
      await refreshUser()
      setProfileMsg('Profile settings saved.')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: (payload) => backendApi.changePassword(payload),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setPasswordErr('')
      setPasswordMsg('Password updated successfully.')
    },
    onError: (err) => {
      setPasswordMsg('')
      setPasswordErr(err.message)
    },
  })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* General Settings */}
      <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-6">
        <h2 className="text-lg font-bold text-white">General Settings</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Update your display name and profile avatar accent color.
        </p>

        {profileMsg && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-300">
            {profileMsg}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setProfileMsg('')
            profileMutation.mutate({ name, avatarColor })
          }}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Avatar Color
            </label>
            <div className="flex items-center gap-2.5">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  aria-label={`Select color ${color}`}
                  className={`h-8 w-8 rounded-full transition cursor-pointer ${
                    avatarColor === color
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d111a] scale-110'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={profileMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Security / Change Password */}
      <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-6">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-bold text-white">Security & Password</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Keep your account secure with a strong password.
        </p>

        {passwordMsg && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-300">
            {passwordMsg}
          </div>
        )}
        {passwordErr && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
            {passwordErr}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            passwordMutation.mutate({ currentPassword, newPassword })
          }}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 cursor-pointer"
          >
            {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
