from fastapi import FastAPI, Depends, Request, status, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
from uuid import uuid4
import bcrypt
import logging
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
import config
from database import get_db
from models import Invitation, RegisterSession, User, Enrollment
from auth import get_current_user, get_current_admin_user

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# ====================================================================================
# CORS 설정
# ====================================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================================================================================
# 전역 예외 핸들러
# ====================================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """모든 예상치 못한 예외를 처리"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"ok": False, "message": "서버 내부 오류가 발생했습니다."}
    )

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Pydantic 검증 에러 처리"""
    logger.warning(f"Validation error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"ok": False, "message": "입력값이 올바르지 않습니다."}
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """데이터베이스 에러 처리"""
    logger.error(f"Database error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"ok": False, "message": "데이터베이스 오류가 발생했습니다."}
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """ValueError 처리"""
    logger.warning(f"Value error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"ok": False, "message": str(exc)}
    )

# ====================================================================================
# 헬스 체크 API
# ====================================================================================

@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    return {"status": "ok", "service": "vanta-backend"}

# ====================================================================================
# 초대코드 검증 API
# ====================================================================================


class InvitationReq(BaseModel):
    invitation_code: str


@app.post("/auth/invitation/verify")
async def verify_invitation(req: InvitationReq, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Invitation).where(Invitation.code == req.invitation_code)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        return {"valid": False, "message": "초대코드가 유효하지 않습니다."}

    if not invitation.is_active:
        return {"valid": False, "message": "비활성화된 초대코드입니다."}

    session_id = uuid4().hex

    new_session = RegisterSession(
        sessionId=session_id,
        invitationId=invitation.id,
    )
    db.add(new_session)
    await db.commit()

    return {"valid": True, "sessionId": session_id}


# ====================================================================================
# 로그인 API
# ====================================================================================


class LoginReq(BaseModel):
    user_id: str
    password: str


@app.post("/auth/login")
async def login(req: LoginReq, db: AsyncSession = Depends(get_db)):
    # userId로 유저 찾기
    result = await db.execute(
        select(User).where(User.userId == req.user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        return {"ok": False, "message": "아이디 또는 비밀번호가 일치하지 않습니다."}

    # 비밀번호 검증
    password_match = bcrypt.checkpw(
        req.password.encode("utf-8"),
        user.password.encode("utf-8")
    )

    if not password_match:
        return {"ok": False, "message": "아이디 또는 비밀번호가 일치하지 않습니다."}

    # JWT 토큰 생성
    from auth import create_access_token
    access_token = create_access_token(data={"user_id": user.id})

    # 로그인 성공
    return {
        "ok": True,
        "userId": user.id,
        "name": user.name,
        "accessToken": access_token,
        "tokenType": "bearer"
    }


# ====================================================================================
# 이름 저장
# ====================================================================================


class NameReq(BaseModel):
    session_id: str
    name: str


@app.put("/auth/register/name")
async def save_name(req: NameReq, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RegisterSession).where(RegisterSession.sessionId == req.session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        return {"ok": False, "message": "세션이 만료되었습니다."}

    session.name = req.name
    await db.commit()

    return {"ok": True}


# ====================================================================================
# 생년월일 저장
# ====================================================================================


class BirthReq(BaseModel):
    session_id: str
    birthday: str


@app.put("/auth/register/birthday")
async def save_birthday(req: BirthReq, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RegisterSession).where(RegisterSession.sessionId == req.session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        return {"ok": False, "message": "세션이 만료되었습니다."}

    session.birthday = req.birthday
    await db.commit()

    return {"ok": True}


# ====================================================================================
# 휴대폰 저장
# ====================================================================================


class PhoneReq(BaseModel):
    session_id: str
    phone: str


@app.put("/auth/register/phone")
async def save_phone(req: PhoneReq, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RegisterSession).where(RegisterSession.sessionId == req.session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        return {"ok": False, "message": "세션이 만료되었습니다."}

    if not session.name or not session.birthday:
        return {"ok": False, "message": "이전 단계가 완료되지 않았습니다."}

    # 이미 사용 중인 전화번호인지 확인
    result = await db.execute(
        select(User).where(User.phone == req.phone)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        return {"ok": False, "message": "이미 사용 중인 전화번호입니다."}

    session.phone = req.phone
    await db.commit()

    return {"ok": True}


# ====================================================================================
# 유저 ID 저장
# ====================================================================================


class UserIdReq(BaseModel):
    session_id: str
    user_id: str


@app.put("/auth/register/userid")
async def save_user_id(req: UserIdReq, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RegisterSession).where(RegisterSession.sessionId == req.session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        return {"ok": False, "message": "세션이 만료되었습니다."}

    if not session.name or not session.birthday or not session.phone:
        return {"ok": False, "message": "이전 단계가 완료되지 않았습니다."}

    # 이미 사용 중인 userId인지 확인
    result = await db.execute(
        select(User).where(User.userId == req.user_id)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        return {"ok": False, "message": "이미 사용 중인 ID입니다."}

    session.userId = req.user_id
    await db.commit()

    return {"ok": True}


# ====================================================================================
# 비밀번호 저장 + 최종 User 생성
# ====================================================================================


class PasswordReq(BaseModel):
    session_id: str
    password: str


@app.put("/auth/register/password")
async def save_password(req: PasswordReq, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RegisterSession).where(RegisterSession.sessionId == req.session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        return {"ok": False, "message": "세션이 만료되었습니다."}

    if not session.name or not session.birthday or not session.phone or not session.userId:
        return {"ok": False, "message": "이전 단계가 완료되지 않았습니다."}

    # 비밀번호 해시 처리
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(req.password.encode("utf-8"), salt).decode("utf-8")

    # 최종 User 생성
    new_user = User(
        userId=session.userId,
        name=session.name,
        password=hashed_password,
        birthday=session.birthday,
        phone=session.phone,
        invitationId=session.invitationId,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # JWT 토큰 생성 (회원가입 완료 시 자동 로그인)
    from auth import create_access_token
    access_token = create_access_token(data={"user_id": new_user.id})

    return {
        "ok": True,
        "userId": new_user.id,
        "accessToken": access_token,
        "tokenType": "bearer"
    }


# ====================================================================================
# 파티 참가 (Enroll)
# ====================================================================================


class EnrollReq(BaseModel):
    user_id: int
    party_id: int


@app.post("/enroll")
async def enroll_party(
    req: EnrollReq,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 권한 확인: 자신만 파티에 등록 가능
    if current_user.id != req.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="권한이 없습니다."
        )

    # 유저 존재 확인
    result = await db.execute(select(User).where(User.id == req.user_id))
    user = result.scalar_one_or_none()

    if not user:
        return {"ok": False, "message": "유저를 찾을 수 없습니다."}

    # 이미 참가했는지 확인 (중복 레코드가 있을 경우 가장 최근 것을 사용)
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.userId == req.user_id,
            Enrollment.partyId == req.party_id
        ).order_by(Enrollment.createdAt.desc())
    )
    existing = result.scalars().first()

    if existing:
        if existing.status == "pending":
            return {"ok": True, "message": "참가 신청이 승인 대기 중입니다.", "enrollment_id": existing.id, "status": "pending"}
        elif existing.status == "approved":
            return {"ok": True, "message": "이미 참가한 파티입니다.", "enrollment_id": existing.id, "status": "approved"}
        elif existing.status == "rejected":
            return {"ok": False, "message": "참가 신청이 거절되었습니다.", "enrollment_id": existing.id, "status": "rejected"}

    # 새로운 참가 기록 생성 (승인 대기 상태)
    new_enrollment = Enrollment(
        userId=req.user_id,
        partyId=req.party_id,
        enrolled=True,
        status="pending"
    )
    db.add(new_enrollment)
    await db.commit()
    await db.refresh(new_enrollment)

    return {"ok": True, "message": "파티 참가 신청이 완료되었습니다. 운영진의 승인을 기다려주세요.", "enrollment_id": new_enrollment.id, "status": "pending"}


# ====================================================================================
# 파티 참가 상태 확인
# ====================================================================================


@app.get("/enrollment/check/{user_id}/{party_id}")
async def check_enrollment(user_id: int, party_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.userId == user_id,
            Enrollment.partyId == party_id
        ).order_by(Enrollment.createdAt.desc())
    )
    enrollment = result.scalars().first()

    return {"enrolled": enrollment is not None}


# ====================================================================================
# Enrollment 목록 조회 (관리자용)
# ====================================================================================


@app.get("/enrollments")
async def get_all_enrollments(
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """모든 enrollment 정보를 User 정보와 함께 조회 (관리자 전용)"""
    result = await db.execute(
        select(Enrollment).join(User)
    )
    enrollments = result.scalars().all()

    result_list = []
    for enrollment in enrollments:
        # Load user relationship
        await db.refresh(enrollment, ["user"])
        result_list.append(
            {
                "id": enrollment.id,
                "partyId": enrollment.partyId,
                "enrolled": enrollment.enrolled,
                "createdAt": enrollment.createdAt.isoformat(),
                "user": {
                    "id": enrollment.user.id,
                    "name": enrollment.user.name,
                    "birthday": enrollment.user.birthday,
                    "phone": enrollment.user.phone,
                },
            }
        )

    return {"enrollments": result_list, "total": len(result_list)}


@app.get("/enrollments/party/{party_id}")
async def get_party_enrollments(
    party_id: int,
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """특정 파티의 enrollment 정보를 User 정보와 함께 조회 (관리자 전용)"""
    result = await db.execute(
        select(Enrollment).where(Enrollment.partyId == party_id).join(User)
    )
    enrollments = result.scalars().all()

    result_list = []
    for enrollment in enrollments:
        # Load user relationship
        await db.refresh(enrollment, ["user"])
        result_list.append(
            {
                "id": enrollment.id,
                "partyId": enrollment.partyId,
                "enrolled": enrollment.enrolled,
                "createdAt": enrollment.createdAt.isoformat(),
                "user": {
                    "id": enrollment.user.id,
                    "name": enrollment.user.name,
                    "birthday": enrollment.user.birthday,
                    "phone": enrollment.user.phone,
                },
            }
        )

    return {"partyId": party_id, "enrollments": result_list, "total": len(result_list)}


# ====================================================================================
# Enrollment 승인 관리 (관리자용)
# ====================================================================================


@app.get("/admin/enrollments/pending")
async def get_pending_enrollments(
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """승인 대기 중인 enrollment 목록 조회 (관리자 전용)"""
    result = await db.execute(
        select(Enrollment)
        .where(Enrollment.status == "pending")
        .join(User)
        .order_by(Enrollment.createdAt.desc())
    )
    enrollments = result.scalars().all()

    result_list = []
    for enrollment in enrollments:
        # Load user relationship
        await db.refresh(enrollment, ["user"])
        result_list.append(
            {
                "id": enrollment.id,
                "partyId": enrollment.partyId,
                "status": enrollment.status,
                "createdAt": enrollment.createdAt.isoformat(),
                "user": {
                    "id": enrollment.user.id,
                    "userId": enrollment.user.userId,
                    "name": enrollment.user.name,
                    "birthday": enrollment.user.birthday,
                    "phone": enrollment.user.phone,
                },
            }
        )

    return {"ok": True, "enrollments": result_list, "total": len(result_list)}


class EnrollmentApprovalReq(BaseModel):
    enrollment_id: int


@app.post("/admin/enrollments/approve")
async def approve_enrollment(
    req: EnrollmentApprovalReq,
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Enrollment 승인 (관리자 전용)"""
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == req.enrollment_id)
    )
    enrollment = result.scalar_one_or_none()

    if not enrollment:
        return {"ok": False, "message": "Enrollment를 찾을 수 없습니다."}

    if enrollment.status == "approved":
        return {"ok": True, "message": "이미 승인된 enrollment입니다."}

    # 승인 처리
    enrollment.status = "approved"
    await db.commit()
    await db.refresh(enrollment)

    return {"ok": True, "message": "Enrollment가 승인되었습니다.", "enrollment_id": enrollment.id}


