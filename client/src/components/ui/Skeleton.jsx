export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 animate-pulse">
      <div className="aspect-[2/3] w-full rounded-xl bg-zinc-800/80 border border-white/5" />
      <div className="space-y-1.5 px-0.5">
        <div className="h-4 w-4/5 rounded bg-zinc-800/80" />
        <div className="h-3 w-1/3 rounded bg-zinc-800/60" />
      </div>
    </div>
  )
}

export function MovieGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <MovieCardSkeleton key={idx} />
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] min-h-[460px] max-h-[680px] w-full bg-zinc-900 animate-pulse overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-transparent" />
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 gap-4">
        <div className="h-5 w-28 rounded-full bg-zinc-800" />
        <div className="h-10 sm:h-14 w-3/4 max-w-xl rounded-lg bg-zinc-800" />
        <div className="h-4 w-full max-w-lg rounded bg-zinc-800/80" />
        <div className="h-4 w-2/3 max-w-md rounded bg-zinc-800/70" />
        <div className="flex gap-3 pt-2">
          <div className="h-11 w-36 rounded-xl bg-zinc-800" />
          <div className="h-11 w-32 rounded-xl bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[45vh] min-h-[320px] w-full bg-zinc-900" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-52 sm:w-64 aspect-[2/3] rounded-2xl bg-zinc-800 shrink-0 mx-auto md:mx-0" />
          <div className="flex-1 space-y-4 pt-4">
            <div className="h-10 w-2/3 rounded-lg bg-zinc-800" />
            <div className="h-5 w-1/3 rounded bg-zinc-800/80" />
            <div className="flex gap-2 pt-2">
              <div className="h-7 w-20 rounded-full bg-zinc-800" />
              <div className="h-7 w-20 rounded-full bg-zinc-800" />
              <div className="h-7 w-20 rounded-full bg-zinc-800" />
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full rounded bg-zinc-800/80" />
              <div className="h-4 w-full rounded bg-zinc-800/80" />
              <div className="h-4 w-3/4 rounded bg-zinc-800/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
