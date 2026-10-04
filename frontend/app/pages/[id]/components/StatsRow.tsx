import React from "react"
import { Calendar, FileText, MessageSquare, Share2, ThumbsUp, Zap } from "lucide-react"
import type { PostStats } from "@/types/dashboard"

interface StatsRowProps {
  stats: PostStats
}

export function StatsRow({ stats }: StatsRowProps) {
  const statCards = [
    {
      label: "Posts Analyzed",
      value: stats.posts_analyzed.toLocaleString(),
      subtext: "Recent feed posts",
      icon: FileText,
      accent: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Avg Reactions",
      value: stats.avg_reactions.toFixed(1),
      subtext: "Per published post",
      icon: ThumbsUp,
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Avg Comments",
      value: stats.avg_comments.toFixed(1),
      subtext: "Per published post",
      icon: MessageSquare,
      accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Avg Shares",
      value: stats.avg_shares.toFixed(1),
      subtext: "Viral distribution",
      icon: Share2,
      accent: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Avg Engagement",
      value: stats.avg_engagement.toFixed(1),
      subtext: "Total interactions",
      icon: Zap,
      accent: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      label: "Posts / Week",
      value: stats.posts_per_week.toFixed(1),
      subtext: "Cadence average",
      icon: Calendar,
      accent: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900/60 border border-white/8 hover:border-white/15 transition-all p-4 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-400 truncate">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg border ${card.accent} shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {card.subtext}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Top posting timing hints */}
      {(stats.top_posting_days.length > 0 || stats.top_posting_hours.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-slate-400">
          <span className="font-medium text-slate-300">Activity cadence:</span>
          {stats.top_posting_days.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span>Top days:</span>
              <span className="font-semibold text-slate-200">
                {stats.top_posting_days.join(", ")}
              </span>
            </div>
          )}
          {stats.top_posting_days.length > 0 && stats.top_posting_hours.length > 0 && (
            <span className="text-slate-600">•</span>
          )}
          {stats.top_posting_hours.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span>Peak hours:</span>
              <span className="font-semibold text-slate-200">
                {stats.top_posting_hours.map((h) => `${h}:00 UTC`).join(", ")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
