"""
Dashboard API router.
Endpoint: GET /api/v1/pages/{page_id}/dashboard
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import logging

from fastapi import APIRouter, Depends, Header, HTTPException

from app.config import Settings, get_settings
from app.schemas import DashboardResponse, ResponseMeta
from app.services.analysis import compute_post_stats
from app.services.facebook import (
    fetch_page_info,
    fetch_page_insights,
    fetch_posts,
    verify_and_get_page_token,
)
from app.services.gemini import generate_ai_analysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/pages", tags=["dashboard"])


def _extract_bearer_token(authorization: str | None = Header(None)) -> str:
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header. Expected: Bearer <facebook_user_access_token>",
        )
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format. Expected: Bearer <facebook_user_access_token>",
        )
    return parts[1]


@router.get("/{page_id}/dashboard", response_model=DashboardResponse)
async def get_page_dashboard(
    page_id: str,
    user_token: str = Depends(_extract_bearer_token),
    settings: Settings = Depends(get_settings),
) -> DashboardResponse:
    """
    Fetches full dashboard data for a Facebook Page:
    1. Verifies ownership of page_id via user's /me/accounts and gets Page access token.
    2. Concurrently fetches Page metadata, last ~25 posts, and Page Insights.
    3. Computes post stats server-side.
    4. Runs Gemini AI analysis with structured schema.
    5. Returns unified DashboardResponse.
    """
    # 1. Verify ownership & obtain Page access token (raises 401 or 403 on failure)
    page_token = await verify_and_get_page_token(
        user_token=user_token,
        page_id=page_id,
        graph_version=settings.graph_api_version,
    )

    # 2. Concurrently fetch Page info, posts, and insights
    page_info_task = fetch_page_info(page_token, page_id, settings.graph_api_version)
    posts_task = fetch_posts(page_token, page_id, settings.graph_api_version, limit=25)
    insights_task = fetch_page_insights(page_token, page_id, settings.graph_api_version)

    page_info, (posts, post_warnings), (insights, insight_warnings) = await asyncio.gather(
        page_info_task,
        posts_task,
        insights_task,
    )

    # 3. Compute post stats deterministically in Python
    post_stats = compute_post_stats(posts)

    # 4. Generate AI analysis via Gemini
    warnings = list(insight_warnings) + list(post_warnings)
    ai_analysis = None

    if settings.gemini_api_key:
        try:
            ai_analysis = await generate_ai_analysis(
                page=page_info,
                post_stats=post_stats,
                posts=posts,
                insights=insights,
                api_key=settings.gemini_api_key,
                model=settings.gemini_model,
            )
            if ai_analysis is None:
                warnings.append("AI analysis unavailable: Gemini API request failed or timed out after retry.")
        except Exception as exc:
            logger.warning("Unexpected error during Gemini analysis: %s", exc)
            warnings.append("AI analysis unavailable: an unexpected error occurred during analysis.")
    else:
        warnings.append("AI analysis unavailable: GEMINI_API_KEY is not configured.")

    meta = ResponseMeta(
        generated_at=datetime.now(timezone.utc).isoformat(),
        graph_api_version=settings.graph_api_version,
        gemini_model=settings.gemini_model,
        warnings=warnings,
    )

    return DashboardResponse(
        page=page_info,
        posts=posts,
        post_stats=post_stats,
        insights=insights,
        ai_analysis=ai_analysis,
        meta=meta,
    )
