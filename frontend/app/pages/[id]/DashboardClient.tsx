"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft, RefreshCw, Sparkles } from "lucide-react"
import type { DashboardResponse } from "@/types/dashboard"
import { Header } from "./components/Header"
import { StatsRow } from "./components/StatsRow"
import { AiInsightsCard } from "./components/AiInsightsCard"
import { EngagementCharts } from "./components/EngagementCharts"
import { PageInsightsSection } from "./components/PageInsightsSection"
import { RecentPostsList } from "./components/RecentPostsList"
import { DashboardSkeleton } from "./components/DashboardSkeleton"
import { ChatBot } from "./components/ChatBot"

interface DashboardClientProps {
  pageId: string
  userId?: string
  initialData?: DashboardResponse | null
}

export function DashboardClient({ pageId, userId, initialData = null }: DashboardClientProps) {
  const [data, setData] = useState<DashboardResponse | null>(initialData)
  const [loading, setLoading] = useState<boolean>(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false)
  const [isMockData, setIsMockData] = useState<boolean>(false)

  const fetchDashboard = useCallback(
    async (mock = false) => {
      setError(null)
      try {
        const url = `/api/pages/${pageId}/dashboard${mock ? "?mock=true" : ""}`
        const res = await fetch(url, { cache: "no-store" })
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || `HTTP error ${res.status}`)
        }

        setData(json)
        setIsMockData(mock)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load dashboard"
        setError(msg)
      } finally {
        setLoading(false)
        setIsRegenerating(false)
      }
    },
    [pageId]
  )

  useEffect(() => {
    if (!initialData) {
      fetchDashboard(false)
    }
  }, [initialData, fetchDashboard])

  const handleRegenerate = () => {
    setIsRegenerating(true)
    fetchDashboard(isMockData)
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-slate-900/80 border border-white/10 p-8 text-center backdrop-blur-xl shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Dashboard Error</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {error || "Could not retrieve Page telemetry from the server."}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => {
                setLoading(true)
                fetchDashboard(false)
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 active:scale-98 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Request</span>
            </button>

            <button
              onClick={() => {
                setLoading(true)
                fetchDashboard(true)
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium text-sm text-slate-200 border border-white/10 transition-all active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Preview with Demo Mock Data</span>
            </button>

            <Link
              href="/pages"
              className="inline-flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-200 pt-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Pages List</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <Header
          page={data.page}
          meta={data.meta}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          isMockData={isMockData}
        />

        {/* Stats Row */}
        <StatsRow stats={data.post_stats} />

        {/* Gemini AI Card */}
        <AiInsightsCard
          analysis={data.ai_analysis}
          geminiModel={data.meta.gemini_model}
          onRetry={handleRegenerate}
        />

        {/* Charts & Graphs */}
        <EngagementCharts posts={data.posts} />

        {/* Page Insights (28-day) */}
        <PageInsightsSection insights={data.insights} />

        {/* Recent Posts Grid */}
        <RecentPostsList
          posts={data.posts}
          bestPostId={data.post_stats.best_post_id}
          worstPostId={data.post_stats.worst_post_id}
        />
      </div>

      {/* Floating Chatbot Assistant */}
      <ChatBot
        pageId={pageId}
        userId={userId || ""}
        pageContent={data}
      />
    </div>
  )
}