@app.post("/admin/enrollments/reject")
async def reject_enrollment(
    req: EnrollmentApprovalReq,
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Enrollment 거절 (관리자 전용)"""
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == req.enrollment_id)
    )
    enrollment = result.scalar_one_or_none()

    if not enrollment:
        return {"ok": False, "message": "Enrollment를 찾을 수 없습니다."}

    if enrollment.status == "rejected":
        return {"ok": True, "message": "이미 거절된 enrollment입니다."}

    # 거절 처리
    enrollment.status = "rejected"
    await db.commit()
    await db.refresh(enrollment)

    return {"ok": True, "message": "Enrollment가 거절되었습니다.", "enrollment_id": enrollment.id}


# ====================================================================================
# 쿠폰 조회
# ====================================================================================


@app.get("/coupon/{user_id}/{party_id}")
async def get_coupon(
    user_id: int,
    party_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """특정 유저의 특정 파티 쿠폰 상태 조회"""
    # 권한 확인: 자신의 쿠폰만 조회 가능
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="권한이 없습니다."
        )

    result = await db.execute(
        select(Enrollment).where(
            Enrollment.userId == user_id,
            Enrollment.partyId == party_id
        ).order_by(Enrollment.createdAt.desc())
    )
    enrollment = result.scalars().first()

    if not enrollment:
        return {"ok": False, "message": "쿠폰을 찾을 수 없습니다."}

    # 승인된 enrollment만 쿠폰 제공
    if enrollment.status != "approved":
        if enrollment.status == "pending":
            return {"ok": False, "message": "참가 신청이 승인 대기 중입니다.", "status": "pending"}
        elif enrollment.status == "rejected":
            return {"ok": False, "message": "참가 신청이 거절되었습니다.", "status": "rejected"}

    return {
        "ok": True,
        "couponUsed": enrollment.couponUsed,
        "partyId": enrollment.partyId,
        "status": enrollment.status
    }


# ====================================================================================
# 쿠폰 사용
# ====================================================================================


class UseCouponReq(BaseModel):
    user_id: int
    party_id: int


@app.put("/coupon/use")
async def use_coupon(
    req: UseCouponReq,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """쿠폰 사용 처리"""
    # 권한 확인: 자신의 쿠폰만 사용 가능
    if current_user.id != req.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="권한이 없습니다."
        )

    result = await db.execute(
        select(Enrollment).where(
            Enrollment.userId == req.user_id,
            Enrollment.partyId == req.party_id
        )
    )
    enrollment = result.scalar_one_or_none()

    if not enrollment:
        return {"ok": False, "message": "쿠폰을 찾을 수 없습니다."}

    if enrollment.couponUsed:
        return {"ok": False, "message": "이미 사용된 쿠폰입니다."}

    # 쿠폰 사용 처리
    enrollment.couponUsed = True
    await db.commit()

    return {"ok": True, "message": "쿠폰이 사용되었습니다."}


# ====================================================================================
# 유저 프로필 조회
# ====================================================================================


@app.get("/profile/{user_id}")
async def get_user_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """유저의 전체 프로필 정보 조회 (개인정보 + 참가한 파티 + 쿠폰 상태)"""
    # 권한 확인: 자신의 프로필만 조회 가능
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="권한이 없습니다."
        )

    # 유저 기본 정보 조회
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        return {"ok": False, "message": "유저를 찾을 수 없습니다."}

    # 유저의 모든 Enrollment 조회
    result = await db.execute(
        select(Enrollment).where(Enrollment.userId == user_id)
    )
    enrollments = result.scalars().all()

    # 파티별 정보 정리
    enrolled_parties = []
    total_coupons = 0
    used_coupons = 0

    for enrollment in enrollments:
        enrolled_parties.append({
            "partyId": enrollment.partyId,
            "enrolledAt": enrollment.createdAt.isoformat(),
            "couponUsed": enrollment.couponUsed,
            "status": enrollment.status  # 승인 상태 추가
        })
        # approved 상태인 경우에만 쿠폰으로 카운트
        if enrollment.status == "approved":
            total_coupons += 1
            if enrollment.couponUsed:
                used_coupons += 1

    return {
        "ok": True,
        "user": {
            "id": user.id,
            "userId": user.userId,
            "name": user.name,
            "birthday": user.birthday,
            "phone": user.phone,
        },
        "enrollments": enrolled_parties,
        "couponSummary": {
            "total": total_coupons,
            "used": used_coupons,
            "available": total_coupons - used_coupons
        }
    }


# ====================================================================================
# 결제 정보 조회
# ====================================================================================


@app.get("/payment/info")
async def get_payment_info():
    """결제 정보 조회 (환경변수에서 읽음)"""
    import config
    return {
        "ok": True,
        "payment": {
            "bankName": config.BANK_NAME,
            "accountNumber": config.BANK_ACCOUNT_NUMBER,
            "accountHolder": config.BANK_ACCOUNT_HOLDER,
            "amount": config.PAYMENT_AMOUNT
        }
    }
