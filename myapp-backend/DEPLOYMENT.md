# 배포 가이드 (Deployment Guide)

## 백엔드 (Backend) 배포

### 1. 사전 준비

```bash
# 저장소 클론
git clone <your-repository-url>
cd myapp-backend

# 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# 의존성 설치
pip install -r requirements.txt
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

**중요: 다음 값들을 반드시 변경하세요:**

```bash
# JWT Secret Key 생성
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# .env 파일 수정
JWT_SECRET_KEY=<생성된-키>
SECRET_KEY=<생성된-키>
DATABASE_URL=<프로덕션-데이터베이스-URL>
ALLOWED_ORIGINS=https://your-frontend-domain.com
ADMIN_USER_IDS=<관리자-사용자-ID>
```

### 3. 데이터베이스 마이그레이션

```bash
# Prisma 마이그레이션 실행
npx prisma migrate deploy

# Prisma Python client 생성
prisma generate
```

### 4. 프로덕션 실행

#### 방법 1: start.sh 스크립트 사용 (권장)

```bash
./start.sh
```

#### 방법 2: 직접 Gunicorn 실행

```bash
gunicorn main:app \
    -w 4 \
    -k uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log \
    --log-level info
```

### 5. Systemd 서비스 설정 (Linux 서버)

`/etc/systemd/system/myapp.service` 파일 생성:

```ini
[Unit]
Description=Myapp FastAPI Application
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/path/to/myapp-backend
Environment="PATH=/path/to/myapp-backend/venv/bin"
ExecStart=/path/to/myapp-backend/start.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

서비스 시작:

```bash
sudo systemctl daemon-reload
sudo systemctl enable myapp
sudo systemctl start myapp
sudo systemctl status myapp
```

### 6. Nginx 리버스 프록시 설정

`/etc/nginx/sites-available/myapp` 파일 생성:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Nginx 설정 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL/HTTPS 설정 (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## 프론트엔드 (Frontend) 배포

### 1. 환경 변수 설정

`.env.production` 파일 생성:

```bash
VITE_API_URL=https://api.yourdomain.com
```

### 2. 프로덕션 빌드

```bash
cd myapp-frontend
npm install
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

### 3. 정적 파일 호스팅

#### 방법 1: Nginx로 호스팅

`/etc/nginx/sites-available/myapp-frontend` 파일 생성:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/myapp-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 캐시 설정
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 방법 2: Vercel 배포

```bash
npm install -g vercel
vercel --prod
```

#### 방법 3: Netlify 배포

1. `netlify.toml` 파일 생성:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. Netlify에 배포

## 환경별 설정

### Development (개발)

```bash
# Backend
uvicorn main:app --reload

# Frontend
npm run dev
```

### Production (프로덕션)

```bash
# Backend
./start.sh

# Frontend
npm run build
# dist 폴더를 웹 서버에 배포
```

## 모니터링 및 로그

### 로그 확인

```bash
# Gunicorn 로그
tail -f logs/access.log
tail -f logs/error.log

# Systemd 로그
sudo journalctl -u myapp -f
```

### 성능 모니터링

- CPU/메모리 사용량 모니터링
- 응답 시간 모니터링
- 에러율 추적

## 트러블슈팅

### Backend가 시작되지 않을 때

1. 환경 변수 확인: `.env` 파일 존재 여부
2. 데이터베이스 연결 확인: `DATABASE_URL` 올바른지 확인
3. 포트 충돌 확인: `lsof -i :8000`
4. 로그 확인: `logs/error.log`

### Frontend 빌드 실패

1. Node.js 버전 확인 (v18 이상 권장)
2. 의존성 재설치: `rm -rf node_modules package-lock.json && npm install`
3. 환경 변수 확인: `VITE_API_URL` 설정 확인

## 보안 체크리스트

- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
- [ ] JWT_SECRET_KEY가 강력한 랜덤 값인지 확인
- [ ] DATABASE_URL 비밀번호가 변경되었는지 확인
- [ ] HTTPS가 활성화되었는지 확인
- [ ] CORS 설정이 프로덕션 도메인만 허용하는지 확인
- [ ] Admin 사용자 ID가 올바르게 설정되었는지 확인
- [ ] 방화벽 규칙이 적절히 설정되었는지 확인

## 백업 및 복구

### 데이터베이스 백업

```bash
# PostgreSQL 백업
pg_dump -U username -d database_name > backup.sql

# 복구
psql -U username -d database_name < backup.sql
```

## 업데이트 배포

```bash
# 1. 코드 업데이트
git pull origin main

# 2. 의존성 업데이트
pip install -r requirements.txt  # Backend
npm install  # Frontend

# 3. 데이터베이스 마이그레이션
npx prisma migrate deploy

# 4. 서비스 재시작
sudo systemctl restart myapp  # Backend
npm run build  # Frontend
```
