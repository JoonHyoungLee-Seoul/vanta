# 유저 관리 가이드 (User Management Guide)

개발자를 위한 VANTA 플랫폼 유저 관리 종합 가이드

## 목차
1. [유저 라이프사이클](#유저-라이프사이클)
2. [데이터베이스 구조](#데이터베이스-구조)
3. [초대코드 관리](#초대코드-관리)
4. [회원가입 프로세스](#회원가입-프로세스)
5. [파티 참가 관리](#파티-참가-관리)
6. [관리자 기능](#관리자-기능)
7. [API 엔드포인트](#api-엔드포인트)
8. [데이터베이스 접근 방법](#데이터베이스-접근-방법)
9. [일반적인 작업](#일반적인-작업)
10. [문제 해결](#문제-해결)

---

## 유저 라이프사이클

```
1. 초대 → 2. 회원가입 → 3. 로그인 → 4. 파티 참가 신청 → 5. 관리자 승인 → 6. 쿠폰 사용
```

### 1단계: 초대 (Invitation)
- 관리자가 초대코드 생성
- 유저는 초대코드로 회원가입 가능

### 2단계: 회원가입 (Registration)
- 5단계 다중 스텝 회원가입
- 세션 기반 임시 데이터 저장
- 최종 단계에서 User 생성 및 JWT 발급

### 3단계: 로그인 (Login)
- userId와 password로 인증
- JWT 토큰 발급

### 4단계: 파티 참가 신청 (Enrollment)
- 유저가 파티에 참가 신청
- 초기 상태: `pending`
- 결제 완료 후 승인 대기

### 5단계: 관리자 승인 (Approval)
- 관리자가 enrollment 승인/거절
- 승인 시 상태: `approved`
- 승인 시 쿠폰 자동 발급

### 6단계: 쿠폰 사용 (Coupon Usage)
- 승인된 유저만 쿠폰 사용 가능
- 쿠폰은 1회만 사용 가능

---

## 데이터베이스 구조

### Invitation (초대코드)
```prisma
model Invitation {
  id        Int      @id @default(autoincrement())
  code      String   @unique
  is_active Boolean  @default(true)
}
```

**필드 설명:**
- `id`: 초대코드 고유 ID
- `code`: 초대코드 문자열 (예: "PARTY2024")
- `is_active`: 초대코드 활성화 여부

### RegisterSession (회원가입 세션)
```prisma
model RegisterSession {
  sessionId     String   @id
  invitationId  Int
  name          String?
  password      String?
  birthday      String?
  phone         String?
  userId        String?
}
```

**필드 설명:**
- `sessionId`: UUID 형식의 세션 ID
- `invitationId`: 사용된 초대코드 ID
- `name`, `password`, `birthday`, `phone`, `userId`: 단계별 저장되는 정보

**⚠️ 주의:** RegisterSession은 회원가입 완료 후에도 삭제되지 않음 (추후 정리 필요)

### User (유저)
```prisma
model User {
  id            Int          @id @default(autoincrement())
  userId        String       @unique
  name          String
  password      String
  birthday      String
  phone         String
  invitationId  Int
  enrollments   Enrollment[]
}
```

**필드 설명:**
- `id`: 유저 고유 ID (Primary Key)
- `userId`: 유저가 선택한 로그인 ID (Unique)
- `name`: 이름
- `password`: bcrypt 해시된 비밀번호
- `birthday`: 생년월일 (YYMMDD 형식)
- `phone`: 휴대폰 번호 (01012345678 형식)
- `invitationId`: 사용한 초대코드 ID
- `enrollments`: 참가한 파티 목록

### Enrollment (파티 참가)
```prisma
model Enrollment {
  id         Int      @id @default(autoincrement())
  userId     Int
  partyId    Int
  enrolled   Boolean  @default(true)
  status     String   @default("pending")
  couponUsed Boolean  @default(false)
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])

  @@unique([userId, partyId])
}
```

**필드 설명:**
- `id`: Enrollment 고유 ID
- `userId`: User 테이블의 ID (FK)
- `partyId`: 파티 ID (현재 1 = After-Christmas Party)
- `enrolled`: 참가 여부 (deprecated, 항상 true)
- `status`: 승인 상태
  - `"pending"`: 승인 대기
  - `"approved"`: 승인됨
  - `"rejected"`: 거절됨
- `couponUsed`: 쿠폰 사용 여부
- `createdAt`: 참가 신청 일시

---

## 초대코드 관리

### 초대코드 생성

**방법 1: Prisma Studio 사용**
```bash
npx prisma studio
```
- Invitation 테이블 열기
- Add record 클릭
- code: 원하는 초대코드 입력
- is_active: true 체크
- Save

**방법 2: 직접 SQL 실행**
```sql
INSERT INTO "Invitation" (code, is_active) VALUES ('CHRISTMAS2024', true);
```

### 초대코드 비활성화
```sql
UPDATE "Invitation" SET is_active = false WHERE code = 'OLDCODE';
```

### 초대코드 사용 현황 확인
```bash
npx prisma studio
```
- Invitation 테이블에서 각 코드의 is_active 상태 확인

---

## 회원가입 프로세스

### 5단계 회원가입 플로우

```
POST /auth/invitation/verify
  → sessionId 발급

PUT /auth/register/name
  → 이름 저장

PUT /auth/register/birthday
  → 생년월일 저장

PUT /auth/register/phone
  → 휴대폰 저장

PUT /auth/register/userid
  → 유저 ID 저장

PUT /auth/register/password
  → 비밀번호 저장 + User 생성 + JWT 발급
```

### RegisterSession 수동 정리
```sql
-- 30일 이상 된 세션 삭제 (createdAt 컬럼 추가 필요)
DELETE FROM "RegisterSession" WHERE "createdAt" < NOW() - INTERVAL '30 days';
```

---

## 파티 참가 관리

### 파티 참가 신청 프로세스

1. **유저가 파티 신청**
   - Endpoint: `POST /enroll`
   - 초기 상태: `status = "pending"`

2. **관리자가 승인**
   - Endpoint: `POST /admin/enrollments/approve`
   - 상태 변경: `status = "approved"`

3. **유저가 쿠폰 확인**
   - Endpoint: `GET /coupon/{user_id}/{party_id}`
   - 승인된 경우에만 쿠폰 표시

### 참가 상태별 처리

| Status | 의미 | 유저 화면 | 쿠폰 사용 가능 |
|--------|------|----------|--------------|
| `pending` | 승인 대기 | "승인 대기중" 배지 | ❌ |
| `approved` | 승인 완료 | 쿠폰 표시 | ✅ |
| `rejected` | 거절됨 | "거절됨" 배지 | ❌ |

---

## 관리자 기능

### 관리자 계정
- **조건**: User 테이블의 `id = 1`인 계정만 관리자
- **접근**: Profile 페이지에 "Admin Dashboard" 버튼 표시

### 승인 대기 목록 조회
```
GET /admin/enrollments/pending
```
- 모든 `status = "pending"` enrollment 반환
- User 정보 포함 (이름, ID, 전화번호)

### Enrollment 승인
```
POST /admin/enrollments/approve
Body: { "enrollment_id": 123 }
```
- 상태를 `"approved"`로 변경
- 쿠폰 사용 가능하게 됨

### Enrollment 거절
```
POST /admin/enrollments/reject
Body: { "enrollment_id": 123 }
```
- 상태를 `"rejected"`로 변경

---

## API 엔드포인트

### 인증 (Authentication)

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| POST | `/auth/invitation/verify` | 초대코드 검증 | ❌ |
| POST | `/auth/login` | 로그인 | ❌ |
| PUT | `/auth/register/name` | 이름 등록 | ❌ |
| PUT | `/auth/register/birthday` | 생년월일 등록 | ❌ |
| PUT | `/auth/register/phone` | 휴대폰 등록 | ❌ |
| PUT | `/auth/register/userid` | 유저 ID 등록 | ❌ |
| PUT | `/auth/register/password` | 비밀번호 등록 + 회원가입 완료 | ❌ |

### 파티 & Enrollment

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/party/{party_id}/info` | 파티 정보 (정원, 남은 자리) | ❌ |
| POST | `/enroll` | 파티 참가 신청 | ✅ |
| GET | `/enrollment/check/{user_id}/{party_id}` | 참가 여부 확인 | ❌ |

### 쿠폰

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/coupon/{user_id}/{party_id}` | 쿠폰 조회 | ✅ |
| PUT | `/coupon/use` | 쿠폰 사용 | ✅ |

### 관리자 (Admin)

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/admin/enrollments/pending` | 승인 대기 목록 | ✅ Admin |
| POST | `/admin/enrollments/approve` | Enrollment 승인 | ✅ Admin |
| POST | `/admin/enrollments/reject` | Enrollment 거절 | ✅ Admin |

### 프로필

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/profile/{user_id}` | 유저 프로필 조회 | ✅ |

---

## 데이터베이스 접근 방법

### 1. Prisma Studio (추천)
```bash
cd /Users/ijunhyeong/Desktop/vanta/myapp-backend
npx prisma studio
```
- 브라우저에서 `http://localhost:5555` 열림
- GUI로 모든 테이블 확인 및 수정 가능

### 2. Neon Console (프로덕션 DB)
1. https://neon.tech 접속
2. 프로젝트 선택
3. SQL Editor 사용

### 3. psql (터미널)
```bash
# .env 파일에서 DATABASE_URL 복사
psql "postgresql://username:password@host/database?sslmode=require"

# 유저 목록 조회
SELECT * FROM "User";

# Enrollment 목록 조회
SELECT * FROM "Enrollment" ORDER BY "createdAt" DESC;
```

### 4. Backend API (프로그래밍 방식)
```python
from database import get_db
from models import User, Enrollment

async with get_db() as db:
    users = await db.execute(select(User))
    print(users.scalars().all())
```

---

## 일반적인 작업

### 1. 새 유저 확인
```bash
npx prisma studio
```
- User 테이블에서 최신 유저 확인
- `createdAt` 없으므로 `id` 기준 정렬

### 2. 특정 유저의 Enrollment 확인
```sql
SELECT * FROM "Enrollment" WHERE "userId" = 1;
```

### 3. 승인 대기 중인 유저 수 확인
```sql
SELECT COUNT(*) FROM "Enrollment" WHERE status = 'pending';
```

### 4. 파티별 참가자 수 확인
```sql
SELECT "partyId", COUNT(*) as count
FROM "Enrollment"
WHERE status = 'approved'
GROUP BY "partyId";
```

### 5. 쿠폰 사용 현황
```sql
SELECT
  COUNT(*) FILTER (WHERE "couponUsed" = true) as used,
  COUNT(*) FILTER (WHERE "couponUsed" = false) as unused
FROM "Enrollment"
WHERE status = 'approved';
```

### 6. 유저 삭제 (주의!)
```sql
-- Enrollment 먼저 삭제
DELETE FROM "Enrollment" WHERE "userId" = 123;

-- 그 다음 User 삭제
DELETE FROM "User" WHERE id = 123;
```

### 7. 초대코드별 가입자 수
```sql
SELECT i.code, COUNT(u.id) as user_count
FROM "Invitation" i
LEFT JOIN "User" u ON u."invitationId" = i.id
GROUP BY i.id, i.code;
```

---

## 문제 해결

### 문제 1: 유저가 로그인할 수 없음

**원인:**
- 잘못된 userId 또는 password
- User 테이블에 존재하지 않음

**해결:**
```bash
npx prisma studio
```
- User 테이블에서 userId 확인
- 필요 시 비밀번호 재설정 (bcrypt 해시 생성 필요)

### 문제 2: 관리자 페이지가 보이지 않음

**원인:**
- User `id = 1`이 아님

**해결:**
```sql
-- 현재 유저의 ID 확인
SELECT id, "userId", name FROM "User" WHERE "userId" = 'your_user_id';

-- 관리자로 변경하려면 id를 1로 변경 (주의!)
```

### 문제 3: Enrollment 승인했는데 쿠폰이 안 보임

**원인:**
- status가 "approved"가 아님
- API 오류

**확인:**
```sql
SELECT * FROM "Enrollment" WHERE "userId" = 1 AND "partyId" = 1;
```

**해결:**
```sql
UPDATE "Enrollment" SET status = 'approved' WHERE id = 123;
```

### 문제 4: 회원가입 중 에러 발생

**원인:**
- 중복된 userId
- 세션 만료
- 초대코드 비활성화

**해결:**
1. RegisterSession 확인
```sql
SELECT * FROM "RegisterSession" WHERE "sessionId" = 'your-session-id';
```

2. 필요 시 세션 삭제 후 재시작
```sql
DELETE FROM "RegisterSession" WHERE "sessionId" = 'your-session-id';
```

### 문제 5: 데이터베이스 연결 실패

**원인:**
- DATABASE_URL 오류
- Neon 데이터베이스 일시 중단

**해결:**
1. `.env` 파일 확인
```bash
cat .env | grep DATABASE_URL
```

2. Neon 콘솔에서 데이터베이스 상태 확인

3. 로컬 테스트용 PostgreSQL 실행
```bash
# Docker로 로컬 PostgreSQL 실행
docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
```

---

## 보안 주의사항

### 1. 비밀번호 처리
- ✅ bcrypt로 해시된 비밀번호만 저장
- ❌ 평문 비밀번호 절대 저장 금지

### 2. JWT 토큰
- 만료 시간: 24시간
- 시크릿 키: `config.JWT_SECRET`
- 프로덕션에서 환경변수로 관리 필요

### 3. 관리자 권한
- User `id = 1`만 관리자 접근 가능
- 프로덕션에서 별도 role 컬럼 추가 권장

### 4. SQL Injection 방지
- SQLAlchemy ORM 사용으로 자동 방어
- 직접 SQL 실행 시 파라미터 바인딩 필수

---

## 성능 최적화

### 1. 데이터베이스 인덱스
```sql
-- 자주 조회되는 필드에 인덱스 추가
CREATE INDEX idx_enrollment_status ON "Enrollment"(status);
CREATE INDEX idx_enrollment_user_party ON "Enrollment"("userId", "partyId");
```

### 2. N+1 쿼리 방지
```python
# Bad: N+1 쿼리
enrollments = await db.execute(select(Enrollment))
for e in enrollments:
    await db.refresh(e, ["user"])  # N번 추가 쿼리

# Good: Join으로 한 번에 조회
enrollments = await db.execute(
    select(Enrollment).join(User).options(joinedload(Enrollment.user))
)
```

### 3. 커넥션 풀 설정
```python
# database.py
engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,  # 커넥션 풀 크기
    max_overflow=20,  # 최대 추가 커넥션
)
```

---

## 운영 중 유저 지원 시나리오

실제 서비스 운영 시 유저들이 요청할 수 있는 상황들과 운영자 대처 방법

### 시나리오 1: 비밀번호 분실/초기화 요청

**상황:**
> "비밀번호를 잊어버렸어요. 초기화해주세요."

**해결 방법:**

**방법 A: 임시 비밀번호 생성 후 안내**
```python
# Python으로 bcrypt 해시 생성
import bcrypt

new_password = "TempPass123!"
hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
print(hashed.decode('utf-8'))
# 출력: $2b$12$... (이 값을 SQL에 사용)
```

```sql
-- 유저 ID로 검색 (이름/전화번호로 먼저 찾기)
SELECT id, "userId", name, phone FROM "User" WHERE name = '홍길동';

-- 비밀번호 업데이트
UPDATE "User"
SET password = '$2b$12$새로생성한해시값'
WHERE id = 123;
```

**방법 B: 유저에게 재가입 안내**
- 기존 계정 삭제 후 새로 가입하도록 안내
- 초대코드 재발급

**⚠️ 주의:**
- 비밀번호 변경 시 유저에게 안전하게 전달 (카톡, 문자)
- 임시 비밀번호는 충분히 복잡하게 생성
- 로그인 후 비밀번호 변경 권장

---

### 시나리오 2: 쿠폰을 실수로 사용함 (재발급 요청)

**상황:**
> "실수로 쿠폰 사용 버튼을 눌렀어요. 다시 사용할 수 있게 해주세요."

**해결 방법:**

```sql
-- 1. 유저 확인
SELECT * FROM "User" WHERE name = '홍길동' OR "userId" = 'user123';

-- 2. Enrollment 확인
SELECT * FROM "Enrollment"
WHERE "userId" = 123 AND "partyId" = 1;

-- 3. 쿠폰 사용 상태 초기화
UPDATE "Enrollment"
SET "couponUsed" = false
WHERE "userId" = 123 AND "partyId" = 1;
```

**Prisma Studio 방법:**
1. `npx prisma studio`
2. Enrollment 테이블에서 해당 유저 검색
3. `couponUsed` 필드를 `false`로 변경
4. Save

**⚠️ 주의:**
- 쿠폰이 실제로 매장에서 사용되었는지 먼저 확인
- 중복 사용 방지를 위해 기록 남기기

---

### 시나리오 3: 전화번호/이름 변경 요청

**상황:**
> "전화번호가 바뀌었어요. 010-1234-5678에서 010-9999-8888로 변경해주세요."

**해결 방법:**

```sql
-- 유저 확인
SELECT id, "userId", name, phone FROM "User" WHERE phone = '01012345678';

-- 전화번호 변경
UPDATE "User"
SET phone = '01099998888'
WHERE id = 123;

-- 이름 변경
UPDATE "User"
SET name = '새이름'
WHERE id = 123;
```

**Prisma Studio 방법:**
1. User 테이블에서 해당 유저 찾기
2. `phone` 또는 `name` 필드 수정
3. Save

---

### 시나리오 4: 파티 참가 취소 요청

**상황:**
> "급한 일이 생겨서 파티에 못 가게 됐어요. 취소해주세요."

**해결 방법:**

**방법 A: Enrollment 삭제 (환불 시)**
```sql
-- Enrollment 삭제
DELETE FROM "Enrollment"
WHERE "userId" = 123 AND "partyId" = 1;
```

**방법 B: 상태만 변경 (기록 보존)**
```sql
-- 상태를 rejected로 변경
UPDATE "Enrollment"
SET status = 'rejected', "couponUsed" = false
WHERE "userId" = 123 AND "partyId" = 1;
```

**권장:** 방법 B (기록 보존)

---

### 시나리오 5: 로그인 ID 분실

**상황:**
> "제 로그인 ID가 뭐였는지 기억이 안 나요."

**해결 방법:**

```sql
-- 이름으로 검색
SELECT "userId", name, phone, birthday FROM "User"
WHERE name = '홍길동';

-- 전화번호로 검색
SELECT "userId", name, phone FROM "User"
WHERE phone = '01012345678';

-- 생년월일로 검색
SELECT "userId", name, phone, birthday FROM "User"
WHERE birthday = '990101';
```

**유저에게 안내:**
- 개인정보 확인 후 userId 전달
- 보안을 위해 전화번호 뒷자리 확인 등 본인 인증 필수

---

### 시나리오 6: 승인 대기가 너무 오래 걸림

**상황:**
> "결제한 지 3일 됐는데 아직도 승인 대기 중이에요."

**해결 방법:**

```sql
-- 1. Enrollment 상태 확인
SELECT e.id, e.status, e."createdAt", u.name, u.phone
FROM "Enrollment" e
JOIN "User" u ON e."userId" = u.id
WHERE u."userId" = 'user123' AND e."partyId" = 1;

-- 2. 결제 확인 후 즉시 승인
UPDATE "Enrollment"
SET status = 'approved'
WHERE id = 456;
```

**Admin Dashboard 사용:**
- 관리자 계정으로 로그인
- Admin Dashboard → Pending 목록에서 승인

---

### 시나리오 7: 쿠폰이 보이지 않음 (승인 완료 후)

**상황:**
> "승인 완료됐다고 했는데 쿠폰이 안 보여요."

**원인 파악:**

```sql
-- Enrollment 상태 확인
SELECT e.*, u.name FROM "Enrollment" e
JOIN "User" u ON e."userId" = u.id
WHERE u."userId" = 'user123' AND e."partyId" = 1;
```

**가능한 원인 및 해결:**

**원인 1: status가 approved가 아님**
```sql
UPDATE "Enrollment"
SET status = 'approved'
WHERE "userId" = 123 AND "partyId" = 1;
```

**원인 2: 브라우저 캐시 문제**
- 유저에게 브라우저 새로고침 (Ctrl+F5) 안내
- 로그아웃 후 재로그인 요청

**원인 3: JWT 토큰 만료**
- 유저에게 재로그인 안내

---

### 시나리오 8: 중복 참가 신청

**상황:**
> "실수로 참가 버튼을 여러 번 눌렀어요."

**확인:**

```sql
-- 중복 enrollment 확인
SELECT * FROM "Enrollment"
WHERE "userId" = 123;
```

**해결:**

현재 시스템은 `@@unique([userId, partyId])` 제약으로 중복 방지되어 있음.
- 실제로는 중복 생성 불가능
- 유저에게 시스템적으로 방지되고 있다고 안내

만약 다른 파티에 중복 신청한 경우:
```sql
-- 특정 enrollment만 삭제
DELETE FROM "Enrollment" WHERE id = 999;
```

---

### 시나리오 9: 계정 삭제 요청 (탈퇴)

**상황:**
> "더 이상 서비스를 이용하지 않을 거예요. 계정을 삭제해주세요."

**해결 방법:**

```sql
-- 1. 유저 확인
SELECT id, "userId", name FROM "User" WHERE "userId" = 'user123';

-- 2. Enrollment 먼저 삭제
DELETE FROM "Enrollment" WHERE "userId" = 123;

-- 3. User 삭제
DELETE FROM "User" WHERE id = 123;
```

**⚠️ 주의:**
- 삭제 전에 환불/쿠폰 사용 여부 확인
- 삭제는 복구 불가능 (현재 Soft Delete 미구현)
- 유저에게 삭제 전 확인 받기

---

### 시나리오 10: 결제했는데 Enrollment가 없음

**상황:**
> "결제했는데 참가 신청 내역이 안 보여요."

**원인 파악:**

```sql
-- 1. 유저 확인
SELECT id FROM "User" WHERE "userId" = 'user123';

-- 2. Enrollment 존재 여부 확인
SELECT * FROM "Enrollment" WHERE "userId" = 123;
```

**해결:**

**경우 1: Enrollment가 아예 없음**
```sql
-- 수동으로 enrollment 생성 (API 대신)
INSERT INTO "Enrollment" ("userId", "partyId", status, enrolled, "couponUsed", "createdAt")
VALUES (123, 1, 'approved', true, false, NOW());
```

**경우 2: Enrollment는 있지만 pending 상태**
```sql
-- 즉시 승인
UPDATE "Enrollment" SET status = 'approved' WHERE "userId" = 123 AND "partyId" = 1;
```

---

### 시나리오 11: 초대코드가 작동하지 않음

**상황:**
> "초대코드를 입력했는데 '유효하지 않은 코드'라고 나와요."

**원인 파악:**

```sql
-- 초대코드 확인
SELECT * FROM "Invitation" WHERE code = 'CHRISTMAS2024';
```

**해결:**

**원인 1: is_active가 false**
```sql
UPDATE "Invitation" SET is_active = true WHERE code = 'CHRISTMAS2024';
```

**원인 2: 대소문자 오류**
- 유저가 입력한 코드 확인 (대소문자 구분됨)

**원인 3: 초대코드가 존재하지 않음**
```sql
-- 새 초대코드 생성
INSERT INTO "Invitation" (code, is_active) VALUES ('NEWCODE2024', true);
```

---

### 시나리오 12: 여러 계정을 만들었음 (중복 계정)

**상황:**
> "실수로 계정을 2개 만들었어요. 하나만 남기고 삭제해주세요."

**확인:**

```sql
-- 동일인으로 추정되는 계정 검색 (이름/전화번호)
SELECT id, "userId", name, phone FROM "User"
WHERE name = '홍길동' OR phone = '01012345678';
```

**해결:**

```sql
-- 삭제할 계정의 enrollment 먼저 삭제
DELETE FROM "Enrollment" WHERE "userId" = 456;

-- 삭제할 계정 삭제
DELETE FROM "User" WHERE id = 456;
```

**유지할 계정 확인:**
- 유저에게 어떤 계정을 유지할지 확인
- Enrollment가 있는 계정은 신중하게 처리

---

### 시나리오 대응 체크리스트

모든 유저 지원 요청 시:

✅ **1. 유저 신원 확인**
- 이름, 전화번호, 생년월일 등으로 본인 확인

✅ **2. 데이터베이스 백업 확인**
- 중요한 변경 전 현재 상태 기록

✅ **3. 변경 사항 기록**
- 누가, 언제, 무엇을, 왜 변경했는지 기록

✅ **4. 유저에게 결과 안내**
- 처리 완료 후 변경사항 명확히 전달

✅ **5. 재발 방지**
- 같은 문제가 자주 발생하면 시스템 개선 검토

---

## 향후 개선 사항

### 1. Party 모델 추가
현재는 파티 정보가 하드코딩되어 있음. Party 테이블 추가 필요:
```prisma
model Party {
  id          Int      @id @default(autoincrement())
  name        String
  date        DateTime
  location    String
  capacity    Int
  imageUrl    String?
  enrollments Enrollment[]
}
```

### 2. RegisterSession 자동 정리
- `createdAt` 필드 추가
- 24시간 지난 세션 자동 삭제 cron job

### 3. 이메일 알림
- Enrollment 승인 시 이메일 발송
- 쿠폰 사용 시 merchant에게 알림

### 4. Role 기반 권한 관리
```prisma
model User {
  // ...
  role String @default("user") // "user" | "admin" | "merchant"
}
```

### 5. Soft Delete
- 유저 삭제 시 실제 삭제 대신 `deletedAt` 필드 사용
- 데이터 복구 가능

---

## 참고 자료

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [Prisma 공식 문서](https://www.prisma.io/docs)
- [SQLAlchemy 공식 문서](https://docs.sqlalchemy.org/)
- [Neon 문서](https://neon.tech/docs/introduction)

---

## 문의

문제 발생 시:
1. 로그 확인: `uvicorn main:app --reload` 출력
2. 데이터베이스 확인: `npx prisma studio`
3. 이슈 등록: [GitHub Issues](https://github.com/JoonHyoungLee-Seoul/vanta/issues)

---

**마지막 업데이트**: 2025-12-23
