# 관리자 계정 설정 가이드

## 개요

이 애플리케이션은 관리자 권한을 사용자 ID 기반으로 관리합니다. 데이터베이스에 별도의 `isAdmin` 필드를 두지 않고, 환경 변수로 관리자 사용자 ID를 지정합니다.

## 첫 관리자 계정 설정

### 1단계: 첫 사용자 등록

애플리케이션을 시작하고 첫 번째 사용자를 등록합니다.

**방법 1: 프론트엔드 사용**
1. 브라우저에서 애플리케이션 접속
2. 초대 코드 입력
3. 회원가입 플로우 완료 (이름, 생년월일, 전화번호, ID, 비밀번호)
4. 등록 완료

**방법 2: API 직접 호출**

```bash
# 1. 초대 코드 검증
curl -X POST http://localhost:8000/auth/invitation/verify \
  -H "Content-Type: application/json" \
  -d '{"invitation_code": "YOUR_INVITATION_CODE"}'

# 응답에서 sessionId 저장
SESSION_ID="received_session_id"

# 2. 이름 저장
curl -X PUT http://localhost:8000/auth/register/name \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"name\": \"관리자\"}"

# 3. 생년월일 저장
curl -X PUT http://localhost:8000/auth/register/birthday \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"birthday\": \"1990-01-01\"}"

# 4. 전화번호 저장
curl -X PUT http://localhost:8000/auth/register/phone \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"phone\": \"010-1234-5678\"}"

# 5. 사용자 ID 저장
curl -X PUT http://localhost:8000/auth/register/userid \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"user_id\": \"admin\"}"

# 6. 비밀번호 저장 및 사용자 생성
curl -X PUT http://localhost:8000/auth/register/password \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"password\": \"secure_password_here\"}"

# 응답에서 userId 확인
# {"ok": true, "userId": 1}
```

### 2단계: 사용자 ID 확인

등록된 사용자의 ID를 확인합니다.

**방법 1: Prisma Studio 사용**

```bash
cd myapp-backend
npx prisma studio
```

1. 브라우저에서 http://localhost:5555 접속
2. `User` 테이블 선택
3. 등록한 사용자의 `id` 필드 확인

**방법 2: 데이터베이스 직접 쿼리**

```bash
# PostgreSQL 접속
psql -h your-host -U your-user -d your-database

# 사용자 목록 조회
SELECT id, "userId", name FROM "User" ORDER BY id;
```

**방법 3: API로 로그인 후 확인**

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id": "admin", "password": "your_password"}'

# 응답에서 userId 확인
# {"ok": true, "userId": 1, "name": "관리자", "accessToken": "..."}
```

### 3단계: 환경 변수 설정

확인한 사용자 ID를 `.env` 파일에 설정합니다.

```bash
# .env 파일 수정
nano .env  # 또는 vim, code 등
```

`ADMIN_USER_IDS` 항목에 사용자 ID 추가:

```bash
# 단일 관리자
ADMIN_USER_IDS=1

# 복수 관리자 (쉼표로 구분)
ADMIN_USER_IDS=1,2,3
```

### 4단계: 서버 재시작

환경 변수 변경사항을 적용하기 위해 서버를 재시작합니다.

```bash
# 개발 환경
# Ctrl+C로 서버 중지 후
uvicorn main:app --reload

# 프로덕션 환경
sudo systemctl restart myapp
```

### 5단계: 관리자 권한 테스트

관리자 전용 엔드포인트에 접근하여 권한을 테스트합니다.

```bash
# 1. 로그인하여 토큰 받기
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id": "admin", "password": "your_password"}' \
  | jq -r '.accessToken')

# 2. 관리자 전용 엔드포인트 접근
curl -X GET http://localhost:8000/enrollments \
  -H "Authorization: Bearer $TOKEN"

