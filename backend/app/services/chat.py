"""
Chat service: LLM interaction + conversation/message persistence.
"""
from __future__ import annotations

import logging
import uuid
from typing import Optional

from google import genai
from google.genai import types
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, Message
from app.schemas import DashboardResponse

logger = logging.getLogger(__name__)


class _FirstTurnOutput(BaseModel):
    title: str
    response: str


def _build_chat_context(page_content: DashboardResponse) -> str:
    """Build a compact context string from dashboard data for the LLM."""
    page = page_content.page
    stats = page_content.post_stats
    insights = page_content.insights

    context = f"""PAGE: {page.name} ({page.category})
Followers: {page.followers_count:,} | Likes: {page.fan_count:,}
{f'About: {page.about}' if page.about else ''}

POST STATISTICS ({stats.posts_analyzed} posts analyzed):
Posts per week: {stats.posts_per_week:.1f}
Avg engagement: {stats.avg_engagement:.1f} | Avg reactions: {stats.avg_reactions:.1f}
Avg comments: {stats.avg_comments:.1f} | Avg shares: {stats.avg_shares:.1f}
Top posting days: {', '.join(stats.top_posting_days) or 'N/A'}
Top posting hours (UTC): {', '.join(str(h) for h in stats.top_posting_hours) or 'N/A'}
"""

    insight_lines: list[str] = []
    if insights.reach.available and insights.reach.total is not None:
        insight_lines.append(f"Reach (28d): {insights.reach.total:,}")
    if insights.impressions.available and insights.impressions.total is not None:
        insight_lines.append(f"Impressions (28d): {insights.impressions.total:,}")
    if insights.engaged_users.available and insights.engaged_users.total is not None:
        insight_lines.append(f"Engaged users (28d): {insights.engaged_users.total:,}")
    if insight_lines:
        context += "\nPAGE INSIGHTS:\n" + "\n".join(insight_lines)

    if page_content.posts:
        post_lines = "\n".join(
            f"- [{p.created_time[:10]}] eng={p.engagement_total} "
            f"(👍{p.reactions_breakdown.like} ❤{p.reactions_breakdown.love} "
            f"💬{p.comments_count} 🔁{p.shares_count}) "
            f"| {(p.message or '(no text)')[:200]}"
            for p in page_content.posts[:15]
        )
        context += f"\n\nRECENT POSTS:\n{post_lines}"

    if page_content.ai_analysis:
        ai = page_content.ai_analysis
        context += f"""

AI ANALYSIS SUMMARY:
Health Score: {ai.health_score}/100 ({ai.engagement_trend.value})
Summary: {ai.health_summary}
Strengths: {', '.join(ai.strengths)}
Weaknesses: {', '.join(ai.weaknesses)}"""

    return context


def _build_system_prompt(page_context: str, is_new: bool) -> str:
    """Build the system instruction for the LLM."""
    base = f"""You are a helpful Facebook Page analytics assistant. Answer the user's question 
based strictly on the page telemetry and data below, as well as previous conversation messages. Be specific, data-driven, and concise.
Do not reveal access tokens or sensitive internal IDs.

STRICT INSTRUCTION:
You must ONLY answer questions if the user query is strictly related to this Facebook Page's content, telemetry, performance metrics, posts, insights, or the previous messages in this conversation. If the question is NOT related to the page content or previous conversation messages, you must refuse to answer and reply that you can only help with questions related to this Facebook Page and its analytics.

PAGE DATA CONTEXT:
{page_context}"""

    if is_new:
        base += """

IMPORTANT: Since this is the FIRST message in a new conversation, you must also generate a short, 
descriptive title (maximum 5 words) for this conversation based on the user's inquiry.
Provide the response matching the required schema with title and response fields.
"""
    return base


async def ask_llm(
    *,
    page_content: DashboardResponse,
    user_query: str,
    conversation_id: str | None,
    user_id: str,
    page_id: str,
    model: str,
    api_key: str,
    db: AsyncSession,
    history_limit: int = 5,
) -> dict:
    """
    Process a chat question using the user-selected Gemini model.
    Creates a new conversation if conversation_id is None.
    Fetches up to history_limit previous messages using conversation_id and user_id.
    Returns dict with conversation_id, title, user_query, llm_response.
    """
    client = genai.Client(api_key=api_key)
    page_context = _build_chat_context(page_content)
    is_new = not conversation_id

    # Build conversation history for existing conversations (at most history_limit messages)
    history_contents: list[types.Content] = []
    conversation: Conversation | None = None

    if not is_new and conversation_id:
        try:
            conv_uuid = uuid.UUID(conversation_id)
        except ValueError:
            raise ValueError(f"Invalid conversation ID format: {conversation_id}")

        conv_result = await db.execute(
            select(Conversation).where(
                Conversation.id == conv_uuid,
                Conversation.user_id == user_id,
            )
        )
        conversation = conv_result.scalar_one_or_none()
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found or access denied")

        # Fetch at most history_limit latest messages for this conversation
        msg_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conv_uuid)
            .order_by(Message.created_at.desc(), Message.id.desc())
            .limit(history_limit)
        )
        # Reverse to maintain chronological order in context
        prev_messages = list(reversed(msg_result.scalars().all()))

        for msg in prev_messages:
            history_contents.append(
                types.Content(role="user", parts=[types.Part.from_text(text=msg.user_query)])
            )
            history_contents.append(
                types.Content(role="model", parts=[types.Part.from_text(text=msg.llm_response)])
            )

    # Build the full contents list
    system_prompt = _build_system_prompt(page_context, is_new)
    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text=system_prompt)]),
        types.Content(
            role="model",
            parts=[
                types.Part.from_text(
                    text="Understood. I have the page analytics data and previous messages. I will strictly answer questions related to this Facebook Page or previous conversation context, and decline any unrelated queries."
                )
            ],
        ),
        *history_contents,
        types.Content(role="user", parts=[types.Part.from_text(text=user_query)]),
    ]

    title = "New Conversation"
    llm_response = ""

    if is_new:
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=_FirstTurnOutput,
        )
        response = await client.aio.models.generate_content(
            model=model,
            contents=contents,
            config=config,
        )
        raw_text = response.text or ""
        try:
            parsed = _FirstTurnOutput.model_validate_json(raw_text)
            title = parsed.title.strip() or "New Conversation"
            llm_response = parsed.response.strip()
        except Exception:
            title = user_query[:40].strip() or "New Conversation"
            llm_response = raw_text

        conversation = Conversation(
            user_id=user_id,
            page_id=page_id,
            title=title,
        )
        db.add(conversation)
        await db.flush()
    else:
        config = types.GenerateContentConfig()
        response = await client.aio.models.generate_content(
            model=model,
            contents=contents,
            config=config,
        )
        llm_response = (response.text or "").strip()

    assert conversation is not None

    # Create and persist message
    message = Message(
        conversation_id=conversation.id,
        user_query=user_query,
        llm_response=llm_response,
    )
    db.add(message)
    await db.commit()

    return {
        "conversation_id": str(conversation.id),
        "title": conversation.title,
        "user_query": user_query,
        "llm_response": llm_response,
    }
