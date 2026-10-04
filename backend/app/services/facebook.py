"""
Facebook Graph API service.

Responsibilities:
- Validate that the user owns the requested Page (via /me/accounts).
- Exchange the user access token for a Page access token.
- Fetch Page info, posts, and Page Insights.
- Map Graph API errors to clean HTTP exceptions.
- Never log access tokens.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import HTTPException

from app.schemas import (
    InsightDataPoint,
    InsightMetric,
    PageInfo,
    PageInsights,
    PostItem,
    ReactionsBreakdown,
)

_GRAPH_BASE = "https://graph.facebook.com"
_TIMEOUT = httpx.Timeout(30.0, connect=10.0)

# Facebook error codes → HTTP status
_FB_CODE_TO_HTTP: dict[int, int] = {
    190: 401,  # Invalid / expired OAuth token
    102: 401,  # Session key invalid
    32: 429,   # Page-level throttle
    17: 429,   # User-level throttle
    80001: 429,
    80002: 429,
    10: 403,   # Permission denied
}

# Insights metric name → local field name
_INSIGHT_METRICS: dict[str, str] = {
    "page_impressions_unique": "reach",
    "page_impressions": "impressions",
    "page_engaged_users": "engaged_users",
    "page_fan_adds_unique": "follower_growth",
    "page_video_views": "video_views",
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _raise_for_facebook_error(response: httpx.Response, *, context: str = "") -> None:
    """Inspect the JSON body for Facebook error objects and raise HTTPException."""
    try:
        body = response.json()
    except Exception:
        response.raise_for_status()
        return

    if "error" not in body:
        return

    error = body["error"]
    code: int = error.get("code", 0)
    subcode: int = error.get("error_subcode", 0)
    message: str = error.get("message", "Unknown Facebook error")

    # Token errors (code 190 = invalid/expired, code 102 = session invalid)
    if code in (190, 102):
        raise HTTPException(
            status_code=401,
            detail=f"Facebook access token is invalid or expired ({code}/{subcode}): {message}",
        )

    # Permission / throttle / object-level errors
    if code in _FB_CODE_TO_HTTP:
        raise HTTPException(status_code=_FB_CODE_TO_HTTP[code], detail=f"{context}: {message}")

    if code == 10 or (200 <= code < 300):
        raise HTTPException(status_code=403, detail=f"Permission denied{': ' + context if context else ''}: {message}")

    raise HTTPException(status_code=502, detail=f"Facebook API error {code}/{subcode}: {message}")


def _get_summary_count(data: dict[str, Any], key: str) -> int:
    field = data.get(key)
    if not field:
        return 0
    if isinstance(field, dict):
        return field.get("summary", {}).get("total_count", 0)
    return 0


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def verify_and_get_page_token(
    user_token: str,
    page_id: str,
    graph_version: str,
) -> str:
    """
    Confirms `page_id` is in the user's managed Pages and returns the
    corresponding Page access token. Raises 403 if not found.
    """
    url = f"{_GRAPH_BASE}/{graph_version}/me/accounts"
    params = {"fields": "id,access_token", "access_token": user_token}

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(url, params=params)
        _raise_for_facebook_error(resp, context="listing pages")

        pages: list[dict] = resp.json().get("data", [])
        for page in pages:
            if page.get("id") == page_id:
                token = page.get("access_token")
                if not token:
                    raise HTTPException(status_code=403, detail="Page access token missing.")
                return token

    raise HTTPException(
        status_code=403,
        detail=f"Page {page_id} was not found in your managed Pages.",
    )


async def fetch_page_info(
    page_token: str,
    page_id: str,
    graph_version: str,
) -> PageInfo:
    fields = ",".join([
        "id", "name", "category", "about",
        "picture.type(large)", "cover",
        "link", "website",
        "followers_count", "fan_count",
    ])
    url = f"{_GRAPH_BASE}/{graph_version}/{page_id}"
    params = {"fields": fields, "access_token": page_token}

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(url, params=params)
        _raise_for_facebook_error(resp, context="fetching page info")
        data = resp.json()

    picture_url: str | None = None
    if pic := data.get("picture"):
        picture_url = pic.get("data", {}).get("url")

    cover_url: str | None = None
    if cover := data.get("cover"):
        cover_url = cover.get("source")

    return PageInfo(
        id=data.get("id", page_id),
        name=data.get("name", ""),
        category=data.get("category", ""),
        about=data.get("about"),
        picture_url=picture_url,
        cover_url=cover_url,
        link=data.get("link"),
        website=data.get("website"),
        followers_count=data.get("followers_count", 0),
        fan_count=data.get("fan_count", 0),
    )


async def fetch_posts(
    page_token: str,
    page_id: str,
    graph_version: str,
    limit: int = 25,
) -> tuple[list[PostItem], list[str]]:
    warnings: list[str] = []
    full_fields = ",".join([
        "id",
        "message",
        "created_time",
        "permalink_url",
        "full_picture",
        "reactions.summary(total_count)",
        "reactions.type(LIKE).summary(total_count).as(like_count)",
        "reactions.type(LOVE).summary(total_count).as(love_count)",
        "reactions.type(HAHA).summary(total_count).as(haha_count)",
        "reactions.type(WOW).summary(total_count).as(wow_count)",
        "reactions.type(SAD).summary(total_count).as(sad_count)",
        "reactions.type(ANGRY).summary(total_count).as(angry_count)",
        "comments.summary(total_count)",
        "shares",
    ])
    url = f"{_GRAPH_BASE}/{graph_version}/{page_id}/published_posts"
    params = {"fields": full_fields, "limit": limit, "access_token": page_token}

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(url, params=params)
        body = None
        try:
            body = resp.json()
        except Exception:
            pass

        # If reaction/comment summaries fail due to missing pages_read_user_content (code 10), fallback to basic fields
        if resp.status_code != 200 and isinstance(body, dict) and body.get("error", {}).get("code") == 10:
            warnings.append(
                "Post reactions and comments summary require 'pages_read_user_content' permission in Facebook Login. Basic post data loaded."
            )
            basic_fields = "id,message,created_time,permalink_url,full_picture,shares"
            resp = await client.get(
                url,
                params={"fields": basic_fields, "limit": limit, "access_token": page_token},
            )

        _raise_for_facebook_error(resp, context="fetching posts")
        raw_posts: list[dict] = resp.json().get("data", [])

    result: list[PostItem] = []
    for p in raw_posts:
        reactions_total = _get_summary_count(p, "reactions")
        like = _get_summary_count(p, "like_count")
        love = _get_summary_count(p, "love_count")
        haha = _get_summary_count(p, "haha_count")
        wow = _get_summary_count(p, "wow_count")
        sad = _get_summary_count(p, "sad_count")
        angry = _get_summary_count(p, "angry_count")
        comments = _get_summary_count(p, "comments")
        shares = p.get("shares", {}).get("count", 0) if p.get("shares") else 0
        engagement = reactions_total + comments + shares

        result.append(PostItem(
            id=p["id"],
            message=p.get("message"),
            created_time=p.get("created_time", ""),
            permalink_url=p.get("permalink_url"),
            full_picture=p.get("full_picture"),
            reactions_total=reactions_total,
            reactions_breakdown=ReactionsBreakdown(
                like=like, love=love, haha=haha, wow=wow, sad=sad, angry=angry,
            ),
            comments_count=comments,
            shares_count=shares,
            engagement_total=engagement,
        ))

    return result, warnings


async def _fetch_single_insight(
    client: httpx.AsyncClient,
    page_token: str,
    page_id: str,
    graph_version: str,
    metric: str,
    since: datetime,
    until: datetime,
) -> InsightMetric:
    """Fetch one Page Insight metric. Returns available=False on any error."""
    url = f"{_GRAPH_BASE}/{graph_version}/{page_id}/insights"
    params = {
        "metric": metric,
        "period": "day",
        "since": int(since.timestamp()),
        "until": int(until.timestamp()),
        "access_token": page_token,
    }
    try:
        resp = await client.get(url, params=params)
        body = resp.json()

        # Facebook returns 200 even for errors — check the body
        if "error" in body:
            return InsightMetric(available=False)

        data_list: list[dict] = body.get("data", [])
        if not data_list:
            return InsightMetric(available=False)

        raw_values: list[dict] = data_list[0].get("values", [])
        period_str: str = data_list[0].get("period", "day")

        if not raw_values:
            return InsightMetric(available=False)

        points: list[InsightDataPoint] = []
        for v in raw_values:
            end_time = v.get("end_time", "")
            date_str = end_time[:10] if end_time else ""
            value = v.get("value", 0)
            if isinstance(value, (int, float)) and date_str:
                points.append(InsightDataPoint(date=date_str, value=int(value)))

        total = sum(pt.value for pt in points)
        return InsightMetric(available=True, period=period_str, values=points, total=total)

    except Exception:
        return InsightMetric(available=False)


async def fetch_page_insights(
    page_token: str,
    page_id: str,
    graph_version: str,
    days: int = 28,
) -> tuple[PageInsights, list[str]]:
    """
    Fetches all five insight metrics concurrently.
    Returns (PageInsights, warnings) — a failing metric never raises.
    """
    until = datetime.now(timezone.utc)
    since = until - timedelta(days=days)

    warnings: list[str] = []

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        tasks = {
            field: _fetch_single_insight(client, page_token, page_id, graph_version, metric, since, until)
            for metric, field in _INSIGHT_METRICS.items()
        }
        results = dict(zip(tasks.keys(), await asyncio.gather(*tasks.values())))

    for field, metric_result in results.items():
        if not metric_result.available:
            warnings.append(
                f"{field} insight unavailable: metric may require 100+ Page likes "
                "or an active content type for this Page."
            )

    return (
        PageInsights(
            reach=results["reach"],
            impressions=results["impressions"],
            engaged_users=results["engaged_users"],
            follower_growth=results["follower_growth"],
            video_views=results["video_views"],
        ),
        warnings,
    )
