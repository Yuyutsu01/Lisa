"""
API v1 Root Router aggregator for Lisa.
"""

from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.workspaces import router as workspaces_router
from app.api.v1.brands import router as brands_router
from app.api.v1.media import router as media_router
from app.api.v1.sources import router as sources_router
from app.api.v1.generation import router as generation_router
from app.api.v1.variants import router as variants_router
from app.api.v1.derivatives import router as derivatives_router
from app.api.v1.calendar import router as calendar_router
from app.api.v1.connections import router as connections_router
from app.api.v1.publishing import router as publishing_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.audit import router as audit_router
from app.api.v1.ws import router as ws_router
from app.api.v1.linkedin_oauth import router as linkedin_oauth_router
from app.api.v1.discord_connection import router as discord_connection_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(workspaces_router)
api_router.include_router(brands_router)
api_router.include_router(media_router)
api_router.include_router(sources_router)
api_router.include_router(generation_router)
api_router.include_router(variants_router)
api_router.include_router(derivatives_router)
api_router.include_router(calendar_router)
api_router.include_router(connections_router)
api_router.include_router(discord_connection_router)
api_router.include_router(linkedin_oauth_router)
api_router.include_router(publishing_router)
api_router.include_router(analytics_router)
api_router.include_router(audit_router)
api_router.include_router(ws_router)
