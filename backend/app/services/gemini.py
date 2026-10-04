"""
Gemini AI analysis service.

- Builds a compact, privacy-safe prompt from computed page data.
- Calls Gemini with structured JSON output (response_schema = AiAnalysis).
- Retries once on failure; returns None on second failure (caller adds a warning).
- Facebook tokens are never included in the prompt or logs.
"""

from __future__ import annotations

import logging

from google import genai
from google.genai import types

from app.schemas import AiAnalysis, PageInfo, PageInsights, PostItem, PostStats

logger = logging.getLogger(__name__)


def _build_prompt(
    page: PageInfo,
    post_stats: PostStats,
    posts: list[PostItem],
    insights: PageInsights,
) -> str:
    # Compact post summary — message truncated to 300 chars, counts only
    if posts:
        post_lines = "\n".join(
            f"- [{p.created_time[:10]}] eng={p.engagement_total} "
            f"(👍{p.reactions_breakdown.like} ❤{p.reactions_breakdown.love} "
            f"💬{p.comments_count} 🔁{p.shares_count}) "
            f"| {(p.message or '(no text)')[:300]}"
            for p in posts[:25]
        )
    else:
        post_lines = "No posts available."

    insight_lines: list[str] = []
    if insights.reach.available and insights.reach.total is not None:
        insight_lines.append(f"Reach (28 days): {insights.reach.total:,}")
    if insights.impressions.available and insights.impressions.total is not None:
        insight_lines.append(f"Impressions (28 days): {insights.impressions.total:,}")
    if insights.engaged_users.available and insights.engaged_users.total is not None:
        insight_lines.append(f"Engaged users (28 days): {insights.engaged_users.total:,}")
    if insights.follower_growth.available and insights.follower_growth.total is not None:
        insight_lines.append(f"New followers (28 days): {insights.follower_growth.total:,}")

    insights_text = "\n".join(insight_lines) if insight_lines else "No page insights available."
    limited_data_note = (
        "\nNOTE: Data is limited (few or no posts). Be honest about this in your analysis "
        "rather than inventing trends."
        if post_stats.posts_analyzed < 5
        else ""
    )

    return f"""You are a social media analyst. Analyze this Facebook Page and return a concise, actionable JSON report.
{limited_data_note}
PAGE: {page.name} ({page.category})
Followers: {page.followers_count:,} | Likes: {page.fan_count:,}
{f'About: {page.about}' if page.about else ''}

POST STATISTICS ({post_stats.posts_analyzed} posts analyzed):
Posts per week: {post_stats.posts_per_week:.1f}
Avg engagement: {post_stats.avg_engagement:.1f} | Avg reactions: {post_stats.avg_reactions:.1f}
Avg comments: {post_stats.avg_comments:.1f} | Avg shares: {post_stats.avg_shares:.1f}
Best post: {post_stats.best_post_id or 'N/A'} | Worst post: {post_stats.worst_post_id or 'N/A'}
Top posting days: {', '.join(post_stats.top_posting_days) or 'N/A'}
Top posting hours (UTC): {', '.join(str(h) for h in post_stats.top_posting_hours) or 'N/A'}

PAGE INSIGHTS:
{insights_text}

RECENT POSTS (newest first):
{post_lines}

Return JSON matching the AiAnalysis schema exactly. Be specific and data-driven.
Do not include raw access tokens, IDs beyond post IDs, or any PII.
"""


async def generate_ai_analysis(
    page: PageInfo,
    post_stats: PostStats,
    posts: list[PostItem],
    insights: PageInsights,
    api_key: str,
    model: str,
) -> AiAnalysis | None:
    """
    Calls Gemini for structured AiAnalysis. Retries once on any error.
    Returns None if both attempts fail.
    """
    client = genai.Client(api_key=api_key)
    prompt = _build_prompt(page, post_stats, posts, insights)

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=AiAnalysis,
    )

    for attempt in range(2):
        try:
            response = await client.aio.models.generate_content(
                model=model,
                contents=prompt,
                config=config,
            )
            return AiAnalysis.model_validate_json(response.text)
        except Exception as exc:
            logger.warning("Gemini attempt %d failed: %r", attempt + 1, exc)

    return None
