# 환경별 설정 가이드

## 개요

이 프로젝트는 개발(Development)과 프로덕션(Production) 환경을 구분하여 관리합니다.

## 백엔드 환경 설정

### 개발 환경 (Development)

1. `.env` 파일 생성:
```bash
cd myapp-backend
cp .env.example .env
```

2. `.env` 파일 수정:
```bash
ENVIRONMENT=development
DATABASE_URL=postgresql://localhost:5432/myapp_dev
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
# 나머지 설정은 개발용 기본값 사용
```

3. 서버 실행:
```bash
uvicorn main:app --reload
```

### 프로덕션 환경 (Production)

1. `.env` 파일 생성 및 수정:
```bash
ENVIRONMENT=production
DATABASE_URL=postgresql://user:password@production-host:5432/myapp_prod
SECRET_KEY=<강력한-랜덤-키-32자-이상>
JWT_SECRET_KEY=<강력한-랜덤-키-32자-이상>
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ADMIN_USER_IDS=1,2,3
```

2. 환경 검증:
   - 서버 시작 시 자동으로 프로덕션 설정을 검증합니다
   - 잘못된 설정이 있으면 에러 메시지와 함께 시작이 중단됩니다

3. 서버 실행:
```bash
./start.sh
```

### 환경 검증 항목

프로덕션 환경(`ENVIRONMENT=production`)에서 다음 항목을 자동 검증합니다:

- [ ] `DATABASE_URL`이 설정되어 있는지
- [ ] `SECRET_KEY`가 기본값이 아닌 강력한 키인지 (32자 이상)
- [ ] `JWT_SECRET_KEY`가 기본값이 아닌 강력한 키인지 (32자 이상)
- [ ] `ALLOWED_ORIGINS`에 localhost가 포함되지 않았는지
- [ ] 모든 필수 환경 변수가 올바르게 설정되었는지

검증 실패 시 서버가 시작되지 않고 명확한 에러 메시지를 표시합니다.

## 프론트엔드 환경 설정

### 개발 환경 (Development)

`.env` 파일 (이미 존재):
```bash
VITE_API_URL=http://localhost:8000
```

개발 서버 실행:
```bash
npm run dev
```

### 프로덕션 환경 (Production)

1. `.env.production` 파일 수정:
```bash
VITE_API_URL=https://api.yourdomain.com
```

2. 프로덕션 빌드:
```bash
npm run build
```

Vite는 자동으로 `.env.production` 파일을 사용합니다.

## 환경별 동작 차이

### 백엔드

| 기능 | Development | Production |
|------|-------------|------------|
| 디버그 모드 | 활성화 | 비활성화 |
| 자동 리로드 | 활성화 (--reload) | 비활성화 |
| 상세 에러 메시지 | 표시 | 숨김 |
| 환경 검증 | 경고만 | 엄격한 검증 |
| CORS | localhost 허용 | 프로덕션 도메인만 |
| 로그 레벨 | DEBUG | INFO |

### 프론트엔드

| 기능 | Development | Production |
|------|-------------|------------|
| 소스맵 | 생성 | 생략 (옵션) |
| 코드 최적화 | 안함 | 최적화/압축 |
| API URL | localhost:8000 | 프로덕션 API |
| HMR | 활성화 | 비활성화 |

## 환경 변수 우선순위

### 백엔드 (Python/FastAPI)
1. `.env` 파일
2. 시스템 환경 변수
3. 기본값 (config.py)

### 프론트엔드 (Vite)
1. `.env.production` (프로덕션 빌드 시)
2. `.env` (개발 모드 시)
3. 시스템 환경 변수

## 비밀 키 생성

강력한 랜덤 키 생성:
```bash
# Python 사용
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL 사용
openssl rand -base64 32

# Node.js 사용
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 환경별 배포 전 체크리스트

### 개발 환경
- [ ] `.env` 파일 존재
- [ ] 로컬 데이터베이스 실행 중
- [ ] 의존성 설치 완료

### 프로덕션 환경
- [ ] `ENVIRONMENT=production` 설정
- [ ] 모든 비밀 키 변경 완료
- [ ] 프로덕션 데이터베이스 URL 설정
- [ ] CORS에 프로덕션 도메인 추가
- [ ] `.env` 파일이 Git에 커밋되지 않음
- [ ] HTTPS 설정 완료
- [ ] 관리자 사용자 ID 설정
- [ ] 로그 디렉토리 생성 및 권한 설정

## 문제 해결

### "Production configuration errors" 에러

프로덕션 환경에서 설정이 올바르지 않을 때 발생합니다.
에러 메시지를 읽고 해당 항목을 `.env` 파일에서 수정하세요.

```
Production configuration errors:
  - SECRET_KEY is using default value. Change it in production!
  - JWT_SECRET_KEY should be at least 32 characters long
  - ALLOWED_ORIGINS contains localhost in production. Add production domain!
```

### 환경 변수가 적용되지 않음

1. 서버를 재시작하세요
2. `.env` 파일 위치가 올바른지 확인
3. 환경 변수 이름 철자 확인
4. 프론트엔드의 경우 `VITE_` 접두사 확인

## 추가 리소스

- [SECURITY.md](myapp-backend/SECURITY.md) - 보안 설정 가이드
- [DEPLOYMENT.md](myapp-backend/DEPLOYMENT.md) - 배포 가이드
- [.env.example](myapp-backend/.env.example) - 환경 변수 템플릿
