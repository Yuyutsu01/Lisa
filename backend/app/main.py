"""
Main FastAPI Application Entrypoint for Lisa.

Sets up middleware, CORS, database lifespan management, static files, and v1 API routes.
"""

import sys

# Ensure UTF-8 output encoding on Windows to prevent charmap UnicodeEncodeError on emojis
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import init_db
from app.core.storage import UPLOAD_DIR


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Initializes database tables and creates storage directory on boot.
    """
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for Uploads preview
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for container orchestrators and load balancers.
    """
    return {
        "status": "healthy",
        "service": "Lisa Backend API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }
