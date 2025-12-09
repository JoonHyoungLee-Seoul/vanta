# Vanta Party Management System

## 프로젝트 개요

Say's Halloween Party를 위한 파티 관리 시스템입니다. 초대코드 기반 회원가입, 파티 참가 신청, 관리자 승인, 쿠폰 관리 기능을 제공합니다.

### 주요 기능

- **초대코드 기반 회원가입**: 5단계 회원가입 프로세스 (초대코드 → 이름 → 생년월일 → 전화번호 → 아이디 → 비밀번호)
- **파티 참가 신청**: 사용자가 파티에 참가 신청 (승인 대기 상태)
- **관리자 승인 시스템**: 관리자가 참가 신청을 승인/거절
- **쿠폰 관리**: 승인된 사용자에게 쿠폰 발급 및 사용 처리
- **JWT 인증**: Bearer 토큰 기반 인증 시스템
- **프로필 관리**: 사용자 정보 및 참가 내역 조회

---

## 기술 스택

### Backend
- **FastAPI** (Python 3.x) - 비동기 웹 프레임워크
- **SQLAlchemy** (2.0) - ORM 및 비동기 데이터베이스 접근
- **asyncpg** - PostgreSQL 비동기 드라이버
- **Prisma** - 데이터베이스 스키마 관리 및 마이그레이션 (Node.js CLI)
- **PostgreSQL** (Supabase) - 데이터베이스
- **bcrypt** - 비밀번호 해싱
- **PyJWT** - JWT 토큰 생성 및 검증
- **Uvicorn** - ASGI 서버
- **Gunicorn** - 프로덕션 WSGI 서버

### Frontend
- **React** 19.2.0
- **React Router** 7.9.6 - 클라이언트 사이드 라우팅
- **Vite** 7.2.4 - 빌드 도구
- **ES Modules** - JavaScript 모듈 시스템

### Mobile (iOS)
- **Capacitor** - 하이브리드 모바일 앱 프레임워크
- **iOS Native** - 네이티브 iOS 앱으로 빌드 가능

### Database
- **PostgreSQL** (Supabase hosted)
- Direct Connection (port 5432) - pgBouncer 우회

---

## 프로젝트 구조

```
vanta/
├── myapp-backend/           # FastAPI 백엔드
│   ├── main.py             # FastAPI 애플리케이션 및 API 엔드포인트
│   ├── config.py           # 환경 변수 설정
│   ├── database.py         # SQLAlchemy 데이터베이스 설정
│   ├── models.py           # SQLAlchemy 모델 정의
│   ├── auth.py             # JWT 인증 로직
│   ├── requirements.txt    # Python 패키지 의존성
│   ├── .env               # 환경 변수 (git에 포함되지 않음)
│   ├── prisma/
│   │   └── schema.prisma  # Prisma 스키마 정의
│   └── venv/              # Python 가상 환경
│
├── myapp-frontend/          # React 프론트엔드
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js   # API 클라이언트
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── context/        # React Context (Enrollment)
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── App.jsx        # 메인 앱 및 라우팅
│   │   └── main.jsx       # React 진입점
│   ├── ios/                # iOS 네이티브 프로젝트
│   ├── package.json
│   ├── vite.config.js
│   └── capacitor.config.ts # Capacitor 설정
│
└── README.md               # 이 문서
```

---

## 데이터베이스 스키마

### 1. Invitation (초대 코드)
```prisma
model Invitation {
  id        Int      @id @default(autoincrement())
  code      String   @unique              # 초대 코드
  is_active Boolean  @default(true)        # 활성화 상태
}
```

### 2. RegisterSession (회원가입 세션)
```prisma
model RegisterSession {
  sessionId     String   @id              # UUID 세션 ID
  invitationId  Int                       # 사용된 초대 코드 ID
  name          String?                   # 이름
  password      String?                   # 비밀번호 (해시)
  birthday      String?                   # 생년월일
  phone         String?                   # 전화번호
  userId        String?                   # 사용자 ID
}
```
> **Note**: 회원가입 세션은 현재 삭제되지 않습니다. 프로덕션에서는 만료 시간 및 정리 작업 고려 필요.

### 3. User (사용자)
```prisma
model User {
  id            Int          @id @default(autoincrement())
  userId        String       @unique          # 로그인 ID
  name          String                        # 이름
  password      String                        # 비밀번호 해시
  birthday      String                        # 생년월일
  phone         String                        # 전화번호
  invitationId  Int                           # 사용한 초대 코드 ID
  enrollments   Enrollment[]                  # 참가 내역
}
```

### 4. Enrollment (파티 참가)
```prisma
model Enrollment {
  id         Int      @id @default(autoincrement())
  userId     Int                               # User FK
  partyId    Int                               # 파티 ID (하드코딩)
  enrolled   Boolean  @default(true)            # 참가 여부
  status     String   @default("pending")       # pending/approved/rejected
  couponUsed Boolean  @default(false)           # 쿠폰 사용 여부
  createdAt  DateTime @default(now())           # 생성 시간
  user       User     @relation(fields: [userId], references: [id])

  @@unique([userId, partyId])
}
```

