import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { AuthPage } from '../pages/AuthPage'
import { CustomMoviePage } from '../pages/CustomMoviePage'
import { DiscoverPage } from '../pages/DiscoverPage'
import { HomePage } from '../pages/HomePage'
import { MovieDetailPage } from '../pages/MovieDetailPage'
import { MoviesCategoryPage } from '../pages/MoviesCategoryPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PaymentCheckoutPage } from '../pages/PaymentCheckoutPage'
import { PricingPage } from '../pages/PricingPage'
import { SearchPage } from '../pages/SearchPage'
import { WatchlistPage } from '../pages/WatchlistPage'
import { DashboardCampaigns } from '../pages/dashboard/DashboardCampaigns'
import { DashboardCoupons } from '../pages/dashboard/DashboardCoupons'
import { DashboardLayout } from '../pages/dashboard/DashboardLayout'
import { DashboardMarketing } from '../pages/dashboard/DashboardMarketing'
import { DashboardMovies } from '../pages/dashboard/DashboardMovies'
import { DashboardNotifications } from '../pages/dashboard/DashboardNotifications'
import { DashboardOverview } from '../pages/dashboard/DashboardOverview'
import { DashboardPayments } from '../pages/dashboard/DashboardPayments'
import { DashboardProfiles } from '../pages/dashboard/DashboardProfiles'
import { DashboardSettings } from '../pages/dashboard/DashboardSettings'
import { DashboardSubscriptions } from '../pages/dashboard/DashboardSubscriptions'
import { DashboardUsers } from '../pages/dashboard/DashboardUsers'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Main Streaming Site Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/movies/:category" element={<MoviesCategoryPage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/originals/:id" element={<CustomMoviePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment/checkout/:ref" element={<PaymentCheckoutPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Dedicated Left-Sidebar + Right-Screen Dashboard Layout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="movies" element={<DashboardMovies />} />
          <Route path="payments" element={<DashboardPayments />} />
          <Route path="coupons" element={<DashboardCoupons />} />
          <Route path="marketing" element={<DashboardMarketing />} />
          <Route path="notifications" element={<DashboardNotifications />} />
          <Route path="users" element={<DashboardUsers />} />
          <Route path="campaigns" element={<DashboardCampaigns />} />
          <Route path="subscriptions" element={<DashboardSubscriptions />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="profiles" element={<DashboardProfiles />} />
          <Route path="settings" element={<DashboardSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
