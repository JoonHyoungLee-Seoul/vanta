from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import config
from database import get_db
from models import User

# HTTP Bearer 토큰 스키마
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT 액세스 토큰 생성

    Args:
        data: 토큰에 포함할 데이터 (일반적으로 user_id)
        expires_delta: 토큰 만료 시간 (기본값: 24시간)

    Returns:
        생성된 JWT 토큰 문자열
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=config.JWT_EXPIRATION_HOURS)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        config.JWT_SECRET_KEY,
        algorithm=config.JWT_ALGORITHM
    )

    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    JWT 토큰 검증

    Args:
        token: 검증할 JWT 토큰

    Returns:
        토큰에서 추출한 데이터

    Raises:
        HTTPException: 토큰이 유효하지 않거나 만료된 경우
    """
    try:
        payload = jwt.decode(
            token,
            config.JWT_SECRET_KEY,
            algorithms=[config.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰이 만료되었습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    현재 인증된 사용자 조회

    Args:
        credentials: HTTP Bearer 토큰
        db: 데이터베이스 세션

    Returns:
        인증된 User 객체

    Raises:
        HTTPException: 인증 실패 시
    """
    token = credentials.credentials
    payload = verify_token(token)

    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰에 사용자 정보가 없습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 데이터베이스에서 사용자 조회
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    현재 사용자 조회 (선택적 인증)

    토큰이 없어도 에러를 발생시키지 않고 None을 반환합니다.

    Args:
        credentials: HTTP Bearer 토큰 (선택적)
        db: 데이터베이스 세션

    Returns:
        인증된 User 객체 또는 None
    """
    if credentials is None:
        return None

    try:
        token = credentials.credentials
        payload = verify_token(token)

        user_id: int = payload.get("user_id")
        if user_id is None:
            return None

        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        return user
    except HTTPException:
        return None


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    현재 관리자 사용자 조회

    환경변수에 설정된 관리자 ID 목록과 비교하여 관리자 권한을 확인합니다.

    Args:
        current_user: 현재 인증된 사용자

    Returns:
        관리자 User 객체

    Raises:
        HTTPException: 관리자 권한이 없는 경우
    """
    import os

    # 환경변수에서 관리자 ID 목록 읽기 (쉼표로 구분)
    admin_ids_str = os.getenv("ADMIN_USER_IDS", "")
    if not admin_ids_str:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 없습니다."
        )

    try:
        admin_ids = [int(id.strip()) for id in admin_ids_str.split(",") if id.strip()]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="서버 설정 오류"
        )

    if current_user.id not in admin_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 없습니다."
        )

    return current_user
