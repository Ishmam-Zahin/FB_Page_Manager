"""
Pydantic models that mirror the API contract in docs/api-contract.md exactly.
Keep in sync with frontend/types/dashboard.ts.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------


class ReactionsBreakdown(BaseModel):
    like: int = 0
    love: int = 0
    haha: int = 0
    wow: int = 0
    sad: int = 0
    angry: int = 0


class PostItem(BaseModel):
    id: str
    message: Optional[str] = None
    created_time: str  # ISO 8601
    permalink_url: Optional[str] = None
    full_picture: Optional[str] = None
    reactions_total: int = 0
    reactions_breakdown: ReactionsBreakdown
    comments_count: int = 0
    shares_count: int = 0
    engagement_total: int = 0  # reactions_total + comments_count + shares_count


class PostStats(BaseModel):
    posts_analyzed: int
    avg_reactions: float
    avg_comments: float
    avg_shares: float
    avg_engagement: float
    best_post_id: Optional[str] = None
    worst_post_id: Optional[str] = None
    posts_per_week: float
    top_posting_days: list[str]
    top_posting_hours: list[int]


class InsightDataPoint(BaseModel):
    date: str  # ISO 8601 date string
    value: int


class InsightMetric(BaseModel):
    available: bool
    period: Optional[str] = None
    values: Optional[list[InsightDataPoint]] = None
    total: Optional[int] = None


class PageInsights(BaseModel):
    reach: InsightMetric
    impressions: InsightMetric
    engaged_users: InsightMetric
    follower_growth: InsightMetric
    video_views: InsightMetric


class EngagementTrend(str, Enum):
    improving = "improving"
    stable = "stable"
    declining = "declining"


class RecommendationPriority(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class Recommendation(BaseModel):
    title: str
    detail: str
    priority: RecommendationPriority


class AiAnalysis(BaseModel):
    health_score: int = Field(ge=0, le=100)
    health_summary: str
    engagement_trend: EngagementTrend
    trend_explanation: str
    strengths: list[str]
    weaknesses: list[str]
    best_post_analysis: Optional[str] = None
    worst_post_analysis: Optional[str] = None
    recommendations: list[Recommendation]
    content_ideas: list[str]
    best_time_to_post: str


class PageInfo(BaseModel):
    id: str
    name: str
    category: str
    about: Optional[str] = None
    picture_url: Optional[str] = None
    cover_url: Optional[str] = None
    link: Optional[str] = None
    website: Optional[str] = None
    followers_count: int = 0
    fan_count: int = 0


class ResponseMeta(BaseModel):
    generated_at: str  # ISO 8601 UTC
    graph_api_version: str
    gemini_model: str
    warnings: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Top-level response
# ---------------------------------------------------------------------------


class DashboardResponse(BaseModel):
    page: PageInfo
    posts: list[PostItem]
    post_stats: PostStats
    insights: PageInsights
    ai_analysis: Optional[AiAnalysis] = None
    meta: ResponseMeta