# 3. 성공 응답 확인
# {"enrollments": [...], "total": ...}
```

## 관리자 추가/제거

### 관리자 추가

1. 새로운 사용자가 정상적으로 회원가입
2. 해당 사용자의 ID 확인 (2단계 참조)
3. `.env` 파일의 `ADMIN_USER_IDS`에 추가
   ```bash
   # 기존: ADMIN_USER_IDS=1
   # 변경: ADMIN_USER_IDS=1,5,10
   ```
4. 서버 재시작

### 관리자 제거

1. `.env` 파일의 `ADMIN_USER_IDS`에서 해당 ID 제거
   ```bash
   # 기존: ADMIN_USER_IDS=1,5,10
   # 변경: ADMIN_USER_IDS=1,10
   ```
2. 서버 재시작

## 관리자 권한이 필요한 엔드포인트

관리자만 접근할 수 있는 엔드포인트:

1. **GET /enrollments**
   - 모든 파티 참가 내역 조회
   - 사용자 정보 포함

2. **GET /enrollments/party/{party_id}**
   - 특정 파티의 참가 내역 조회
   - 사용자 정보 포함

## 권한 확인 로직

관리자 권한은 `auth.py`의 `get_current_admin_user()` 함수에서 확인합니다:

```python
async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    # 환경변수에서 관리자 ID 목록 읽기
    admin_ids = os.getenv("ADMIN_USER_IDS", "").split(",")

    # 현재 사용자가 관리자 목록에 있는지 확인
    if current_user.id not in admin_ids:
        raise HTTPException(status_code=403, detail="관리자 권한이 없습니다.")

    return current_user
```

## 문제 해결

### "관리자 권한이 없습니다" 에러

**원인:**
- `ADMIN_USER_IDS`에 사용자 ID가 없음
- 서버가 재시작되지 않음
- 잘못된 사용자 ID로 로그인

**해결방법:**
1. `.env` 파일에서 `ADMIN_USER_IDS` 확인
2. 서버 재시작
3. 올바른 관리자 계정으로 로그인했는지 확인

### ADMIN_USER_IDS 환경 변수가 비어있음

**원인:**
- `.env` 파일에 `ADMIN_USER_IDS` 설정이 없음

**해결방법:**
```bash
# .env 파일에 추가
echo "ADMIN_USER_IDS=1" >> .env

# 서버 재시작
```

### 관리자 계정으로 로그인했는데 권한이 없음

**원인:**
- 토큰이 만료됨
- 다른 계정으로 로그인함
- 서버 재시작 후 다시 로그인하지 않음

**해결방법:**
1. 로그아웃 후 다시 로그인
2. 새로운 토큰으로 요청
3. 올바른 관리자 계정인지 확인

## 보안 권장사항

1. **관리자 계정 비밀번호**
   - 강력한 비밀번호 사용 (16자 이상, 대소문자+숫자+특수문자)
   - 정기적으로 비밀번호 변경

2. **ADMIN_USER_IDS 관리**
   - 필요한 관리자만 추가
   - 퇴사자 즉시 제거
   - 정기적으로 관리자 목록 검토

3. **접근 로그 모니터링**
   - 관리자 엔드포인트 접근 로그 확인
   - 비정상적인 접근 패턴 감지

4. **환경 변수 보안**
   - `.env` 파일을 Git에 커밋하지 않음
   - 파일 권한 설정 (chmod 600 .env)
   - 프로덕션 환경에서는 시스템 환경 변수 사용 권장

## 초기 초대 코드 생성

첫 사용자를 등록하기 위한 초대 코드가 필요합니다.

**데이터베이스에 직접 추가:**

```sql
-- PostgreSQL
INSERT INTO "Invitation" (code, is_active)
VALUES ('FIRST_ADMIN_2024', true);
```

**Prisma Studio 사용:**
1. `npx prisma studio`
2. `Invitation` 테이블 선택
3. "Add record" 클릭
4. `code`: "FIRST_ADMIN_2024", `is_active`: true 입력
5. Save

## 참고 문서

- [SECURITY.md](SECURITY.md) - 보안 설정 전체 가이드
- [DEPLOYMENT.md](DEPLOYMENT.md) - 배포 가이드
- [auth.py](auth.py) - 인증 로직 구현
