/**
 * Dashboard response types mirroring docs/api-contract.md exactly.
 */

export interface ReactionsBreakdown {
  like: number
  love: number
  haha: number
  wow: number
  sad: number
  angry: number
}

export interface PostItem {
  id: string
  message: string | null
  created_time: string
  permalink_url: string | null
  full_picture: string | null
  reactions_total: number
  reactions_breakdown: ReactionsBreakdown
  comments_count: number
  shares_count: number
  engagement_total: number
}

export interface PostStats {
  posts_analyzed: number
  avg_reactions: number
  avg_comments: number
  avg_shares: number
  avg_engagement: number
  best_post_id: string | null
  worst_post_id: string | null
  posts_per_week: number
  top_posting_days: string[]
  top_posting_hours: number[]
}

export interface InsightDataPoint {
  date: string
  value: number
}

export interface InsightMetric {
  available: boolean
  period?: string | null
  values?: InsightDataPoint[] | null
  total?: number | null
}

export interface PageInsights {
  reach: InsightMetric
  impressions: InsightMetric
  engaged_users: InsightMetric
  follower_growth: InsightMetric
  video_views: InsightMetric
}

export type EngagementTrend = "improving" | "stable" | "declining"
export type RecommendationPriority = "high" | "medium" | "low"

export interface Recommendation {
  title: string
  detail: string
  priority: RecommendationPriority
}

export interface AiAnalysis {
  health_score: number
  health_summary: string
  engagement_trend: EngagementTrend
  trend_explanation: string
  strengths: string[]
  weaknesses: string[]
  best_post_analysis: string | null
  worst_post_analysis: string | null
  recommendations: Recommendation[]
  content_ideas: string[]
  best_time_to_post: string
}

export interface PageInfo {
  id: string
  name: string
  category: string
  about: string | null
  picture_url: string | null
  cover_url: string | null
  link: string | null
  website: string | null
  followers_count: number
  fan_count: number
}

export interface ResponseMeta {
  generated_at: string
  graph_api_version: string
  gemini_model: string
  warnings: string[]
}

export interface DashboardResponse {
  page: PageInfo
  posts: PostItem[]
  post_stats: PostStats
  insights: PageInsights
  ai_analysis: AiAnalysis | null
  meta: ResponseMeta
}
