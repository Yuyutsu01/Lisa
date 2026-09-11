"""
Main FastAPI Application Entrypoint for Lisa.

Sets up middleware, CORS, database lifespan management, and v1 API routes.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Initializes database tables on boot.
    """
    # Initialize DB schemas on startup
    await init_db()
    yield
    # Cleanup logic if needed on shutdown


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
