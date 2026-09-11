"""
Authentication Endpoints for Lisa.

Handles user registration, login, token issuance, and profile retrieval.
Automatically provisions a default workspace and brand profile on registration.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import re

from app.db.session import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
)
from app.models.user import User, UserStatus
from app.models.workspace import Workspace, WorkspaceMember, WorkspaceRole
from app.models.brand import BrandProfile
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate
from app.schemas.token import Token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def generate_slug(text: str) -> str:
    """Generate a clean URL-friendly slug from text."""
    slug = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "-", slug) or "workspace"


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user account.
    Provisions a default personal workspace and initial brand profile.
    """
    # Check if user already exists
    existing_user = await db.execute(
        select(User).where(User.email == user_in.email.lower())
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    # Create User
    new_user = User(
        email=user_in.email.lower(),
        name=user_in.name,
        password_hash=get_password_hash(user_in.password),
        status=UserStatus.ACTIVE.value,
    )
    db.add(new_user)
    await db.flush()

    # Create Default Workspace for the user
    base_slug = generate_slug(f"{new_user.name}-workspace")
    slug = f"{base_slug}-{new_user.id[:6]}"
    default_workspace = Workspace(
        name=f"{new_user.name}'s Workspace",
        slug=slug,
        owner_id=new_user.id,
        settings_json={"timezone": "UTC", "default_language": "English"},
    )
    db.add(default_workspace)
    await db.flush()

    # Add user as OWNER of their default workspace
    membership = WorkspaceMember(
        workspace_id=default_workspace.id,
        user_id=new_user.id,
        role=WorkspaceRole.OWNER.value,
    )
    db.add(membership)

    # Initialize Brand Profile for the workspace
    brand_profile = BrandProfile(
        workspace_id=default_workspace.id,
        name=new_user.name,
        description=f"Brand profile for {new_user.name}",
        tone="Professional, informative, and engaging",
        preferred_language="English",
        content_pillars_json=[
            {"name": "Industry Insights", "target_percentage": 40},
            {"name": "How-To Guides", "target_percentage": 30},
            {"name": "Product Updates", "target_percentage": 30},
        ],
    )
    db.add(brand_profile)
    await db.commit()

    # Issue access token
    access_token = create_access_token(subject=new_user.id)

    return {
        "user": UserResponse.model_validate(new_user),
        "workspace_id": default_workspace.id,
        "token": Token(access_token=access_token, token_type="bearer"),
    }


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate with email and password to receive a JWT access token.
    """
    result = await db.execute(
        select(User).where(User.email == credentials.email.lower())
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != UserStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or suspended",
        )

    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Fetch profile details of the authenticated user.
    """
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update profile details (name, password) of the authenticated user.
    """
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.password is not None:
        current_user.password_hash = get_password_hash(user_update.password)

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user