### 관계도
```
Invitation ─── RegisterSession ─── User ─── Enrollment
    1              1..N              1       1..N
```

---

## API 엔드포인트

### 인증 관련
| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| POST | `/auth/invitation/verify` | 초대코드 검증 및 세션 생성 | ❌ |
| PUT | `/auth/register/name` | 이름 저장 | ❌ |
| PUT | `/auth/register/birthday` | 생년월일 저장 | ❌ |
| PUT | `/auth/register/phone` | 전화번호 저장 (중복 체크) | ❌ |
| PUT | `/auth/register/userid` | 사용자 ID 저장 (중복 체크) | ❌ |
| PUT | `/auth/register/password` | 비밀번호 저장 및 User 생성 (자동 로그인) | ❌ |
| POST | `/auth/login` | 로그인 (JWT 발급) | ❌ |

### 파티 참가
| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| POST | `/enroll` | 파티 참가 신청 | ✅ |
| GET | `/enrollment/check/{user_id}/{party_id}` | 참가 상태 확인 | ❌ |

### 쿠폰
| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| GET | `/coupon/{user_id}/{party_id}` | 쿠폰 조회 | ✅ |
| PUT | `/coupon/use` | 쿠폰 사용 | ✅ |

### 사용자 프로필
| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| GET | `/profile/{user_id}` | 프로필 및 참가 내역 조회 | ✅ |

### 관리자
| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| GET | `/admin/enrollments/pending` | 승인 대기 목록 | ✅ Admin |
| POST | `/admin/enrollments/approve` | 참가 승인 | ✅ Admin |
| POST | `/admin/enrollments/reject` | 참가 거절 | ✅ Admin |
| GET | `/enrollments` | 전체 참가 내역 | ✅ Admin |
| GET | `/enrollments/party/{party_id}` | 특정 파티 참가 내역 | ✅ Admin |

### 기타
| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| GET | `/health` | 헬스 체크 | ❌ |
| GET | `/payment/info` | 결제 정보 조회 | ❌ |

---

## 프론트엔드 라우팅

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | Splash | 스플래시 화면 |
| `/invite` | InviteCode | 초대코드 입력 |
| `/login` | Login | 로그인 |
| `/register/name` | NameInput | 이름 입력 |
| `/register/birthday` | BirthdayInput | 생년월일 입력 |
| `/register/phone` | PhoneInput | 전화번호 입력 |
| `/register/userid` | UserIdInput | 아이디 입력 |
| `/register/password` | PasswordInput | 비밀번호 입력 |
| `/parties` | PartyList | 파티 목록 |
| `/party/:id` | EventDetail | 파티 상세 |
| `/payment/:id` | Payment | 결제 정보 |
| `/enrolled` | Enrolled | 참가 신청 완료 |
| `/coupon` | Coupon | 쿠폰 페이지 |
| `/profile` | Profile | 프로필 |
| `/admin` | Admin | 관리자 페이지 (승인 관리) |

---

## 로컬 개발 환경 설정

### 필수 요구사항
- **Python** 3.8 이상
- **Node.js** 18 이상 (Prisma CLI용)
- **npm** 또는 **yarn**
- **PostgreSQL** (Supabase 사용 중)

### 1. 백엔드 설정

#### 1.1 가상 환경 생성 및 활성화
```bash
cd myapp-backend
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

#### 1.2 Python 패키지 설치
```bash
pip install -r requirements.txt
```

#### 1.3 Prisma CLI 설치 (Node.js)
```bash
npm install
```

#### 1.4 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 작성:

```bash
# Database Connection (Direct Connection)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.vawhihblhegdinrsgjer.supabase.co:5432/postgres"

# Application Configuration
ENVIRONMENT=development
SECRET_KEY=default-secret-key-change-in-production
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Payment Information
BANK_NAME=우리은행
BANK_ACCOUNT_NUMBER=1002-83863-3924
BANK_ACCOUNT_HOLDER=받는분
PAYMENT_AMOUNT=25000

