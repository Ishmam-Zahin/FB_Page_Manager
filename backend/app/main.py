import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import dashboard, chat

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown tasks."""
    from app.database import engine, Base
    from app import models  # noqa: F401 - ensure models are imported

    if engine is not None:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables verified/created successfully.")
        except Exception as e:
            logger.error("Error creating database tables on startup: %s", e)
    yield


app = FastAPI(
    title="Facebook Page Dashboard Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
origins = settings.allowed_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard.router)
app.include_router(chat.router)


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for deployment monitoring."""
    return {
        "status": "ok",
        "gemini_model": settings.gemini_model,
        "graph_api_version": settings.graph_api_version,
    }
