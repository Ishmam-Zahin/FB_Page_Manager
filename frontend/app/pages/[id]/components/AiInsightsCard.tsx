import React from "react"
import {
  AlertCircle,
  Award,
  Bot,
  CheckCircle2,
  Clock,
  Flame,
  HelpCircle,
  Lightbulb,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react"
import type { AiAnalysis } from "@/types/dashboard"

interface AiInsightsCardProps {
  analysis: AiAnalysis | null
  geminiModel?: string
  onRetry?: () => void
}

export function AiInsightsCard({ analysis, geminiModel, onRetry }: AiInsightsCardProps) {
  if (!analysis) {
    return (
      <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-8 text-center backdrop-blur-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <Bot className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">AI Insights Unavailable</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
          Gemini analysis was unable to generate for this Page. This could be due to API limits or limited Page activity data.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            Retry Analysis
          </button>
        )}
      </div>
    )
  }

  // Health score styling
  const score = analysis.health_score
  const scoreColor =
    score >= 70
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : score >= 50
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-rose-400 border-rose-500/30 bg-rose-500/10"

  const progressStroke =
    score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f43f5e"

  // Circumference for r=38 is 2 * Math.PI * 38 ≈ 238.76
  const strokeDashoffset = 238.76 - (238.76 * score) / 100

  // Trend icon & style
  const trendConfig = {
    improving: {
      icon: TrendingUp,
      label: "Improving Trend",
      className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    stable: {
      icon: Minus,
      label: "Stable Performance",
      className: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    declining: {
      icon: TrendingDown,
      label: "Declining Momentum",
      className: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  }[analysis.engagement_trend] || {
    icon: HelpCircle,
    label: analysis.engagement_trend,
    className: "text-slate-400 bg-slate-800 border-white/10",
  }

  const TrendIcon = trendConfig.icon

  return (
    <div className="rounded-3xl bg-gradient-to-b from-indigo-950/30 via-slate-900/80 to-slate-900/60 border border-indigo-500/20 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Gemini AI Diagnostic
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {geminiModel || "gemini-2.0-flash"}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Automated intelligence based on recent engagement and content metrics
            </p>
          </div>
        </div>

        {/* Best time to post badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs text-slate-300">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Optimal Posting:</span>
          <span className="font-semibold text-amber-300">{analysis.best_time_to_post}</span>
        </div>
      </div>

      {/* Health Score + Summary Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-6 border-b border-white/10 items-center">
        {/* Score Ring */}
        <div className="lg:col-span-4 flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="38"
                className="stroke-slate-800"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="38"
                stroke={progressStroke}
                strokeWidth="7"
                strokeDasharray="238.76"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white">{score}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Page Health Index
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${trendConfig.className}`}
              >
                <TrendIcon className="w-3.5 h-3.5" />
                <span>{trendConfig.label}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">
              {analysis.trend_explanation}
            </p>
          </div>
        </div>

        {/* Executive summary */}
        <div className="lg:col-span-8 p-4 rounded-2xl bg-slate-950/50 border border-white/8">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-indigo-400" />
            Executive Summary
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            {analysis.health_summary}
          </p>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-b border-white/10">
        <div className="p-4 rounded-2xl bg-emerald-950/10 border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            Observed Strengths
          </div>
          <ul className="space-y-2">
            {analysis.strengths.map((str, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/10 border border-rose-500/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            Growth Opportunities & Weaknesses
          </div>
          <ul className="space-y-2">
            {analysis.weaknesses.map((weak, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>{weak}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Post Performance Qualitative Notes */}
      {(analysis.best_post_analysis || analysis.worst_post_analysis) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-b border-white/10">
          {analysis.best_post_analysis && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/8 space-y-1.5">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Why Best Post Worked
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {analysis.best_post_analysis}
              </p>
            </div>
          )}
          {analysis.worst_post_analysis && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/8 space-y-1.5">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Underperforming Post Analysis
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {analysis.worst_post_analysis}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recommendations by Priority */}
      <div className="py-6 border-b border-white/10 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Actionable Recommendations
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {analysis.recommendations.map((rec, idx) => {
            const priorityBadge =
              rec.priority === "high"
                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                : rec.priority === "medium"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-blue-500/10 text-blue-400 border-blue-500/30"

            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/60 border border-white/8 hover:border-white/15 transition-all space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white line-clamp-1">
                      {rec.title}
                    </h4>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${priorityBadge}`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {rec.detail}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content Ideas */}
      {analysis.content_ideas.length > 0 && (
        <div className="pt-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Recommended Content Topics & Formats
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analysis.content_ideas.map((idea, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 text-xs text-slate-200 flex items-start gap-2.5 leading-relaxed"
              >
                <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{idea}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
