# 프론트엔드-백엔드 통합 가이드

## 📋 목차
1. [현재 상황 분석](#현재-상황-분석)
2. [SQLAlchemy 마이그레이션](#sqlalchemy-마이그레이션)
3. [데이터베이스 스키마](#데이터베이스-스키마)
4. [API 엔드포인트](#api-엔드포인트)
5. [주요 기능](#주요-기능)
6. [실행 방법](#실행-방법)
7. [관리자 도구](#관리자-도구)
8. [배포 옵션](#배포-옵션)

---

## 현재 상황 분석

### 프론트엔드
- **위치**: `/Users/ijunhyeong/Desktop/vanta/myapp-frontend`
- **기술**: React 19 + Vite + React Router
- **포트**: 5173 (Vite 기본값)
- **상태**: ✅ API 통신 완료

### 백엔드
- **위치**: `/Users/ijunhyeong/Desktop/vanta/myapp-backend`
- **기술**: FastAPI + SQLAlchemy + PostgreSQL (Supabase)
- **포트**: 8000
- **상태**: ✅ 모든 API 구현 완료 (SQLAlchemy로 마이그레이션 완료)

### 통합 상태

| 기능 | 프론트엔드 라우트 | 백엔드 API | 상태 |
|-----|----------------|-----------|------|
| 초대코드 검증 | `/invite` | `POST /auth/invitation/verify` | ✅ 완료 |
| 이름 입력 | `/register/name` | `PUT /auth/register/name` | ✅ 완료 |
| 생년월일 입력 | `/register/birthday` | `PUT /auth/register/birthday` | ✅ 완료 |
| 휴대폰 입력 | `/register/phone` | `PUT /auth/register/phone` | ✅ 완료 |
| 비밀번호 입력 | `/register/password` | `PUT /auth/register/password` | ✅ 완료 |
| 파티 목록 | `/parties` | - | ✅ 완료 |
| 파티 상세 | `/party/:id` | `GET /enrollment/check/{user_id}/{party_id}` | ✅ 완료 |
| 파티 참가 | `/payment/:id` | `POST /enroll` | ✅ 완료 |

---

## SQLAlchemy 마이그레이션

### 마이그레이션 개요

**날짜:** 2025년 12월 7일
**이유:** Prisma Client Python의 Supabase 연결 문제로 인한 SQLAlchemy 전환
**결과:** ✅ 완료 - 모든 API가 동일하게 작동

### 변경 사항

#### 이전: Prisma Client Python
```python
from prisma import Prisma

db = Prisma()
await db.connect()
invitation = await db.invitation.find_unique(where={"code": code})
await db.disconnect()
```

#### 현재: SQLAlchemy + asyncpg
```python
from sqlalchemy import select
from database import AsyncSessionLocal
from models import Invitation

async with AsyncSessionLocal() as session:
    result = await session.execute(
        select(Invitation).where(Invitation.code == code)
    )
    invitation = result.scalar_one_or_none()
```

### 주요 파일

**새로 추가된 파일:**
- `models.py` - SQLAlchemy ORM 모델 정의
- `database.py` - 데이터베이스 연결 설정
- `create_tables.py` - 테이블 생성 스크립트
- `seed_data.py` - 초대코드 시딩 스크립트

**수정된 파일:**
- `main.py` - 모든 API 엔드포인트를 SQLAlchemy로 변경
- `.env` - Supabase Pooler URL로 업데이트

**유지되는 파일:**
- `prisma/schema.prisma` - Prisma Studio GUI 도구용으로 유지
- 프론트엔드 파일들 - 변경 없음 (API가 동일하게 작동)

### 기술 스택 변경

| 항목 | 이전 | 현재 |
|-----|-----|-----|
| ORM | Prisma Client Python | SQLAlchemy 2.0 |
| 비동기 드라이버 | Prisma Engine | asyncpg |
| 데이터베이스 | Supabase PostgreSQL | Supabase PostgreSQL (동일) |
| 테이블 관리 | Prisma Migrate | SQLAlchemy create_all() |
| GUI 도구 | Prisma Studio | Prisma Studio (유지) |

### 호환성 설정

**Supabase Pooler (pgbouncer) 호환:**
```python
# database.py
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"statement_cache_size": 0}  # 필수!
)
```

### 마이그레이션 검증

✅ 초대코드 검증 API 테스트 통과
✅ 회원가입 플로우 동일하게 작동
✅ Enrollment 기능 정상 작동
✅ 모든 Relation (User ↔ Enrollment) 정상

---

## 데이터베이스 스키마

### Invitation (초대코드)
```python
class Invitation(Base):
    __tablename__ = "Invitation"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
```

**특징:**
- 다회용 초대코드 (여러 명 사용 가능)
- `is_active`로 활성화/비활성화 관리

### RegisterSession (회원가입 세션)
```python
class RegisterSession(Base):
    __tablename__ = "RegisterSession"

    sessionId = Column(String, primary_key=True)
    invitationId = Column(Integer, nullable=False)
    name = Column(String, nullable=True)
    password = Column(String, nullable=True)
    birthday = Column(String, nullable=True)
    phone = Column(String, nullable=True)
```

**특징:**
- 다단계 회원가입 진행 상태 저장
- sessionId로 각 단계 연결

### User (회원)
```python
class User(Base):
    __tablename__ = "User"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    birthday = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    invitationId = Column(Integer, nullable=False)

    enrollments = relationship("Enrollment", back_populates="user")
```

**특징:**
- 최종 회원 정보
- Enrollment와 1:N 관계

### Enrollment (파티 참가)
```python
class Enrollment(Base):
    __tablename__ = "Enrollment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    userId = Column(Integer, ForeignKey("User.id"), nullable=False)
    partyId = Column(Integer, nullable=False)
    enrolled = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="enrollments")
```

**특징:**
- User와 N:1 관계
- 한 유저는 같은 파티에 한 번만 참가 가능
- `userId`와 `partyId` 조합에 대한 unique 제약 조건

---

## API 엔드포인트

### 인증 (Authentication)

#### 1. 초대코드 검증
```http
POST /auth/invitation/verify
Content-Type: application/json

{
  "invitation_code": "TEST001"
}
```

**응답:**
```json
{
  "valid": true,
  "sessionId": "79d2e7d0d1694460a1d81822ac7033a9"
}
```

**에러:**
```json
{
  "valid": false,
  "message": "초대코드가 유효하지 않습니다."
}
```
또는
```json
{
  "valid": false,
  "message": "비활성화된 초대코드입니다."
}
```

#### 2. 이름 저장
```http
PUT /auth/register/name
Content-Type: application/json

{
  "session_id": "79d2e7d0d1694460a1d81822ac7033a9",
  "name": "홍길동"
}
```

#### 3. 생년월일 저장
```http
PUT /auth/register/birthday
Content-Type: application/json

{
  "session_id": "79d2e7d0d1694460a1d81822ac7033a9",
  "birthday": "990101"
}
```

**검증 규칙:**
- 6자리 숫자 (예: 990101)

#### 4. 휴대폰 번호 저장
```http
PUT /auth/register/phone
Content-Type: application/json

{
  "session_id": "79d2e7d0d1694460a1d81822ac7033a9",
  "phone": "01012345678"
}
```

**검증 규칙:**
- 010으로 시작하는 11자리 숫자

#### 5. 비밀번호 저장 및 회원가입 완료
```http
PUT /auth/register/password
Content-Type: application/json

{
  "session_id": "79d2e7d0d1694460a1d81822ac7033a9",
  "password": "password123"
}
```

**응답:**
```json
{
  "ok": true,
  "userId": 7
}
```

### Enrollment (파티 참가)

#### 6. 파티 참가
```http
POST /enroll
Content-Type: application/json

{
  "user_id": 7,
  "party_id": 1
}
```

**응답:**
```json
{
  "ok": true,
  "message": "파티 참가가 완료되었습니다.",
  "enrollment_id": 1
}
```

#### 7. 참가 상태 확인
```http
GET /enrollment/check/{user_id}/{party_id}
```

**응답:**
```json
{
  "enrolled": true
}
```

#### 8. 모든 Enrollment 조회 (관리자용)
```http
GET /enrollments
```

**응답:**
```json
{
  "enrollments": [
    {
      "id": 1,
      "partyId": 1,
      "enrolled": true,
      "createdAt": "2025-12-03T12:00:00",
      "user": {
        "id": 7,
        "name": "홍길동",
        "birthday": "990101",
        "phone": "01012345678"
      }
    }
  ],
  "total": 1
}
```

#### 9. 특정 파티의 Enrollment 조회 (관리자용)
```http
GET /enrollments/party/{party_id}
```

**응답:**
```json
{
  "partyId": 1,
  "enrollments": [
    {
      "id": 1,
      "partyId": 1,
      "enrolled": true,
      "createdAt": "2025-12-03T12:00:00",
      "user": {
        "id": 7,
        "name": "홍길동",
        "birthday": "990101",
        "phone": "01012345678"
      }
    }
  ],
  "total": 1
}
```

---

## 주요 기능

### 1. 다회용 초대코드 시스템

**특징:**
- 한 초대코드로 여러 명 가입 가능
- 관리자가 `is_active`로 활성화/비활성화
- 비활성화 시 "비활성화된 초대코드입니다" 메시지 표시

**초대코드 추가 방법:**
```python
# seed_data.py 스크립트 사용
import asyncio
from database import AsyncSessionLocal
from models import Invitation
from sqlalchemy import select

async def add_invitation_code(code: str):
    async with AsyncSessionLocal() as session:
        # 중복 확인
        result = await session.execute(
            select(Invitation).where(Invitation.code == code)
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"{code} 코드가 이미 존재합니다!")
        else:
            invitation = Invitation(code=code, is_active=True)
            session.add(invitation)
            await session.commit()
            print(f"{code} 초대코드 추가 완료!")

if __name__ == "__main__":
    asyncio.run(add_invitation_code("VIP2024"))
```

또는 **Prisma Studio**에서 GUI로 추가 (선택사항)
```bash
npx prisma studio
```

### 2. 입력 검증

**생년월일:**
- 6자리 숫자만 허용 (예: 990101)
- 숫자 외 문자 자동 필터링
- 에러 메시지: "6자리 숫자를 입력해주세요 (예: 990101)."

**휴대폰 번호:**
- 010으로 시작하는 11자리 숫자
- 숫자 외 문자 자동 필터링
- 에러 메시지: "010으로 시작하는 11자리 숫자를 입력해주세요."

### 3. Enrollment 시스템

**작동 방식:**
1. 회원가입 완료 시 `userId` 저장
2. Payment 페이지에서 "완료" 클릭
3. `POST /enroll` API 호출로 DB에 저장
4. EventDetail 페이지 로드 시 서버에서 enrollment 상태 확인
5. enrolled 상태면 위치 정보 표시, 아니면 "Enroll" 버튼 표시

**Source of Truth:**
- ~~localStorage~~ ❌ (제거됨)
- 데이터베이스 ✅ (서버에서만 확인)

---

## 실행 방법

### 개발 환경

**터미널 1 - 백엔드 서버:**
```bash
cd myapp-backend
source venv/bin/activate
uvicorn main:app --reload
```
→ http://localhost:8000

**터미널 2 - 프론트엔드 서버:**
```bash
cd myapp-frontend
npm run dev
```
→ http://localhost:5173

**터미널 3 - Prisma Studio (선택, 데이터베이스 관리용):**
```bash
cd myapp-backend
npx prisma studio
```
→ http://localhost:5555

### 환경 변수

**백엔드 (.env):**
```env
# Supabase Pooler 연결 (SQLAlchemy + asyncpg)
DATABASE_URL="postgresql://postgres.vawhihblhegdinrsgjer:James%400531@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
```

**중요:**
- SQLAlchemy는 `postgresql://`를 자동으로 `postgresql+asyncpg://`로 변환합니다
- Supabase의 pgbouncer pooler를 사용하므로 `statement_cache_size=0` 설정이 필요합니다 (database.py에 설정됨)

**프론트엔드 (.env):**
```env
VITE_API_URL=http://localhost:8000
```

---

## 관리자 도구

### 1. FastAPI Swagger UI

**URL:** http://localhost:8000/docs

**기능:**
- 모든 API 엔드포인트 확인
- 브라우저에서 직접 API 테스트
- Request/Response 스키마 확인
- Try it out 기능으로 즉시 테스트

### 2. Prisma Studio (선택사항)

**실행:**
```bash
cd myapp-backend
npx prisma studio
```

**URL:** http://localhost:5555

**기능:**
- 데이터베이스 테이블 직접 확인/수정 (GUI)
- 초대코드 추가/삭제/활성화/비활성화
- User, Enrollment 등 모든 데이터 확인
- Relation (user ↔ enrollments) 바로 확인

**사용 팁:**
- Enrollment 테이블에서 `user` 필드 클릭하면 유저 정보 바로 표시
- User 테이블에서 `enrollments` 필드 클릭하면 참가한 파티 목록 표시

**참고:** SQLAlchemy로 마이그레이션했지만 Prisma Studio는 여전히 데이터베이스 관리 도구로 사용 가능합니다

### 3. 초대코드 관리 (SQLAlchemy)

**현재 유효한 코드 확인:**
```python
# check_invitations.py
import asyncio
from database import AsyncSessionLocal
from models import Invitation
from sqlalchemy import select

async def check_invitations():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Invitation))
        invitations = result.scalars().all()

        for inv in invitations:
            status = "✅ 활성" if inv.is_active else "❌ 비활성"
            print(f"코드: {inv.code} | 상태: {status}")

if __name__ == "__main__":
    asyncio.run(check_invitations())
```

실행:
```bash
cd myapp-backend
source venv/bin/activate
python check_invitations.py
```

**새 초대코드 추가:**
```python
# 위의 seed_data.py 스크립트 사용
python seed_data.py
```

**데이터베이스 테이블 생성:**
```python
# create_tables.py (새 데이터베이스 설정 시)
python create_tables.py
```

---

## 배포 옵션

### 옵션 1: 분리 배포 (권장)

**프론트엔드:**
- Vercel, Netlify, Cloudflare Pages
- 환경 변수 설정: `VITE_API_URL=https://api.yourdomain.com`

**백엔드:**
- Railway, Render, Fly.io, AWS EC2
- 환경 변수 설정: `DATABASE_URL=...`

### 옵션 2: 통합 배포

**Docker 컨테이너화:**
```dockerfile
# Dockerfile 예시
FROM python:3.12

# 프론트엔드 빌드
COPY myapp-frontend /app/frontend
RUN cd /app/frontend && npm install && npm run build

# 백엔드 설정
COPY myapp-backend /app/backend
WORKDIR /app/backend
RUN pip install -r requirements.txt

# 백엔드에서 정적 파일 서빙
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 옵션 3: Nginx 리버스 프록시

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 프론트엔드
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 백엔드 API
    location /auth {
        proxy_pass http://localhost:8000;
    }

    location /enroll {
        proxy_pass http://localhost:8000;
    }
}
```

---

## 문제 해결

### CORS 오류

**문제:**
```
Access to fetch at 'http://localhost:8000/...' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**해결:**
`myapp-backend/main.py`에 CORS 미들웨어가 있는지 확인:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### SQLAlchemy 연결 오류

**문제: "relation does not exist" 오류**
```
asyncpg.exceptions.UndefinedTableError: relation "Invitation" does not exist
```

**해결:**
```bash
# 테이블이 생성되지 않은 경우
cd myapp-backend
source venv/bin/activate
python create_tables.py
```

### Supabase Pooler 연결 오류

**문제: "prepared statement already exists" 오류**

**해결:**
`database.py`에 다음 설정이 있는지 확인:
```python
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"statement_cache_size": 0}  # pgbouncer용 필수 설정
)
```

### Prisma Studio에 테이블 안 보임

**해결:**
1. Prisma Studio 종료: `Ctrl+C` 또는 `pkill -f "prisma studio"`
2. 다시 시작: `npx prisma studio`
3. 브라우저 새로고침

**참고:** SQLAlchemy로 마이그레이션했지만 Prisma Studio는 여전히 데이터베이스 GUI 도구로 사용 가능합니다

---

## 체크리스트

### 백엔드
- [x] CORS 미들웨어 추가
- [x] 모든 API 엔드포인트 구현
- [x] 데이터베이스 연결 확인
- [x] SQLAlchemy 모델 작성 (Prisma에서 마이그레이션)
- [x] Enrollment 모델 및 Relation 추가
- [x] 환경 변수 설정 (.env)
- [x] Supabase Pooler 호환성 설정 (statement_cache_size=0)

### 프론트엔드
- [x] API 클라이언트 구현
- [x] Context에 회원가입 상태 추가
- [x] 모든 페이지 API 연동
- [x] 에러 처리 구현
- [x] 입력 검증 (휴대폰, 생년월일)
- [x] 로딩 상태 UI
- [x] 환경 변수 설정 (.env)
- [x] localStorage 제거, 서버 상태로 전환

### 데이터베이스
- [x] Invitation 테이블 (다회용 코드)
- [x] RegisterSession 테이블
- [x] User 테이블
- [x] Enrollment 테이블
- [x] User ↔ Enrollment Relation

### 테스트
- [x] 초대코드 검증 플로우
- [x] 회원가입 전체 플로우
- [x] 파티 참가 플로우
- [x] 에러 케이스 처리
- [x] 입력 검증 테스트

---

## 다음 단계

### 단기
1. ~~입력 검증 추가~~ ✅ 완료
2. ~~Enrollment 기능 구현~~ ✅ 완료
3. ~~다회용 초대코드~~ ✅ 완료

### 중기
1. **인증/인가**: JWT 토큰 기반 인증 추가
2. **로그인 기능**: 기존 회원 로그인
3. **프로필 페이지**: 회원 정보 수정

### 장기
1. **결제 시스템**: 실제 결제 연동
2. **관리자 대시보드**: 회원 관리, 초대코드 관리
3. **알림 시스템**: 이메일/SMS 알림
4. **에러 로깅**: Sentry 통합
5. **성능 최적화**: API 응답 캐싱
6. **배포 자동화**: CI/CD 파이프라인

---

## 참고 자료

**FastAPI:**
- 공식 문서: https://fastapi.tiangolo.com
- Swagger UI: http://localhost:8000/docs

**SQLAlchemy:**
- 공식 문서: https://docs.sqlalchemy.org
- Async 가이드: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- asyncpg: https://magicstack.github.io/asyncpg/

**Prisma (데이터베이스 GUI 도구로만 사용):**
- Prisma Studio: https://www.prisma.io/docs/orm/tools/prisma-studio

**React:**
- 공식 문서: https://react.dev
- Vite: https://vitejs.dev

**Supabase:**
- Connection Pooling: https://supabase.com/docs/guides/database/connection-pooling
