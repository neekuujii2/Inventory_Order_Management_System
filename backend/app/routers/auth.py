import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import (
    EmailVerificationRequest,
    ForgotPasswordRequest,
    MessageResponse,
    RefreshTokenRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


def hash_password(password: str) -> str:
    import hashlib

    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"pbkdf2_sha256$100000${salt.hex()}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    import hashlib
    import secrets

    if not password_hash.startswith("pbkdf2_sha256$"):
        return False

    _, iterations, salt_hex, digest_hex = password_hash.split("$")
    salt = bytes.fromhex(salt_hex)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations))
    return secrets.compare_digest(digest.hex(), digest_hex)


def create_access_token(subject: str, role: str, remember_me: bool) -> str:
    expires_minutes = settings.jwt_access_token_expires_minutes
    if remember_me:
        expires_minutes *= 2
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def create_refresh_token(subject: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_token_expires_days)
    payload = {"sub": subject, "role": role, "type": "refresh", "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])


def serialize_user(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role.value if user.role else "staff",
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_locked=user.is_locked,
        last_login_at=user.last_login_at,
    )


def issue_tokens(user: User, remember_me: bool) -> TokenResponse:
    access_token = create_access_token(user.email, user.role.value, remember_me)
    refresh_token = create_refresh_token(user.email, user.role.value)
    user.refresh_token = refresh_token
    user.last_login_at = datetime.now(timezone.utc)
    user.failed_login_attempts = 0
    user.is_locked = False
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_access_token_expires_minutes * 60,
        verification_code=user.verification_code,
        user=serialize_user(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    verification_code = f"{secrets.randbelow(900000) + 100000:06d}"
    user = User(
        full_name=payload.full_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=UserRole(payload.role),
        verification_code=verification_code,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    tokens = issue_tokens(user, payload.remember_me)
    db.commit()
    return tokens


@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.is_locked:
        raise HTTPException(status_code=403, detail="Account locked due to repeated failed attempts")
    if not verify_password(payload.password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.is_locked = True
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    tokens = issue_tokens(user, payload.remember_me)
    db.commit()
    return tokens


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        decoded = decode_token(payload.refresh_token)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc

    user = db.query(User).filter(User.email == decoded["sub"].lower()).first()
    if not user or user.refresh_token != payload.refresh_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    tokens = issue_tokens(user, False)
    db.commit()
    return tokens


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(payload: EmailVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or user.verification_code != payload.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user.is_verified = True
    user.verification_code = None
    db.commit()
    return MessageResponse(message="Email verified successfully")


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user:
        user.password_reset_code = f"{secrets.randbelow(900000) + 100000:06d}"
        user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.commit()
    return MessageResponse(message="If the email exists, a reset code has been issued", code=user.password_reset_code if user else None)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset request")
    if not user.password_reset_code or not user.password_reset_expires_at:
        raise HTTPException(status_code=400, detail="Reset code not found")
    if user.password_reset_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset code expired")
    if user.password_reset_code != payload.code:
        raise HTTPException(status_code=400, detail="Invalid reset code")

    user.password_hash = hash_password(payload.new_password)
    user.password_reset_code = None
    user.password_reset_expires_at = None
    user.is_locked = False
    user.failed_login_attempts = 0
    db.commit()
    return MessageResponse(message="Password reset successfully")
