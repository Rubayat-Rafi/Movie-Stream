import { useState } from 'react'
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Clapperboard,
  CreditCard,
  DollarSign,
  Film,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Settings,
  Tag,
  Users,
  UserSquare2,
  X,
} from 'lucide-react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { NotificationBell } from '../../components/NotificationBell'
import { useAuth } from '../../hooks/useAuth'

const MAIN_ITEMS = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Subscriptions', to: '/dashboard/subscriptions', icon: CreditCard },
  { label: 'My Watchlist', to: '/dashboard/watchlist', icon: Bookmark },
  { label: 'Profiles', to: '/dashboard/profiles', icon: UserSquare2 },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
]

const ADMIN_ITEMS = [
  { label: 'Upload & Movies', to: '/dashboard/movies', icon: Film },
  { label: 'Payments', to: '/dashboard/payments', icon: DollarSign },
  { label: 'Coupons', to: '/dashboard/coupons', icon: Tag },
  { label: 'Popups & Ticker', to: '/dashboard/marketing', icon: Megaphone },
  { label: 'Notifications', to: '/dashboard/notifications', icon: Bell },
  { label: 'Users List', to: '/dashboard/users', icon: Users },
  { label: 'Email Campaigns', to: '/dashboard/campaigns', icon: Mail },
]

const PAGE_TITLES = {
  '/dashboard': 'Dashboard Overview',
  '/dashboard/movies': 'Upload & Manage Movies',
  '/dashboard/payments': 'Payment Management',
  '/dashboard/coupons': 'Promo Coupons',
  '/dashboard/marketing': 'Popups & News Ticker',
  '/dashboard/notifications': 'Push Notifications',
  '/dashboard/subscriptions': 'Subscriptions & Billing',
  '/dashboard/watchlist': 'My Watchlist',
  '/dashboard/profiles': 'Viewer Profiles',
  '/dashboard/settings': 'Account Settings',
  '/dashboard/users': 'Users Management',
  '/dashboard/campaigns': 'Email Campaigns',
}

export function DashboardLayout() {
  const { user, authLoading, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090e]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth?mode=signin" replace />
  }

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard'
  const userInitial = user.name?.charAt(0)?.toUpperCase() || 'U'

  const renderNavLink = (item) => {
    const Icon = item.icon
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={() => setSidebarOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
            isActive
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
              : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
          }`
        }
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    )
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0b0e16] border-r border-white/10">
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow">
            <Clapperboard className="h-4 w-4" />
          </span>
          <span className="text-base font-bold tracking-tight">
            Stream<span className="text-rose-500">Movies</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Dashboard
          </p>
          <nav className="space-y-1">{MAIN_ITEMS.map(renderNavLink)}</nav>
        </div>

        {user.role === 'ADMIN' && (
          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Admin Tools
            </p>
            <nav className="space-y-1">{ADMIN_ITEMS.map(renderNavLink)}</nav>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-white/10 p-3 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Streaming Site
        </Link>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: user.avatarColor || '#e11d48' }}
            >
              {userInitial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-zinc-400">{user.role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            title="Sign Out"
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#07090e] text-zinc-100">
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="w-64 max-w-[80vw] h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Right Main Screen */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#07090e]/85 px-4 sm:px-6 lg:px-8 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="lg:hidden rounded-lg border border-white/10 bg-zinc-900 p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            {user.subscription?.plan?.name && (
              <span className="hidden sm:inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
                {user.subscription.plan.name} Plan
              </span>
            )}
            <Link
              to="/pricing"
              className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
            >
              Upgrade
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
