"""
Async SQLAlchemy database setup for Neon PostgreSQL.
"""
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()


from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse


def get_async_database_url(url: str) -> str:
    """
    Normalize postgres connection strings for asyncpg:
    1. Scheme: postgres:// or postgresql:// -> postgresql+asyncpg://
    2. Query params: converts 'sslmode' to 'ssl' and removes unsupported parameters
       like 'channel_binding' which cause asyncpg.connect() unexpected keyword argument errors.
    """
    if not url:
        return ""

    parsed = urlparse(url)
    scheme = parsed.scheme

    if scheme in ("postgres", "postgresql"):
        scheme = "postgresql+asyncpg"
    elif scheme == "postgresql+psycopg" or scheme == "postgresql+psycopg2":
        scheme = "postgresql+asyncpg"

    query_params = dict(parse_qsl(parsed.query))
    clean_params: dict[str, str] = {}

    for k, v in query_params.items():
        if k == "sslmode":
            clean_params["ssl"] = v
        elif k in ("channel_binding",):
            # asyncpg does not accept channel_binding
            continue
        else:
            clean_params[k] = v

    new_query = urlencode(clean_params)
    return urlunparse(
        (scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment)
    )


db_url = get_async_database_url(settings.database_url)

engine = (
    create_async_engine(db_url, echo=False)
    if db_url
    else None
)

AsyncSessionLocal = (
    async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    if engine is not None
    else None
)


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI dependency that yields an async DB session."""
    if AsyncSessionLocal is None:
        raise HTTPException(
            status_code=503,
            detail="Database is not configured. Please set DATABASE_URL in .env.",
        )
    async with AsyncSessionLocal() as session:
        yield session
