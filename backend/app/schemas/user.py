"""
User validation and serialization schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        # Sanitize whitespace
        v = v.strip()
        # Enforce name length boundaries
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Name must be between 2 and 100 characters")
        # Disallow dangerous or invalid characters
        forbidden = set('<>{}[]\\/|";')
        if any(c in forbidden for c in v):
            raise ValueError("Name contains invalid characters")
        # Ensure name contains at least one alphabetic character (supports all Unicode alphabets)
        if not any(c.isalpha() for c in v):
            raise ValueError("Name must contain at least one letter")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

