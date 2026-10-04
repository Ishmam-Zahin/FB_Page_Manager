import React from "react"

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-slate-800/80 rounded-md" />
          <div className="h-9 w-28 bg-slate-800/80 rounded-lg" />
        </div>

        {/* Header Hero skeleton */}
        <div className="relative rounded-3xl bg-slate-900/60 border border-white/5 p-6 sm:p-8 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-800/80 shrink-0" />
            <div className="space-y-3 flex-1 w-full">
              <div className="h-8 w-64 bg-slate-800/80 rounded-lg" />
              <div className="h-4 w-40 bg-slate-800/60 rounded" />
              <div className="h-4 w-3/4 max-w-lg bg-slate-800/40 rounded" />
              <div className="flex gap-4 pt-2">
                <div className="h-6 w-24 bg-slate-800/60 rounded-full" />
                <div className="h-6 w-24 bg-slate-800/60 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-white/5 p-4 space-y-2">
              <div className="h-4 w-16 bg-slate-800/60 rounded" />
              <div className="h-8 w-20 bg-slate-800/80 rounded-lg" />
              <div className="h-3 w-12 bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>

        {/* AI Insight Card skeleton */}
        <div className="rounded-3xl bg-gradient-to-b from-indigo-950/20 to-slate-900/60 border border-indigo-500/20 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-7 w-48 bg-slate-800/80 rounded-lg" />
            <div className="h-10 w-24 bg-indigo-500/20 rounded-full" />
          </div>
          <div className="h-16 w-full bg-slate-800/40 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-36 bg-slate-800/30 rounded-2xl" />
            <div className="h-36 bg-slate-800/30 rounded-2xl" />
          </div>
        </div>

        {/* Chart section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-3xl bg-slate-900/60 border border-white/5 p-6" />
          <div className="h-80 rounded-3xl bg-slate-900/60 border border-white/5 p-6" />
        </div>

        {/* Posts list skeleton */}
        <div className="space-y-4">
          <div className="h-7 w-40 bg-slate-800/80 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-white/5 p-5 space-y-3">
                <div className="h-4 w-24 bg-slate-800/60 rounded" />
                <div className="h-14 w-full bg-slate-800/40 rounded" />
                <div className="h-28 w-full bg-slate-800/20 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