# Admin Configuration (comma-separated user IDs)
ADMIN_USER_IDS=8
```

> **중요**: `DATABASE_URL`의 비밀번호를 실제 Supabase 비밀번호로 변경하세요.

#### 1.5 Prisma Client 생성
```bash
npx prisma generate
```

#### 1.6 데이터베이스 마이그레이션 적용
```bash
npx prisma migrate deploy
```

#### 1.7 개발 서버 실행
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

백엔드 서버가 http://localhost:8000 에서 실행됩니다.

### 2. 프론트엔드 설정

#### 2.1 의존성 설치
```bash
cd myapp-frontend
npm install
```

#### 2.2 환경 변수 설정 (선택사항)
`.env` 파일 생성 (기본값: http://localhost:8000):
```bash
VITE_API_URL=http://localhost:8000
```

#### 2.3 개발 서버 실행
```bash
npm run dev
```

프론트엔드 서버가 http://localhost:5173 에서 실행됩니다.

---

## 데이터베이스 관리

### Prisma Studio로 데이터 확인
```bash
cd myapp-backend
npx prisma studio
```
브라우저에서 http://localhost:5555 열림

### 새 마이그레이션 생성
```bash
cd myapp-backend
npx prisma migrate dev --name <migration_name>
```

### 스키마 변경 후 작업 순서
1. `prisma/schema.prisma` 파일 수정
2. `npx prisma migrate dev --name <name>` - 마이그레이션 생성 및 적용
3. `npx prisma generate` - Python 클라이언트 재생성 (자동으로 실행됨)

---

## 인증 시스템

### JWT 토큰 흐름
1. 사용자가 회원가입 완료 또는 로그인
2. 서버가 JWT 토큰 발급 (유효기간: 24시간)
3. 프론트엔드가 `localStorage`에 토큰 저장
4. 이후 모든 인증 요청 시 `Authorization: Bearer <token>` 헤더 포함
5. 401 응답 시 자동으로 로그인 페이지로 리다이렉트

### 관리자 권한
- 환경 변수 `ADMIN_USER_IDS`에 쉼표로 구분된 User ID 목록 설정
- 예: `ADMIN_USER_IDS=8,12,15`
- 관리자만 `/admin/*` 엔드포인트 접근 가능

---

## 주요 비즈니스 로직

### 회원가입 프로세스
1. **초대코드 검증** (`/auth/invitation/verify`)
   - 초대코드 유효성 확인
   - `RegisterSession` 생성 및 `sessionId` 반환

2. **이름 저장** (`/auth/register/name`)
   - `sessionId`로 세션 조회 후 이름 저장

3. **생년월일 저장** (`/auth/register/birthday`)
   - `sessionId`로 세션 조회 후 생년월일 저장

4. **전화번호 저장** (`/auth/register/phone`)
   - 중복 체크 (이미 등록된 전화번호인지 확인)
   - `sessionId`로 세션 조회 후 전화번호 저장

5. **사용자 ID 저장** (`/auth/register/userid`)
   - 중복 체크 (이미 사용 중인 ID인지 확인)
   - `sessionId`로 세션 조회 후 userId 저장

6. **비밀번호 저장 및 최종 User 생성** (`/auth/register/password`)
   - bcrypt로 비밀번호 해싱
   - `User` 레코드 생성
   - JWT 토큰 발급 (자동 로그인)

### 파티 참가 승인 프로세스
1. 사용자가 파티 참가 신청 (`/enroll`)
   - `Enrollment` 생성 (`status: "pending"`)

2. 관리자가 승인 대기 목록 확인 (`/admin/enrollments/pending`)

3. 관리자가 승인 또는 거절
   - 승인: `/admin/enrollments/approve` → `status: "approved"`
   - 거절: `/admin/enrollments/reject` → `status: "rejected"`

4. 승인된 사용자만 쿠폰 사용 가능

---

## 중요 참고 사항

### 데이터베이스 연결
- **현재 설정**: Supabase Direct Connection (port 5432)
- **이유**: pgBouncer (Transaction/Session Pooler)는 asyncpg와 호환성 문제
- **연결 풀링**: SQLAlchemy의 connection pooling 사용
  - `pool_size=5`
  - `max_overflow=10`
  - `pool_pre_ping=True`
  - `pool_recycle=3600` (1시간)

### 보안
- 비밀번호는 bcrypt로 해싱 후 저장
- JWT 토큰에는 `user_id`만 포함 (민감 정보 제외)
- `.env` 파일은 `.gitignore`에 포함되어 Git에 커밋되지 않음
- CORS는 `ALLOWED_ORIGINS`로 제한

### Party ID
- 현재 Party 테이블 없음
- `partyId`는 정수값으로 하드코딩
- Party ID 1 = "Say's Halloween Party"
- 필요시 Party 테이블 추가 고려

### RegisterSession 정리
- 현재 회원가입 세션은 삭제되지 않음
- 프로덕션 환경에서는 다음 고려 필요:
  - 만료 시간 필드 추가
  - 주기적 정리 작업
  - 회원가입 완료 시 세션 삭제

---

## 트러블슈팅

### 데이터베이스 연결 오류
```
asyncpg.exceptions.ConnectionDoesNotExistError
```
**해결 방법**: Direct Connection 사용, pgBouncer URL 사용 금지

### Prisma Client 오류
```
prisma.errors.PrismaClientInitializationError
```
**해결 방법**:
```bash
npx prisma generate
```

### 포트 충돌
**백엔드 (8000)**:
```bash
lsof -ti:8000 | xargs kill -9
```

**프론트엔드 (5173)**:
```bash
lsof -ti:5173 | xargs kill -9
```

### CORS 오류
- `.env`의 `ALLOWED_ORIGINS`에 프론트엔드 URL 추가
- 백엔드 서버 재시작

---

## iOS 앱 빌드

iOS 앱으로 빌드하는 방법은 [IOS_BUILD_GUIDE.md](./IOS_BUILD_GUIDE.md)를 참조하세요.

### 빠른 시작

```bash
cd myapp-frontend
npm run build
npx cap sync ios
npx cap open ios
```

Xcode에서 빌드 및 실행할 수 있습니다.

## 다음 단계

배포를 위한 자세한 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

---

## 라이선스

Private project - All rights reserved.
