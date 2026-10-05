"""
Chat router — conversation management and LLM Q&A.
"""
from __future__ import annotations

import logging
import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_db
from app.models import Conversation, Message
from app.schemas import (
    ChatMessageOut,
    ChatRequest,
    ChatResponse,
    ConversationOut,
)
from app.services.chat import ask_llm

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


@router.post("/ask", response_model=ChatResponse)
async def chat_ask(
    body: ChatRequest,
    settings: Settings = Depends(get_settings),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")

    try:
        result = await ask_llm(
            page_content=body.page_content,
            user_query=body.user_query,
            conversation_id=body.conversation_id,
            user_id=body.user_id,
            page_id=body.page_id,
            model=body.model,
            api_key=settings.gemini_api_key,
            db=db,
            history_limit=settings.chat_history_limit,
        )
        return ChatResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Chat error: %s", e)
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(
    user_id: str = Query(..., description="Facebook user ID"),
    page_id: str = Query(..., description="Facebook page ID"),
    db: AsyncSession = Depends(get_db),
) -> list[ConversationOut]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id, Conversation.page_id == page_id)
        .order_by(Conversation.created_at.desc())
    )
    conversations = result.scalars().all()
    return [
        ConversationOut(
            id=str(c.id),
            title=c.title,
            page_id=c.page_id,
            created_at=c.created_at.isoformat(),
        )
        for c in conversations
    ]


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[ChatMessageOut],
)
async def list_messages(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[ChatMessageOut]:
    try:
        conv_uuid = _uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format.")

    conv = await db.get(Conversation, conv_uuid)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv_uuid)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    return [
        ChatMessageOut(
            id=str(m.id),
            user_query=m.user_query,
            llm_response=m.llm_response,
            created_at=m.created_at.isoformat(),
        )
        for m in messages
    ]


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        conv_uuid = _uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format.")

    conv = await db.get(Conversation, conv_uuid)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    await db.delete(conv)  # cascade deletes messages
    await db.commit()
