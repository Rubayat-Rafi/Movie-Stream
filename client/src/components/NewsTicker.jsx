import { useQuery } from '@tanstack/react-query'
import { Megaphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { backendApi } from '../api/backend'

export function NewsTicker() {
  const marketingQuery = useQuery({
    queryKey: ['marketing', 'public'],
    queryFn: backendApi.getPublicMarketing,
    staleTime: 1000 * 60 * 2,
    retry: false,
  })

  const tickers = marketingQuery.data?.tickers || []
  if (tickers.length === 0) return null

  // Duplicate list for seamless infinite marquee loop
  const looped = [...tickers, ...tickers]

  return (
    <div className="relative z-40 border-b border-rose-500/20 bg-gradient-to-r from-rose-950/90 via-[#120912] to-rose-950/90 text-xs text-zinc-100 overflow-hidden">
      <div className="mx-auto flex h-9 max-w-7xl items-center">
        <div className="z-10 flex h-full shrink-0 items-center gap-1.5 bg-rose-600 px-3 font-bold uppercase tracking-wider text-[11px] text-white shadow-lg">
          <Megaphone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Live News</span>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="animate-ticker flex items-center gap-10 pl-6">
            {looped.map((item, idx) => {
              const content = (
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span className="rounded bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-300">
                    {item.badge || 'NEW'}
                  </span>
                  <span className="text-zinc-200 hover:text-white transition">
                    {item.text}
                  </span>
                </span>
              )

              return item.link ? (
                <Link key={`${item.id}-${idx}`} to={item.link} className="shrink-0">
                  {content}
                </Link>
              ) : (
                <div key={`${item.id}-${idx}`} className="shrink-0">
                  {content}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
