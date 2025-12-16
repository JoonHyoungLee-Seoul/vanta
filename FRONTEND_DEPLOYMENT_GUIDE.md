# 프론트엔드 배포 가이드

## 백엔드 배포 정보

### 배포된 백엔드 URL
```
https://vanta-production-9f79.up.railway.app
```

### API 문서
- Swagger UI: https://vanta-production-9f79.up.railway.app/docs
- ReDoc: https://vanta-production-9f79.up.railway.app/redoc

### 헬스체크 엔드포인트
```
GET https://vanta-production-9f79.up.railway.app/health
```

응답 예시:
```json
{
  "status": "ok",
  "service": "vanta-backend"
}
```

---

## 프론트엔드 환경 변수 설정

프론트엔드 배포 시 다음 환경 변수를 설정해야 합니다:

### Vercel 배포 시
```bash
# Environment Variables 설정
NEXT_PUBLIC_API_URL=https://vanta-production-9f79.up.railway.app
NEXT_PUBLIC_API_BASE_URL=https://vanta-production-9f79.up.railway.app
```

### Netlify 배포 시
```bash
# Environment Variables 설정
REACT_APP_API_URL=https://vanta-production-9f79.up.railway.app
REACT_APP_API_BASE_URL=https://vanta-production-9f79.up.railway.app
```

### Capacitor 모바일 앱 빌드 시
`myapp-frontend/capacitor.config.ts` 또는 환경 변수 파일에서:
```typescript
const config: CapacitorConfig = {
  // ... 기존 설정
  server: {
    url: 'https://vanta-production-9f79.up.railway.app', // 개발 시에만
    cleartext: true
  }
};
```

---

## CORS 설정 (중요!)

백엔드에서 CORS를 허용하려면 프론트엔드 배포 URL을 백엔드 환경 변수에 추가해야 합니다.

### 프론트엔드 배포 후 해야 할 일:

1. 프론트엔드 배포 URL 확인 (예: `https://your-app.vercel.app`)

2. Railway 대시보드에서 백엔드 프로젝트의 **Variables** 탭으로 이동

3. `ALLOWED_ORIGINS` 변수를 다음과 같이 수정:
```
https://vanta-production-9f79.up.railway.app,https://your-app.vercel.app
```

**중요**:
- 여러 도메인은 쉼표(`,`)로 구분
- `http://localhost:3000`은 개발 환경에서만 사용
- 프로덕션에서는 실제 배포된 도메인만 포함

---

## API 엔드포인트 목록

### 인증 관련
- `POST /auth/invitation/verify` - 초대 코드 확인
- `PUT /auth/register/name` - 이름 등록
- `PUT /auth/register/birthday` - 생년월일 등록
- `PUT /auth/register/phone` - 전화번호 등록
- `PUT /auth/register/password` - 비밀번호 등록 및 최종 회원가입
- `POST /auth/login` - 로그인
- `POST /auth/refresh` - 토큰 갱신

### 사용자 관련
- `GET /users/me` - 내 정보 조회
- `PUT /users/me` - 내 정보 수정
- `GET /users/{user_id}` - 특정 사용자 조회

### 파티 관련
- `POST /parties` - 파티 생성 (관리자 전용)
- `GET /parties` - 파티 목록 조회
- `GET /parties/{party_id}` - 파티 상세 조회
- `PUT /parties/{party_id}` - 파티 수정 (관리자 전용)
- `DELETE /parties/{party_id}` - 파티 삭제 (관리자 전용)

### 참가 신청 관련
- `POST /parties/{party_id}/enroll` - 파티 참가 신청
- `GET /enrollments/me` - 내 참가 신청 목록
- `GET /parties/{party_id}/enrollments` - 파티 참가 신청 목록 (관리자 전용)

상세한 API 스펙은 Swagger 문서를 참조하세요: https://vanta-production-9f79.up.railway.app/docs

---

## 인증 처리 방법

### JWT 토큰 사용
백엔드는 JWT 기반 인증을 사용합니다.

1. 로그인 후 받은 `access_token`을 저장
2. API 요청 시 헤더에 포함:
```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

3. 토큰 만료 시 `/auth/refresh` 엔드포인트로 갱신

### 토큰 저장 권장 방법
- 웹: `localStorage` 또는 `sessionStorage`
- 모바일: Capacitor Preferences API

---

## 배포 플랫폼별 가이드

### Vercel (추천)
```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 디렉토리로 이동
cd myapp-frontend

# 3. 배포
vercel

# 4. 환경 변수 설정
vercel env add NEXT_PUBLIC_API_URL
# 값: https://vanta-production-9f79.up.railway.app

# 5. 프로덕션 배포
vercel --prod
```

### Netlify
```bash
# 1. Netlify CLI 설치
npm i -g netlify-cli

# 2. 빌드
npm run build

# 3. 배포
netlify deploy --prod --dir=dist

# 4. 환경 변수는 Netlify Dashboard에서 설정
```

### Capacitor 모바일 앱
```bash
# 1. 프로덕션 빌드
npm run build

# 2. Capacitor 동기화
npx cap sync

# 3. Android 빌드
npx cap open android
# Android Studio에서 빌드

# 4. iOS 빌드
npx cap open ios
# Xcode에서 빌드
```

---

## 테스트 체크리스트

프론트엔드 배포 후 다음 항목을 테스트하세요:

- [ ] 로그인 기능 작동
- [ ] 회원가입 플로우 완료
- [ ] 파티 목록 조회
- [ ] 파티 상세 페이지 조회
- [ ] 파티 참가 신청
- [ ] 내 정보 조회 및 수정
- [ ] 토큰 갱신 기능
- [ ] 로그아웃 기능
- [ ] CORS 에러 없이 API 호출 성공

---

## 문제 해결

### CORS 에러 발생 시
```
Access to fetch at 'https://vanta-production-9f79.up.railway.app/...'
from origin 'https://your-app.vercel.app' has been blocked by CORS policy
```

**해결 방법**: Railway의 `ALLOWED_ORIGINS` 환경 변수에 프론트엔드 URL 추가

### 401 Unauthorized 에러
- 토큰이 만료되었거나 유효하지 않음
- `/auth/refresh` 엔드포인트로 토큰 갱신 필요

### 502 Bad Gateway 에러
- 백엔드 서버가 다운되었을 가능성
- Railway 대시보드에서 배포 상태 확인

---

## 연락처

백엔드 관련 문제나 질문이 있으면 백엔드 담당자에게 연락하세요.

**백엔드 담당자**: [귀하의 연락처]
**GitHub 저장소**: https://github.com/JoonHyoungLee-Seoul/vanta

---

## 추가 참고 사항

1. **데이터베이스**: Supabase PostgreSQL 사용 중
2. **배포 플랫폼**: Railway
3. **서버 위치**: Asia Southeast (Singapore)
4. **빌드 시스템**: Nixpacks
5. **Python 버전**: 3.11
6. **Node.js 버전**: 18.x

배포 성공을 기원합니다! 🚀
