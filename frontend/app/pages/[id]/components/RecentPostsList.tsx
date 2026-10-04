import React from "react"
import {
  Award,
  Calendar,
  ExternalLink,
  MessageSquare,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react"
import type { PostItem } from "@/types/dashboard"

interface RecentPostsListProps {
  posts: PostItem[]
  bestPostId?: string | null
  worstPostId?: string | null
}

export function RecentPostsList({
  posts,
  bestPostId,
  worstPostId,
}: RecentPostsListProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-8 text-center">
        <p className="text-sm text-slate-400">No published posts found on this Page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Recent Published Posts
          </h3>
          <p className="text-xs text-slate-400">
            Chronological feed with engagement breakdown ({posts.length} posts)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => {
          const isBest = bestPostId && post.id === bestPostId
          const isWorst = worstPostId && post.id === worstPostId && posts.length > 1

          // Highlight card border and glow
          let cardStyle = "border-white/10 bg-slate-900/60 hover:border-white/20"
          if (isBest) {
            cardStyle =
              "border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 to-slate-900/80 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30"
          } else if (isWorst) {
            cardStyle =
              "border-rose-500/30 bg-gradient-to-b from-rose-950/15 to-slate-900/80"
          }

          const formattedDate = post.created_time
            ? new Date(post.created_time).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Unknown date"

          return (
            <div
              key={post.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all backdrop-blur-xl group ${cardStyle}`}
            >
              <div className="space-y-3">
                {/* Badges row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isBest && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <Award className="w-3.5 h-3.5" />
                        Top Performer
                      </span>
                    )}
                    {isWorst && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        <ThumbsDown className="w-3 h-3" />
                        Lowest Interaction
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {formattedDate}
                  </span>
                </div>

                {/* Optional full picture */}
                {post.full_picture && (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-950 border border-white/5">
                    <img
                      src={post.full_picture}
                      alt="Post visual"
                      className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Post message text */}
                <p className="text-xs text-slate-200 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                  {post.message || <span className="italic text-slate-500">(Media post with no text caption)</span>}
                </p>
              </div>

              {/* Engagement footer */}
              <div className="mt-4 pt-3.5 border-t border-white/8 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-300 font-medium" title="Total Reactions">
                      <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />
                      {post.reactions_total.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-slate-300 font-medium" title="Comments">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      {post.comments_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-slate-300 font-medium" title="Shares">
                      <Share2 className="w-3.5 h-3.5 text-purple-400" />
                      {post.shares_count.toLocaleString()}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {post.engagement_total.toLocaleString()} total
                  </div>
                </div>

                {/* Reactions breakdown icons */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-2">
                    {post.reactions_breakdown.like > 0 && <span>👍 {post.reactions_breakdown.like}</span>}
                    {post.reactions_breakdown.love > 0 && <span>❤️ {post.reactions_breakdown.love}</span>}
                    {post.reactions_breakdown.haha > 0 && <span>😂 {post.reactions_breakdown.haha}</span>}
                    {post.reactions_breakdown.wow > 0 && <span>😮 {post.reactions_breakdown.wow}</span>}
                    {post.reactions_breakdown.sad > 0 && <span>😢 {post.reactions_breakdown.sad}</span>}
                    {post.reactions_breakdown.angry > 0 && <span>😡 {post.reactions_breakdown.angry}</span>}
                  </div>

                  {post.permalink_url && (
                    <a
                      href={post.permalink_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-[11px] font-medium hover:underline"
                    >
                      <span>View post</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
