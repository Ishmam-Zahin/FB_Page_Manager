"use client"

import React from "react"
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"
import { Eye, TrendingUp, Users, Video, UserPlus, Info } from "lucide-react"
import type { PageInsights, InsightMetric } from "@/types/dashboard"

interface PageInsightsSectionProps {
  insights: PageInsights
}

interface MetricConfig {
  key: keyof PageInsights
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  strokeColor: string
  fillColor: string
}

const METRICS_CONFIG: MetricConfig[] = [
  {
    key: "reach",
    title: "Post Reach",
    description: "Unique individuals who saw Page content",
    icon: Users,
    strokeColor: "#3b82f6",
    fillColor: "#3b82f6",
  },
  {
    key: "impressions",
    title: "Total Impressions",
    description: "Total times content entered a screen",
    icon: Eye,
    strokeColor: "#8b5cf6",
    fillColor: "#8b5cf6",
  },
  {
    key: "engaged_users",
    title: "Engaged Users",
    description: "People who clicked, reacted, or commented",
    icon: TrendingUp,
    strokeColor: "#10b981",
    fillColor: "#10b981",
  },
  {
    key: "follower_growth",
    title: "Follower Growth",
    description: "Net daily new follower changes",
    icon: UserPlus,
    strokeColor: "#f59e0b",
    fillColor: "#f59e0b",
  },
  {
    key: "video_views",
    title: "Video Views",
    description: "Total 3-second or longer video plays",
    icon: Video,
    strokeColor: "#ec4899",
    fillColor: "#ec4899",
  },
]

export function PageInsightsSection({ insights }: PageInsightsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Page Insights (28-Day Overview)
          </h3>
          <p className="text-xs text-slate-400">
            Official Facebook Page-level telemetry via Graph API Insights
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {METRICS_CONFIG.map((config) => {
          const metric: InsightMetric = insights[config.key]
          const Icon = config.icon

          if (!metric || !metric.available) {
            return (
              <div
                key={config.key}
                className="rounded-2xl bg-slate-900/30 border border-white/5 p-4 flex flex-col justify-between opacity-70"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    {config.title}
                  </span>
                  <div className="p-1 rounded-lg bg-slate-800 text-slate-500">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-5 py-3 text-center rounded-xl bg-slate-950/40 border border-white/5">
                  <Info className="w-4 h-4 text-slate-500 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-slate-400">
                    Not available
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 px-2">
                    Requires 100+ likes or active media
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  {config.description}
                </div>
              </div>
            )
          }

          const chartData = (metric.values || []).map((pt) => ({
            date: pt.date ? pt.date.slice(5) : "",
            value: pt.value,
          }))

          return (
            <div
              key={config.key}
              className="rounded-2xl bg-slate-900/60 border border-white/8 hover:border-white/15 transition-all p-4 flex flex-col justify-between backdrop-blur-xl group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    {config.title}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-white/5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white tracking-tight">
                    {(metric.total ?? 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {metric.period || "28d"}
                  </span>
                </div>
              </div>

              {/* Sparkline chart */}
              <div className="h-16 w-full my-2">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${config.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={config.fillColor} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={config.fillColor} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "8px",
                          fontSize: "11px",
                          padding: "4px 8px",
                          color: "#f8fafc",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={config.strokeColor}
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill={`url(#grad-${config.key})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] text-slate-500">
                    No timeline points
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 line-clamp-1">
                {config.description}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
