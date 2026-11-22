import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Eye,
  Film,
  Image as ImageIcon,
  Loader2,
  Play,
  ShieldAlert,
  Star,
  Trash2,
  Upload,
  Video,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { backendApi } from '../../api/backend'
import { ErrorState } from '../../components/ui/ErrorState'
import { useAuth } from '../../hooks/useAuth'

const INITIAL_FORM = {
  title: '',
  tagline: '',
  overview: '',
  genres: 'Action, Sci-Fi',
  releaseYear: '2026',
  runtimeMinutes: '124',
  rating: '8.5',
  maturityRating: 'PG-13',
  videoQuality: '4K HDR',
  posterUrl: '',
  backdropUrl: '',
  videoUrl: '',
  status: 'PUBLISHED',
  isFeatured: false,
}

export function DashboardMovies() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [form, setForm] = useState(INITIAL_FORM)
  const [posterFile, setPosterFile] = useState(null)
  const [backdropFile, setBackdropFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  const posterInputRef = useRef(null)
  const backdropInputRef = useRef(null)
  const videoInputRef = useRef(null)

  const moviesQuery = useQuery({
    queryKey: ['dashboard', 'admin', 'movies'],
    queryFn: () => backendApi.getAdminMovies(),
    enabled: user?.role === 'ADMIN',
  })

  const uploadMutation = useMutation({
    mutationFn: (formData) => backendApi.uploadMovie(formData),
    onSuccess: (data) => {
      setSuccessMsg(`"${data.movie.title}" uploaded successfully!`)
      setForm(INITIAL_FORM)
      setPosterFile(null)
      setBackdropFile(null)
      setVideoFile(null)
      if (posterInputRef.current) posterInputRef.current.value = ''
      if (backdropInputRef.current) backdropInputRef.current.value = ''
      if (videoInputRef.current) videoInputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin', 'movies'] })
      queryClient.invalidateQueries({ queryKey: ['custom-movies'] })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => backendApi.updateCustomMovie(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin', 'movies'] })
      queryClient.invalidateQueries({ queryKey: ['custom-movies'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => backendApi.deleteCustomMovie(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin', 'movies'] })
      queryClient.invalidateQueries({ queryKey: ['custom-movies'] })
    },
  })

  if (user?.role !== 'ADMIN') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-amber-400" />
        <h2 className="mt-3 text-lg font-bold text-white">Admin Access Required</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Only administrators can upload and manage custom movies.
        </p>
      </div>
    )
  }

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSuccessMsg('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    if (posterFile) fd.append('poster', posterFile)
    if (backdropFile) fd.append('backdrop', backdropFile)
    if (videoFile) fd.append('video', videoFile)
    uploadMutation.mutate(fd)
  }

  const movies = moviesQuery.data?.movies || []

  return (
    <div className="space-y-8">
      {/* Upload Form */}
      <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-6">
        <div className="flex items-center gap-2.5">
          <Upload className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-bold text-white">Upload New Movie</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Upload poster, backdrop, and video files directly (up to 500MB) or paste external image/video/YouTube URLs.
        </p>

        {successMsg && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs sm:text-sm text-emerald-300">
            {successMsg}
          </div>
        )}

        {uploadMutation.isError && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs sm:text-sm text-rose-300">
            {uploadMutation.error.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Row 1: Title & Tagline */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Movie Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Neon Horizon"
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Tagline
              </label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder="e.g., The future belongs to the fearless."
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Metadata */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Release Year
              </label>
              <input
                type="number"
                min={1900}
                max={2100}
                value={form.releaseYear}
                onChange={(e) => handleChange('releaseYear', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Runtime (mins)
              </label>
              <input
                type="number"
                min={1}
                max={600}
                value={form.runtimeMinutes}
                onChange={(e) => handleChange('runtimeMinutes', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Rating (0-10)
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={10}
                value={form.rating}
                onChange={(e) => handleChange('rating', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Maturity
              </label>
              <select
                value={form.maturityRating}
                onChange={(e) => handleChange('maturityRating', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="G">G</option>
                <option value="PG">PG</option>
                <option value="PG-13">PG-13</option>
                <option value="16+">16+</option>
                <option value="R">R / 18+</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Video Quality
              </label>
              <select
                value={form.videoQuality}
                onChange={(e) => handleChange('videoQuality', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="720p HD">720p HD</option>
                <option value="1080p Full HD">1080p Full HD</option>
                <option value="4K HDR">4K HDR</option>
              </select>
            </div>
          </div>

          {/* Row 3: Genres & Overview */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Genres (comma separated)
            </label>
            <input
              type="text"
              value={form.genres}
              onChange={(e) => handleChange('genres', e.target.value)}
              placeholder="Action, Sci-Fi, Thriller"
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Synopsis / Overview *
            </label>
            <textarea
              rows={3}
              required
              minLength={10}
              value={form.overview}
              onChange={(e) => handleChange('overview', e.target.value)}
              placeholder="Write a compelling movie description..."
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* Row 4: Media Uploads OR URLs */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Poster */}
            <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <ImageIcon className="h-4 w-4 text-rose-400" />
                Poster Image
              </div>
              <input
                ref={posterInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-zinc-400 file:mr-2.5 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-white/20 cursor-pointer"
              />
              <input
                type="url"
                value={form.posterUrl}
                onChange={(e) => handleChange('posterUrl', e.target.value)}
                placeholder="Or paste poster URL..."
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Backdrop */}
            <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <ImageIcon className="h-4 w-4 text-sky-400" />
                Backdrop Banner
              </div>
              <input
                ref={backdropInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setBackdropFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-zinc-400 file:mr-2.5 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-white/20 cursor-pointer"
              />
              <input
                type="url"
                value={form.backdropUrl}
                onChange={(e) => handleChange('backdropUrl', e.target.value)}
                placeholder="Or paste backdrop URL..."
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Video */}
            <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <Video className="h-4 w-4 text-emerald-400" />
                Movie / Trailer Video
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-zinc-400 file:mr-2.5 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-white/20 cursor-pointer"
              />
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => handleChange('videoUrl', e.target.value)}
                placeholder="Or paste MP4 / YouTube URL..."
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 5: Status, Featured, Submit */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center gap-5">
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="PUBLISHED">Publish Immediately</option>
                <option value="DRAFT">Save as Draft</option>
              </select>

              <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => handleChange('isFeatured', e.target.checked)}
                  className="accent-rose-600"
                />
                Mark as Featured Original
              </label>
            </div>

            <button
              type="submit"
              disabled={uploadMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500 cursor-pointer disabled:opacity-60"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Movie'}
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Movies Catalog */}
      {moviesQuery.isLoading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-900/70" />
      ) : moviesQuery.isError ? (
        <ErrorState error={moviesQuery.error} onRetry={moviesQuery.refetch} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d111a]">
          <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              Uploaded Movies ({movies.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5">Movie</th>
                  <th className="px-5 py-3.5">Quality</th>
                  <th className="px-5 py-3.5">Views</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movies.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-800">
                          {m.posterUrl ? (
                            <img
                              src={m.posterUrl}
                              alt={m.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-zinc-500">
                              <Film className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{m.title}</p>
                          <p className="text-xs text-zinc-400">
                            {m.releaseYear} • {m.genres} •{' '}
                            <span className="inline-flex items-center gap-0.5 text-amber-400">
                              <Star className="h-3 w-3 fill-amber-400" />
                              {m.rating}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-200">
                        {m.videoQuality}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-zinc-300">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-zinc-400" />
                        {m.views}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: m.id,
                            status: m.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
                          })
                        }
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer ${
                          m.status === 'PUBLISHED'
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {m.status}
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/originals/${m.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-600"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          Watch
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(m.id)}
                          disabled={deleteMutation.isPending}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                          aria-label={`Delete ${m.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {movies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-zinc-400">
                      No custom movies uploaded yet. Use the form above to publish your first original!
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
