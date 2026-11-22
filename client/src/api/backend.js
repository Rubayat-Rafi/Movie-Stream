const API_BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'stream_movies_token'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function apiFetch(path, options = {}) {
  const token = getStoredToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export const backendApi = {
  // Auth
  register: (payload) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiFetch('/auth/me'),
  updateProfile: (payload) =>
    apiFetch('/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
  changePassword: (payload) =>
    apiFetch('/auth/password', { method: 'PATCH', body: JSON.stringify(payload) }),
  createProfile: (payload) =>
    apiFetch('/auth/profiles', { method: 'POST', body: JSON.stringify(payload) }),
  deleteProfile: (profileId) =>
    apiFetch(`/auth/profiles/${profileId}`, { method: 'DELETE' }),

  // Subscriptions
  getPlans: () => apiFetch('/subscriptions/plans'),
  createPlan: (payload) =>
    apiFetch('/subscriptions/plans', { method: 'POST', body: JSON.stringify(payload) }),
  updatePlan: (id, payload) =>
    apiFetch(`/subscriptions/plans/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deletePlan: (id) =>
    apiFetch(`/subscriptions/plans/${id}`, { method: 'DELETE' }),
  getMySubscription: () => apiFetch('/subscriptions/me'),
  subscribe: (payload) =>
    apiFetch('/subscriptions/subscribe', { method: 'POST', body: JSON.stringify(payload) }),
  cancelSubscription: () =>
    apiFetch('/subscriptions/cancel', { method: 'POST' }),
  resumeSubscription: () =>
    apiFetch('/subscriptions/resume', { method: 'POST' }),

  // Watchlist
  getWatchlist: () => apiFetch('/watchlist'),
  toggleWatchlist: (movie) =>
    apiFetch('/watchlist', {
      method: 'POST',
      body: JSON.stringify({
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path || null,
        backdropPath: movie.backdrop_path || null,
        voteAverage: movie.vote_average || 0,
        releaseDate: movie.release_date || null,
      }),
    }),

  // Watch History
  getHistory: () => apiFetch('/history'),
  recordHistory: (movie, progressPercent = 30) =>
    apiFetch('/history', {
      method: 'POST',
      body: JSON.stringify({
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path || null,
        backdropPath: movie.backdrop_path || null,
        progressPercent,
      }),
    }),

  // Dashboard & Admin
  getDashboardOverview: () => apiFetch('/dashboard/overview'),
  getAdminUsers: ({ search = '', role = '' } = {}) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    const qs = params.toString()
    return apiFetch(`/dashboard/admin/users${qs ? `?${qs}` : ''}`)
  },
  updateUserRole: (userId, role) =>
    apiFetch(`/dashboard/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  deleteAdminUser: (userId) =>
    apiFetch(`/dashboard/admin/users/${userId}`, { method: 'DELETE' }),

  // Email Campaigns
  getCampaigns: () => apiFetch('/campaigns'),
  createCampaign: (payload) =>
    apiFetch('/campaigns', { method: 'POST', body: JSON.stringify(payload) }),
  sendCampaign: (campaignId) =>
    apiFetch(`/campaigns/${campaignId}/send`, { method: 'POST' }),
  deleteCampaign: (campaignId) =>
    apiFetch(`/campaigns/${campaignId}`, { method: 'DELETE' }),

  // Custom Uploaded Movies
  getCustomMovies: () => apiFetch('/movies'),
  getCustomMovie: (id) => apiFetch(`/movies/${id}`),
  getAdminMovies: (search = '') =>
    apiFetch(`/movies/admin/all${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  uploadMovie: async (formData) => {
    const token = getStoredToken()
    const res = await fetch(`${API_BASE}/movies`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
    return data
  },
  updateCustomMovie: (id, payload) =>
    apiFetch(`/movies/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCustomMovie: (id) =>
    apiFetch(`/movies/${id}`, { method: 'DELETE' }),

  // Coupons
  validateCoupon: (payload) =>
    apiFetch('/coupons/validate', { method: 'POST', body: JSON.stringify(payload) }),
  getCoupons: () => apiFetch('/coupons'),
  createCoupon: (payload) =>
    apiFetch('/coupons', { method: 'POST', body: JSON.stringify(payload) }),
  toggleCoupon: (id) =>
    apiFetch(`/coupons/${id}/toggle`, { method: 'PATCH' }),
  deleteCoupon: (id) =>
    apiFetch(`/coupons/${id}`, { method: 'DELETE' }),

  // Payments (StreamHub Gateway)
  createPayment: (payload) =>
    apiFetch('/payments/create', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPayment: (ref) =>
    apiFetch(`/payments/verify/${encodeURIComponent(ref)}`, { method: 'POST' }),
  getPaymentStatus: (ref) =>
    apiFetch(`/payments/status/${encodeURIComponent(ref)}`),
  getMyPayments: () => apiFetch('/payments/my'),
  getAdminPayments: () => apiFetch('/payments/admin/all'),

  // Notifications
  getNotifications: () => apiFetch('/notifications'),
  markNotificationRead: (id) =>
    apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    apiFetch('/notifications/read-all', { method: 'PATCH' }),
  broadcastNotification: (payload) =>
    apiFetch('/notifications/broadcast', { method: 'POST', body: JSON.stringify(payload) }),

  // Dynamic Marketing (News Ticker & Promo Popups)
  getPublicMarketing: () => apiFetch('/marketing/public'),
  getTickers: () => apiFetch('/marketing/tickers'),
  createTicker: (payload) =>
    apiFetch('/marketing/tickers', { method: 'POST', body: JSON.stringify(payload) }),
  updateTicker: (id, payload) =>
    apiFetch(`/marketing/tickers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteTicker: (id) =>
    apiFetch(`/marketing/tickers/${id}`, { method: 'DELETE' }),
  getPopups: () => apiFetch('/marketing/popups'),
  createPopup: (payload) =>
    apiFetch('/marketing/popups', { method: 'POST', body: JSON.stringify(payload) }),
  updatePopup: (id, payload) =>
    apiFetch(`/marketing/popups/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deletePopup: (id) =>
    apiFetch(`/marketing/popups/${id}`, { method: 'DELETE' }),
}
