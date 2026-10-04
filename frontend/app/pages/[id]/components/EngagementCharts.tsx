"use client"

import React, { useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"
import { Activity, BarChart3, PieChart } from "lucide-react"
import type { PostItem } from "@/types/dashboard"

interface EngagementChartsProps {
  posts: PostItem[]
}

export function EngagementCharts({ posts }: EngagementChartsProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "breakdown">("timeline")

  if (!posts || posts.length === 0) {
    return (
      <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-8 text-center">
        <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No posts available to chart.</p>
      </div>
    )
  }

  // Chronological order for timeline (posts come in newest first, so reverse)
  const timelineData = [...posts]
    .reverse()
    .map((p, idx) => {
      const dateStr = p.created_time ? p.created_time.slice(5, 10) : `#${idx + 1}`
      return {
        id: p.id,
        date: dateStr,
        engagement: p.engagement_total,
        reactions: p.reactions_total,
        comments: p.comments_count,
        shares: p.shares_count,
        label: p.message ? p.message.slice(0, 30) + "..." : `Post ${idx + 1}`,
      }
    })

  // Aggregate reaction breakdown
  const reactionTotals = posts.reduce(
    (acc, p) => {
      acc.like += p.reactions_breakdown.like
      acc.love += p.reactions_breakdown.love
      acc.haha += p.reactions_breakdown.haha
      acc.wow += p.reactions_breakdown.wow
      acc.sad += p.reactions_breakdown.sad
      acc.angry += p.reactions_breakdown.angry
      return acc
    },
    { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 }
  )

  const reactionData = [
    { name: "Like 👍", count: reactionTotals.like, fill: "#3b82f6" },
    { name: "Love ❤️", count: reactionTotals.love, fill: "#ef4444" },
    { name: "Haha 😂", count: reactionTotals.haha, fill: "#f59e0b" },
    { name: "Wow 😮", count: reactionTotals.wow, fill: "#10b981" },
    { name: "Sad 😢", count: reactionTotals.sad, fill: "#8b5cf6" },
    { name: "Angry 😡", count: reactionTotals.angry, fill: "#f97316" },
  ]

  return (
    <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-6">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Post Engagement & Reactions
          </h3>
          <p className="text-xs text-slate-400">
            Interaction patterns across the last {posts.length} published posts
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "timeline"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
          <button
            onClick={() => setActiveTab("breakdown")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "breakdown"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Reactions Breakdown</span>
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-72 w-full pt-2">
        {activeTab === "timeline" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="reactionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="engagement"
                name="Total Engagement"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#engagementGradient)"
              />
              <Area
                type="monotone"
                dataKey="reactions"
                name="Reactions"
                stroke="#10b981"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#reactionsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reactionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
              />
              <Bar dataKey="count" name="Reactions Count" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
