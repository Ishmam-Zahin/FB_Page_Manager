"""
Pure Python computation of PostStats from a list of PostItem.
No external API calls — never delegates arithmetic to Gemini.
"""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone

from app.schemas import PostItem, PostStats


_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def compute_post_stats(posts: list[PostItem]) -> PostStats:
    if not posts:
        return PostStats(
            posts_analyzed=0,
            avg_reactions=0.0,
            avg_comments=0.0,
            avg_shares=0.0,
            avg_engagement=0.0,
            best_post_id=None,
            worst_post_id=None,
            posts_per_week=0.0,
            top_posting_days=[],
            top_posting_hours=[],
        )

    n = len(posts)

    avg_reactions = sum(p.reactions_total for p in posts) / n
    avg_comments = sum(p.comments_count for p in posts) / n
    avg_shares = sum(p.shares_count for p in posts) / n
    avg_engagement = sum(p.engagement_total for p in posts) / n

    best_post = max(posts, key=lambda p: p.engagement_total)
    worst_post = min(posts, key=lambda p: p.engagement_total)

    # Parse ISO timestamps → datetime (handles both Z and +00:00 suffixes)
    parsed_dates: list[datetime] = []
    day_counts: Counter[str] = Counter()
    hour_counts: Counter[int] = Counter()

    for p in posts:
        raw = p.created_time.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(raw).astimezone(timezone.utc)
        except ValueError:
            continue
        parsed_dates.append(dt)
        day_counts[_DAY_NAMES[dt.weekday()]] += 1
        hour_counts[dt.hour] += 1

    # Posts per calendar week over the observed date range
    if len(parsed_dates) > 1:
        date_range_days = (max(parsed_dates) - min(parsed_dates)).days
        weeks = max(date_range_days / 7.0, 1.0)
        posts_per_week = n / weeks
    else:
        posts_per_week = float(n)

    top_posting_days = [day for day, _ in day_counts.most_common(3)]
    top_posting_hours = [hour for hour, _ in hour_counts.most_common(3)]

    return PostStats(
        posts_analyzed=n,
        avg_reactions=round(avg_reactions, 1),
        avg_comments=round(avg_comments, 1),
        avg_shares=round(avg_shares, 1),
        avg_engagement=round(avg_engagement, 1),
        best_post_id=best_post.id,
        worst_post_id=worst_post.id,
        posts_per_week=round(posts_per_week, 2),
        top_posting_days=top_posting_days,
        top_posting_hours=top_posting_hours,
    )
