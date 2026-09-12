"""
Security and Cryptography Module for Lisa.

Provides password hashing and verification using native bcrypt, as well as
JWT token encoding and decoding for secure authentication.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
import bcrypt
from jose import jwt
from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against the stored bcrypt hash.
    Bcrypt has a 72-byte limit on inputs, so we slice the encoded bytes.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """
    Hash a raw password using native bcrypt with automatic salt generation.
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8")[:72], salt)
    return hashed.decode("utf-8")


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Generate a signed JSON Web Token (JWT) containing the user's ID as subject (`sub`).
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.now(timezone.utc),
    }

    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a signed JWT token.
    Returns the decoded payload dict if valid, or None if expired/malformed.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except Exception:
        return None
