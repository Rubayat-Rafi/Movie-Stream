export function formatRuntime(minutes) {
  if (!minutes || minutes <= 0) return 'N/A'
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

export function formatYear(dateString) {
  if (!dateString) return 'TBA'
  const year = new Date(dateString).getFullYear()
  return Number.isNaN(year) ? 'TBA' : String(year)
}

export function formatDate(dateString) {
  if (!dateString) return 'TBA'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'TBA'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatRating(voteAverage) {
  if (typeof voteAverage !== 'number' || voteAverage <= 0) return 'NR'
  return voteAverage.toFixed(1)
}

export function formatCurrency(amount) {
  if (!amount || amount <= 0) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Pick the best YouTube trailer/teaser from TMDB videos results.
 */
export function getPrimaryTrailer(videos = []) {
  if (!Array.isArray(videos) || videos.length === 0) return null
  const youtubeVideos = videos.filter((v) => v.site === 'YouTube')
  return (
    youtubeVideos.find((v) => v.type === 'Trailer' && v.official) ||
    youtubeVideos.find((v) => v.type === 'Trailer') ||
    youtubeVideos.find((v) => v.type === 'Teaser') ||
    youtubeVideos[0] ||
    null
  )
}
