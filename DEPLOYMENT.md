# 배포 가이드 (Deployment Guide)

이 문서는 Vanta Party Management System을 프로덕션 환경에 배포하는 방법을 설명합니다.

---

## 목차
1. [배포 전 체크리스트](#배포-전-체크리스트)
2. [환경 변수 설정](#환경-변수-설정)
3. [코드 수정 사항](#코드-수정-사항)
4. [백엔드 배포](#백엔드-배포)
5. [프론트엔드 배포](#프론트엔드-배포)
6. [배포 후 확인](#배포-후-확인)
7. [도메인 설정](#도메인-설정)
8. [모니터링 및 로그](#모니터링-및-로그)

---

## 배포 전 체크리스트

### ✅ 필수 준비사항

- [ ] Supabase 데이터베이스가 정상 작동 중
- [ ] 모든 마이그레이션이 적용됨 (`npx prisma migrate deploy`)
- [ ] 로컬 환경에서 백엔드/프론트엔드 정상 작동 확인
- [ ] 초대 코드가 데이터베이스에 등록되어 있음
- [ ] 관리자 계정 생성 및 `ADMIN_USER_IDS` 설정
- [ ] 결제 정보(계좌번호 등) 확인

### ⚠️ 보안 설정

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 프로덕션용 `SECRET_KEY` 생성
- [ ] 프로덕션용 `JWT_SECRET_KEY` 생성 (최소 32자)
- [ ] 데이터베이스 비밀번호 확인
- [ ] CORS 설정에 프로덕션 도메인 추가

### 🔑 시크릿 키 생성

Python으로 강력한 랜덤 키 생성:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

또는 OpenSSL 사용:
```bash
openssl rand -base64 32
```

---

## 환경 변수 설정

### 백엔드 환경 변수 (`.env`)

배포 플랫폼에 다음 환경 변수를 설정해야 합니다:

```bash
# Database Connection (Supabase Direct Connection)
DATABASE_URL=postgresql://postgres:<PASSWORD>@db.vawhihblhegdinrsgjer.supabase.co:5432/postgres

# Application Configuration
ENVIRONMENT=production
SECRET_KEY=<GENERATED_SECRET_KEY_32_CHARS_OR_MORE>
JWT_SECRET_KEY=<GENERATED_JWT_SECRET_KEY_32_CHARS_OR_MORE>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS Origins (프로덕션 도메인 추가)
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Payment Information
BANK_NAME=우리은행
BANK_ACCOUNT_NUMBER=1002-83863-3924
BANK_ACCOUNT_HOLDER=받는분
PAYMENT_AMOUNT=25000

# Admin Configuration (User ID, comma-separated)
ADMIN_USER_IDS=8
```

### 프론트엔드 환경 변수

```bash
# Backend API URL
VITE_API_URL=https://your-backend-domain.com
```

---

## 코드 수정 사항

### 1. Admin.jsx 하드코딩 제거

**파일**: `myapp-frontend/src/pages/Admin.jsx`

**현재 (Line 23)**:
```javascript
const response = await fetch('http://localhost:8000/admin/enrollments/pending', {
```

**수정 후**:
```javascript
const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/admin/enrollments/pending`, {
```

**또는** API_BASE_URL import 사용:
```javascript
// 파일 상단에 추가
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Line 23, 49, 77 등 모든 fetch 호출 수정
const response = await fetch(`${API_BASE_URL}/admin/enrollments/pending`, {
```

이 수정을 모든 하드코딩된 URL에 적용 (Line 23, 49, 77).

### 2. config.py 검증 활성화

`config.py`의 `validate_production_config()` 함수가 이미 구현되어 있어서 프로덕션 환경에서 자동으로 설정을 검증합니다.

---

## 백엔드 배포

### 옵션 1: Railway (추천)

Railway는 Python 애플리케이션 배포에 최적화되어 있으며, 무료 티어를 제공합니다.

#### 1.1 Railway 프로젝트 생성

1. [Railway.app](https://railway.app) 회원가입
2. "New Project" → "Deploy from GitHub repo" 선택
3. GitHub 저장소 연결 (또는 수동 업로드)

#### 1.2 설정 파일 생성

**`myapp-backend/railway.json`** (Railway 설정):
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**`myapp-backend/nixpacks.toml`** (Nixpacks 빌드 설정):
```toml
[phases.setup]
nixPkgs = ["python39", "nodejs-18_x"]

[phases.install]
cmds = [
  "pip install -r requirements.txt",
  "npm install"
]

[phases.build]
cmds = [
  "npx prisma generate"
]

[start]
cmd = "gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT"
```

#### 1.3 환경 변수 설정

Railway Dashboard → Variables → Add Variable:
- `DATABASE_URL`
- `ENVIRONMENT=production`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM=HS256`
- `JWT_EXPIRATION_HOURS=24`
- `ALLOWED_ORIGINS`
- `BANK_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_HOLDER`, `PAYMENT_AMOUNT`
- `ADMIN_USER_IDS`

#### 1.4 배포

```bash
cd myapp-backend
railway login
railway link
railway up
```

또는 GitHub에 푸시하면 자동 배포됩니다.

#### 1.5 도메인 확인

Railway Dashboard → Settings → Domains에서 제공된 URL 확인
(예: `your-app.up.railway.app`)

---

### 옵션 2: Render

Render는 무료 티어를 제공하며 설정이 간단합니다.

#### 2.1 Render 프로젝트 생성

1. [Render.com](https://render.com) 회원가입
2. "New" → "Web Service" 선택
3. GitHub 저장소 연결

#### 2.2 설정

**Root Directory**: `myapp-backend`
**Build Command**:
```bash
pip install -r requirements.txt && npm install && npx prisma generate
```

**Start Command**:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

**Environment Variables**: Railway와 동일하게 설정

#### 2.3 배포

GitHub에 푸시하면 자동으로 배포됩니다.

---

### 옵션 3: Fly.io

#### 3.1 Fly CLI 설치

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh
```

#### 3.2 로그인 및 초기화

```bash
cd myapp-backend
fly auth login
fly launch
```

#### 3.3 fly.toml 설정

```toml
app = "your-app-name"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8000"
  ENVIRONMENT = "production"

[[services]]
  http_checks = []
  internal_port = 8000
  processes = ["app"]
  protocol = "tcp"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

#### 3.4 환경 변수 설정

```bash
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set SECRET_KEY="..."
fly secrets set JWT_SECRET_KEY="..."
# ... 기타 환경 변수
```

#### 3.5 배포

```bash
fly deploy
```

---

### 옵션 4: AWS / GCP / Azure

전통적인 클라우드 플랫폼 사용 시:

1. **EC2 / Compute Engine / VM 인스턴스** 생성
2. Python 3.8+ 및 Node.js 설치
3. 프로젝트 클론 및 의존성 설치
4. Gunicorn + Uvicorn으로 실행
5. Nginx를 리버스 프록시로 설정
6. SSL 인증서 설정 (Let's Encrypt)

상세한 내용은 각 플랫폼의 문서를 참조하세요.

---

## 프론트엔드 배포

### 옵션 1: Vercel (추천)

Vercel은 React/Vite 애플리케이션에 최적화되어 있습니다.

#### 1.1 Vercel 프로젝트 생성

1. [Vercel.com](https://vercel.com) 회원가입
2. "Add New Project" → "Import Git Repository"
3. GitHub 저장소 선택

#### 1.2 프로젝트 설정

**Framework Preset**: Vite
**Root Directory**: `myapp-frontend`
**Build Command**: `npm run build` (기본값)
**Output Directory**: `dist` (기본값)

**Environment Variables**:
```bash
VITE_API_URL=https://your-backend-domain.com
```

#### 1.3 배포

"Deploy" 클릭하면 자동으로 배포됩니다.

#### 1.4 도메인 확인

Vercel이 자동으로 도메인을 제공합니다 (예: `your-app.vercel.app`).
커스텀 도메인도 설정 가능합니다.

---

### 옵션 2: Netlify

#### 2.1 Netlify 프로젝트 생성

1. [Netlify.com](https://netlify.com) 회원가입
2. "Add new site" → "Import an existing project"
3. GitHub 저장소 선택

#### 2.2 빌드 설정

**Base directory**: `myapp-frontend`
**Build command**: `npm run build`
**Publish directory**: `myapp-frontend/dist`

**Environment Variables**:
```bash
VITE_API_URL=https://your-backend-domain.com
```

#### 2.3 배포

"Deploy site" 클릭

---

### 옵션 3: Cloudflare Pages

#### 3.1 Cloudflare Pages 프로젝트 생성

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. "Create a project" → GitHub 저장소 연결

#### 3.2 빌드 설정

**Build command**: `npm run build`
**Build output directory**: `dist`
**Root directory**: `myapp-frontend`

**Environment Variables**:
```bash
VITE_API_URL=https://your-backend-domain.com
```

#### 3.3 배포

자동 배포 시작

---

## 배포 후 확인

### 1. 백엔드 헬스 체크

```bash
curl https://your-backend-domain.com/health
```

**예상 응답**:
```json
{
  "status": "ok",
  "service": "vanta-backend"
}
```

### 2. 프론트엔드 접근

브라우저에서 `https://your-frontend-domain.com` 접속

### 3. API 연결 테스트

프론트엔드에서 로그인 시도하여 백엔드와의 연결 확인

### 4. 데이터베이스 연결 확인

```bash
# Prisma Studio로 데이터 확인
cd myapp-backend
DATABASE_URL="postgresql://..." npx prisma studio
```

### 5. CORS 설정 확인

브라우저 개발자 도구에서 CORS 오류가 없는지 확인

---

## 도메인 설정

### 커스텀 도메인 연결

#### Vercel (프론트엔드)

1. Vercel Dashboard → Settings → Domains
2. 도메인 입력 (예: `vanta.example.com`)
3. DNS 설정:
   - Type: `CNAME`
   - Name: `vanta` (또는 `@` for root)
   - Value: `cname.vercel-dns.com`

#### Railway (백엔드)

1. Railway Dashboard → Settings → Domains
2. Custom Domain 추가
3. DNS 설정:
   - Type: `CNAME`
   - Name: `api`
   - Value: Railway에서 제공하는 값

### SSL 인증서

Vercel과 Railway 모두 자동으로 SSL 인증서를 발급하고 갱신합니다.

---

## 데이터베이스 마이그레이션 (프로덕션)

### 스키마 변경 시

1. **로컬에서 마이그레이션 생성**:
```bash
cd myapp-backend
npx prisma migrate dev --name <migration_name>
```

2. **프로덕션 데이터베이스에 적용**:
```bash
# Supabase DATABASE_URL 사용
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

3. **배포 플랫폼에서 Prisma 재생성**:
   - Railway: 자동으로 재배포
   - Render: 수동 재배포 트리거
   - 또는 배포 스크립트에 `npx prisma generate` 포함

---

## 모니터링 및 로그

### Railway 로그 확인

```bash
railway logs
```

또는 Railway Dashboard → Deployments → Logs

### Render 로그 확인

Render Dashboard → Logs 탭

### Vercel 로그 확인

Vercel Dashboard → Deployments → Function Logs

### 에러 추적

프로덕션 환경에서는 Sentry 등의 에러 추적 서비스 사용 권장:

1. [Sentry.io](https://sentry.io) 가입
2. FastAPI에 Sentry SDK 추가:
```bash
pip install sentry-sdk[fastapi]
```

3. `main.py`에 추가:
```python
import sentry_sdk

sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    traces_sample_rate=1.0,
    environment=config.ENVIRONMENT,
)
```

---

## 데이터베이스 백업

### Supabase 백업

Supabase는 자동으로 일일 백업을 수행합니다.

수동 백업:
```bash
# pg_dump 사용
PGPASSWORD=<password> pg_dump -h db.vawhihblhegdinrsgjer.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

복원:
```bash
PGPASSWORD=<password> psql -h db.vawhihblhegdinrsgjer.supabase.co -U postgres -d postgres < backup_20231201.sql
```

---

## 성능 최적화

### 백엔드

1. **Gunicorn Worker 수 조정**:
```bash
# CPU 코어 수 * 2 + 1
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

2. **데이터베이스 연결 풀 조정** (`database.py`):
```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,        # 연결 풀 크기
    max_overflow=20,     # 최대 오버플로우
    pool_recycle=3600    # 1시간마다 연결 재활용
)
```

3. **로깅 레벨 조정**:
```python
# main.py
logging.basicConfig(level=logging.WARNING)  # INFO 대신 WARNING
```

### 프론트엔드

1. **빌드 최적화** (Vite는 기본적으로 최적화됨)
2. **이미지 압축**
3. **코드 스플리팅** (React Lazy Loading)

---

## 환경별 설정 분리

### 개발/스테이징/프로덕션 환경

`.env.development`, `.env.staging`, `.env.production` 파일 생성 고려

---

## 체크리스트: 배포 완료

- [ ] 백엔드가 정상적으로 실행 중 (헬스 체크 통과)
- [ ] 프론트엔드가 정상적으로 렌더링됨
- [ ] 백엔드-프론트엔드 API 통신 정상
- [ ] 데이터베이스 연결 정상
- [ ] CORS 설정 정상
- [ ] HTTPS 적용됨 (SSL 인증서)
- [ ] 회원가입 플로우 테스트 완료
- [ ] 로그인/로그아웃 테스트 완료
- [ ] 파티 참가 신청 테스트 완료
- [ ] 관리자 승인 기능 테스트 완료
- [ ] 쿠폰 조회 및 사용 테스트 완료
- [ ] 모든 환경 변수가 프로덕션 값으로 설정됨
- [ ] SECRET_KEY, JWT_SECRET_KEY가 강력한 값으로 설정됨
- [ ] 로그 모니터링 설정 완료
- [ ] 데이터베이스 백업 확인

---

## 긴급 상황 대응

### 배포 롤백

#### Railway
```bash
railway rollback
```

#### Vercel
Vercel Dashboard → Deployments → 이전 배포 선택 → Promote to Production

#### Render
Render Dashboard → Manual Deploy → 이전 커밋 선택

### 서버 다운 시

1. 로그 확인
2. 데이터베이스 연결 확인
3. 환경 변수 확인
4. 필요시 서버 재시작

---

## 추가 권장 사항

1. **CI/CD 파이프라인 설정**: GitHub Actions로 자동 테스트 및 배포
2. **환경 변수 관리**: 1Password, AWS Secrets Manager 등 사용
3. **API Rate Limiting**: 무차별 요청 방지
4. **데이터베이스 인덱싱**: 성능 최적화
5. **CDN 사용**: 정적 파일 전송 최적화
6. **로드 밸런싱**: 트래픽 분산 (필요 시)

---

## 문의 및 지원

배포 중 문제 발생 시:
1. 로그 확인
2. [README.md](./README.md)의 트러블슈팅 섹션 참조
3. 각 플랫폼의 공식 문서 확인
4. 팀 리더에게 문의

---

**배포 성공을 기원합니다! 🚀**
