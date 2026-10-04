import React from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Globe, Heart, RefreshCw, Users, AlertTriangle } from "lucide-react"
import type { PageInfo, ResponseMeta } from "@/types/dashboard"

interface HeaderProps {
  page: PageInfo
  meta: ResponseMeta
  onRegenerate: () => void
  isRegenerating: boolean
  isMockData?: boolean
}

export function Header({ page, meta, onRegenerate, isRegenerating, isMockData }: HeaderProps) {
  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/pages"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors group px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-white/10"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Pages</span>
        </Link>

        <div className="flex items-center gap-3">
          {isMockData && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Demo Mock Data
            </span>
          )}
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-white/10 hover:border-white/20 transition-all shadow-sm active:scale-98 disabled:opacity-50"
            title="Refresh dashboard data and regenerate AI analysis"
          >
            <RefreshCw className={`w-4 h-4 text-blue-400 ${isRegenerating ? "animate-spin" : ""}`} />
            <span>{isRegenerating ? "Refreshing..." : "Regenerate Analysis"}</span>
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="relative rounded-3xl bg-slate-900/70 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Cover backdrop */}
        {page.cover_url ? (
          <div className="h-32 sm:h-44 w-full relative overflow-hidden bg-slate-950">
            <img
              src={page.cover_url}
              alt={`${page.name} cover`}
              className="w-full h-full object-cover object-center opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          </div>
        ) : (
          <div className="h-24 sm:h-28 w-full bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border-b border-white/5" />
        )}

        {/* Content body */}
        <div className="p-6 sm:p-8 pt-0 relative -mt-12 sm:-mt-14 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Picture Avatar */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-slate-900 border-2 border-white/20 shadow-2xl overflow-hidden shrink-0">
              {page.picture_url ? (
                <img
                  src={page.picture_url}
                  alt={page.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {page.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{page.name}</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {page.category}
                </span>
              </div>

              {page.about && (
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed line-clamp-2">
                  {page.about}
                </p>
              )}

              {/* External Links */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                {page.link && (
                  <a
                    href={page.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    <span>facebook.com/{page.id}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {page.website && (
                  <a
                    href={page.website.startsWith("http") ? page.website : `https://${page.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{page.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Followers & Likes badges */}
          <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-end">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/8 backdrop-blur-md">
              <Users className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-xs text-slate-400 leading-none">Followers</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {page.followers_count.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/8 backdrop-blur-md">
              <Heart className="w-4 h-4 text-rose-400" />
              <div>
                <div className="text-xs text-slate-400 leading-none">Page Likes</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {page.fan_count.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings Banner (Requirement 7: subtle notice) */}
      {meta.warnings && meta.warnings.length > 0 && (
        <div className="rounded-2xl bg-amber-500/8 border border-amber-500/20 px-4 py-3 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-300">Notice: </span>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              {meta.warnings.map((w, idx) => (
                <li key={idx} className="text-amber-200/80 leading-relaxed">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
