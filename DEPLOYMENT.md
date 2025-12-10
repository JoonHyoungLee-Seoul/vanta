# 배포 가이드 (Deployment Guide)

이 문서는 Vanta Party Management System을 **모바일 앱** 및 프로덕션 환경에 배포하는 방법을 설명합니다.

---

## 목차
1. [배포 아키텍처](#배포-아키텍처)
2. [배포 전 체크리스트](#배포-전-체크리스트)
3. [백엔드 배포](#백엔드-배포)
4. [모바일 앱 배포 (iOS/Android)](#모바일-앱-배포-iosandroid)
5. [PWA 배포 (선택사항)](#pwa-배포-선택사항)
6. [환경 변수 설정](#환경-변수-설정)
7. [배포 후 확인](#배포-후-확인)
8. [앱 스토어 제출](#앱-스토어-제출)
9. [업데이트 배포](#업데이트-배포)

---

## 배포 아키텍처

```
[iOS App] ────┐
              ├──> [Backend API] ──> [Supabase Database]
[Android App] ┘    (Railway/Render)
```

- **백엔드**: Railway 또는 Render에 FastAPI 배포
- **프론트엔드**: Capacitor로 iOS/Android 네이티브 앱 빌드
- **데이터베이스**: Supabase PostgreSQL (이미 호스팅 중)

---

## 배포 전 체크리스트

### ✅ 필수 준비사항

- [ ] Supabase 데이터베이스가 정상 작동 중
- [ ] 모든 마이그레이션이 적용됨 (`npx prisma migrate deploy`)
- [ ] 로컬 환경에서 백엔드/프론트엔드 정상 작동 확인
- [ ] 초대 코드가 데이터베이스에 등록되어 있음
- [ ] 관리자 계정 생성 및 `ADMIN_USER_IDS` 설정
- [ ] Apple Developer Account (iOS 배포용, $99/년)
- [ ] Google Play Console Account (Android 배포용, $25 일회성)
- [ ] macOS 컴퓨터 (iOS 빌드용)

### ⚠️ 보안 설정

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 프로덕션용 `SECRET_KEY` 생성 (최소 32자)
- [ ] 프로덕션용 `JWT_SECRET_KEY` 생성 (최소 32자)
- [ ] 데이터베이스 비밀번호 확인
- [ ] CORS 설정 확인 (모바일 앱은 `capacitor://` 스키마 사용)

### 🔑 시크릿 키 생성

```bash
# Python으로 강력한 랜덤 키 생성
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 또는 OpenSSL 사용
openssl rand -base64 32
```

---

## 백엔드 배포

백엔드는 클라우드 서버에 배포해야 합니다. Railway 사용을 권장합니다.

### Railway로 백엔드 배포 (추천)

#### 1. Railway 계정 설정

1. [Railway.app](https://railway.app) 회원가입
2. GitHub 계정 연결

#### 2. 프로젝트 생성

1. Railway Dashboard → "New Project"
2. "Deploy from GitHub repo" 선택
3. `vanta` 저장소 선택
4. Root Directory를 `myapp-backend`로 설정

#### 3. 빌드 설정 파일 생성

**`myapp-backend/railway.json`**:
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

**`myapp-backend/nixpacks.toml`**:
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

#### 4. 환경 변수 설정

Railway Dashboard → Variables 탭에서 다음 환경 변수 추가:

```bash
DATABASE_URL=postgresql://postgres:<PASSWORD>@db.vawhihblhegdinrsgjer.supabase.co:5432/postgres
ENVIRONMENT=production
SECRET_KEY=<GENERATED_SECRET_KEY>
JWT_SECRET_KEY=<GENERATED_JWT_SECRET_KEY>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS - capacitor와 https 도메인 모두 허용
ALLOWED_ORIGINS=capacitor://localhost,http://localhost,https://your-domain.com

BANK_NAME=우리은행
BANK_ACCOUNT_NUMBER=1002-83863-3924
BANK_ACCOUNT_HOLDER=받는분
PAYMENT_AMOUNT=25000

ADMIN_USER_IDS=8
```

#### 5. 배포

```bash
cd myapp-backend
railway login
railway link
railway up
```

또는 GitHub에 푸시하면 자동 배포됩니다.

#### 6. 백엔드 URL 확인

Railway Dashboard → Settings → Domains에서 생성된 URL 확인:
- 예: `https://myapp-backend-production.up.railway.app`
- 이 URL을 모바일 앱 설정에 사용합니다.

---

## 모바일 앱 배포 (iOS/Android)

Capacitor를 사용하여 React 웹앱을 iOS/Android 네이티브 앱으로 변환합니다.

### 1. Capacitor 설치 및 초기화

```bash
cd myapp-frontend

# Capacitor CLI 설치
npm install @capacitor/core @capacitor/cli

# Capacitor 초기화
npx cap init

# 앱 정보 입력
# App name: Vanta Party
# App ID: com.vanta.party (또는 원하는 Bundle ID)
```

#### 1.1 capacitor.config.ts 설정

**`myapp-frontend/capacitor.config.ts`** 생성:
```typescript
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.vanta.party',
  appName: 'Vanta Party',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // 개발 중에는 로컬 서버 사용
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: false
    }
  }
};

export default config;
```

### 2. iOS 및 Android 플랫폼 추가

```bash
# iOS 플랫폼 추가
npm install @capacitor/ios
npx cap add ios

# Android 플랫폼 추가
npm install @capacitor/android
npx cap add android
```

### 3. 환경 변수 설정

**`myapp-frontend/.env.production`** 생성:
```bash
# Railway에서 받은 백엔드 URL
VITE_API_URL=https://myapp-backend-production.up.railway.app
```

### 4. 프로덕션 빌드

```bash
# 프로덕션 빌드
npm run build

# Capacitor에 빌드 결과 복사
npx cap sync
```

---

## iOS 앱 빌드 및 배포

### 1. 사전 준비

- macOS 컴퓨터 필수
- Xcode 최신 버전 설치 (App Store에서 다운로드)
- Apple Developer Account 가입 ($99/년)

### 2. Xcode에서 프로젝트 열기

```bash
npx cap open ios
```

Xcode가 자동으로 열립니다.

### 3. 프로젝트 설정

#### 3.1 Signing & Capabilities
1. Xcode에서 프로젝트 선택
2. "Signing & Capabilities" 탭 선택
3. "Team" 드롭다운에서 Apple Developer Account 선택
4. "Bundle Identifier" 확인: `com.vanta.party`

#### 3.2 앱 아이콘 및 스플래시 화면
1. `ios/App/App/Assets.xcassets` 폴더에서:
   - `AppIcon`: 앱 아이콘 이미지 추가
   - `Splash`: 스플래시 화면 이미지 추가

필요한 아이콘 크기:
- 1024x1024 (App Store)
- 180x180, 120x120, 87x87, 80x80, 76x76, 60x60, 58x58, 40x40, 29x29, 20x20

**아이콘 생성 도구**: [appicon.co](https://appicon.co)

#### 3.3 Info.plist 설정

`ios/App/App/Info.plist`에 추가:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>railway.app</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### 4. 테스트 빌드 (시뮬레이터)

1. Xcode 상단에서 시뮬레이터 선택 (예: iPhone 15 Pro)
2. `Cmd + R` 또는 재생 버튼 클릭
3. 앱이 시뮬레이터에서 실행됨

### 5. 실제 기기 테스트

1. iPhone을 Mac에 USB로 연결
2. Xcode 상단에서 연결된 기기 선택
3. `Cmd + R` 실행
4. iPhone에서 "설정" → "일반" → "VPN 및 기기 관리" → 개발자 앱 신뢰

### 6. App Store Connect 설정

#### 6.1 앱 등록
1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. "나의 앱" → "+" → "새로운 앱"
3. 정보 입력:
   - 플랫폼: iOS
   - 이름: Vanta Party
   - 기본 언어: 한국어
   - 번들 ID: com.vanta.party
   - SKU: vanta-party (고유값)

#### 6.2 앱 정보 작성
- 앱 카테고리: 소셜 네트워킹 또는 엔터테인먼트
- 스크린샷 (필수):
  - 6.7" (iPhone 15 Pro Max): 최소 3개
  - 크기: 1290 x 2796 픽셀
- 앱 설명 작성
- 키워드
- 지원 URL
- 개인정보 보호정책 URL

### 7. Archive 및 업로드

#### 7.1 Archive 생성
1. Xcode 상단에서 "Any iOS Device (arm64)" 선택
2. Menu → Product → Archive
3. Archive 완료될 때까지 대기 (5-10분)

#### 7.2 App Store Connect에 업로드
1. Organizer 창이 자동으로 열림
2. 최신 Archive 선택
3. "Distribute App" 클릭
4. "App Store Connect" 선택
5. "Upload" 선택
6. Signing 옵션 확인 후 "Upload"
7. 업로드 완료될 때까지 대기 (10-30분)

#### 7.3 TestFlight 베타 테스트 (선택사항)
1. App Store Connect → TestFlight 탭
2. 빌드가 처리될 때까지 대기 (30분~2시간)
3. "내부 테스트" 또는 "외부 테스트" 그룹 생성
4. 테스터 초대 (이메일)
5. 테스터가 TestFlight 앱에서 다운로드

#### 7.4 심사 제출
1. App Store Connect → "나의 앱" → Vanta Party
2. "준비 중인 제출" 버전 선택
3. 빌드 선택
4. 나머지 정보 작성 완료
5. "심사를 위해 제출" 클릭
6. 심사 대기 (평균 1-3일)

---

## Android 앱 빌드 및 배포

### 1. 사전 준비

- Android Studio 설치 ([다운로드](https://developer.android.com/studio))
- Java JDK 17 설치
- Google Play Console Account 가입 ($25 일회성)

### 2. Android Studio에서 프로젝트 열기

```bash
npx cap open android
```

Android Studio가 자동으로 열립니다.

### 3. 프로젝트 설정

#### 3.1 앱 아이콘 및 스플래시 화면

**앱 아이콘**:
1. Android Studio에서 `res` 폴더 우클릭
2. New → Image Asset
3. Icon Type: Launcher Icons
4. 이미지 선택 및 생성

**스플래시 화면**:
1. `android/app/src/main/res/drawable/splash.png` 추가
2. 크기: 2732 x 2732 픽셀 (중앙에 로고)

#### 3.2 build.gradle 설정

**`android/app/build.gradle`** 수정:
```gradle
android {
    ...
    defaultConfig {
        applicationId "com.vanta.party"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 4. 서명 키 생성

```bash
# keystore 생성
keytool -genkey -v -keystore vanta-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias vanta-key

# 정보 입력
# 비밀번호 입력 (안전한 곳에 보관!)
# 이름, 조직, 도시 등 입력
```

생성된 `vanta-release-key.jks` 파일을 안전한 곳에 보관하세요.

#### 4.1 서명 설정

**`android/key.properties`** 생성 (`.gitignore`에 추가):
```properties
storePassword=<YOUR_KEYSTORE_PASSWORD>
keyPassword=<YOUR_KEY_PASSWORD>
keyAlias=vanta-key
storeFile=vanta-release-key.jks
```

**`android/app/build.gradle`** 수정:
```gradle
// 파일 상단에 추가
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...

    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 5. Release APK/AAB 빌드

```bash
cd android

# AAB (App Bundle) 생성 - Play Store용 (권장)
./gradlew bundleRelease

# 또는 APK 생성 - 직접 배포용
./gradlew assembleRelease
```

빌드 결과:
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### 6. Google Play Console 설정

#### 6.1 앱 등록
1. [Google Play Console](https://play.google.com/console) 접속
2. "앱 만들기" 클릭
3. 정보 입력:
   - 앱 이름: Vanta Party
   - 기본 언어: 한국어
   - 앱 또는 게임: 앱
   - 무료 또는 유료: 무료

#### 6.2 앱 콘텐츠 설정
좌측 메뉴에서 다음 항목 완료:
- **앱 액세스 권한**: 모든 기능에 액세스 가능 여부
- **광고**: 광고 포함 여부
- **콘텐츠 등급**: 설문조사 작성 (모든 연령)
- **타겟층 및 콘텐츠**: 어린이 대상 여부
- **개인정보처리방침**: URL 입력 필수

#### 6.3 스토어 등록정보
- 앱 이름
- 간단한 설명 (80자)
- 자세한 설명 (4000자)
- 앱 아이콘 (512 x 512 PNG)
- 스크린샷 (최소 2개):
  - 전화: 1080 x 1920 ~ 1080 x 2400
- 그래픽 이미지 (1024 x 500)

### 7. 프로덕션 트랙에 업로드

#### 7.1 내부 테스트 (선택사항)
1. "테스트" → "내부 테스트" 선택
2. "새 버전 만들기"
3. AAB 파일 업로드
4. 버전 이름: 1.0.0
5. 출시 노트 작성
6. "검토" → "출시 시작"
7. 테스터 목록에 이메일 추가

#### 7.2 프로덕션 출시
1. "프로덕션" 탭 선택
2. "새 버전 만들기"
3. AAB 파일 업로드
4. 버전 정보 작성
5. "검토" → "프로덕션으로 출시"
6. 심사 대기 (평균 1-7일)

---

## PWA 배포 (선택사항)

모바일 앱 외에 PWA(Progressive Web App)로도 배포 가능합니다.

### 1. Vite PWA 플러그인 설치

```bash
cd myapp-frontend
npm install vite-plugin-pwa -D
```

### 2. vite.config.js 수정

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Vanta Party',
        short_name: 'Vanta',
        description: "Say's Halloween Party Management",
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

### 3. 아이콘 추가

`myapp-frontend/public/` 폴더에:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

### 4. Vercel에 배포

```bash
npm install -g vercel
cd myapp-frontend
vercel --prod
```

---

## 환경 변수 설정

### 백엔드 환경 변수 (Railway)

```bash
DATABASE_URL=postgresql://postgres:<PASSWORD>@db.vawhihblhegdinrsgjer.supabase.co:5432/postgres
ENVIRONMENT=production
SECRET_KEY=<STRONG_RANDOM_KEY_32_CHARS>
JWT_SECRET_KEY=<STRONG_RANDOM_KEY_32_CHARS>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Capacitor 앱과 웹 모두 허용
ALLOWED_ORIGINS=capacitor://localhost,http://localhost,https://localhost,https://*.vercel.app

BANK_NAME=우리은행
BANK_ACCOUNT_NUMBER=1002-83863-3924
BANK_ACCOUNT_HOLDER=받는분
PAYMENT_AMOUNT=25000

ADMIN_USER_IDS=8
```

### 프론트엔드 환경 변수

**`.env.production`** (모바일 앱용):
```bash
VITE_API_URL=https://myapp-backend-production.up.railway.app
```

---

## 배포 후 확인

### 1. 백엔드 헬스 체크

```bash
curl https://your-backend-url.railway.app/health
```

예상 응답:
```json
{
  "status": "ok",
  "service": "vanta-backend"
}
```

### 2. 모바일 앱 테스트

#### iOS
1. TestFlight에서 다운로드
2. 회원가입 플로우 테스트
3. 파티 참가 테스트
4. 관리자 승인 기능 테스트

#### Android
1. 내부 테스트 트랙에서 다운로드
2. 동일한 테스트 진행

### 3. 체크리스트

- [ ] 회원가입 완료
- [ ] 로그인/로그아웃
- [ ] 파티 참가 신청
- [ ] 관리자 승인/거절
- [ ] 쿠폰 조회 및 사용
- [ ] 네트워크 오류 처리
- [ ] 오프라인 대응 (필요시)

---

## 앱 스토어 제출 체크리스트

### iOS App Store

- [ ] 앱 이름 및 설명 작성
- [ ] 스크린샷 추가 (6.7", 6.5", 5.5")
- [ ] 앱 아이콘 (1024x1024)
- [ ] 개인정보 보호정책 URL
- [ ] 지원 URL
- [ ] 연령 등급 설정
- [ ] Archive 업로드 완료
- [ ] TestFlight 테스트 완료
- [ ] 심사 제출

### Google Play Store

- [ ] 앱 이름 및 설명 작성
- [ ] 스크린샷 추가 (최소 2개)
- [ ] 앱 아이콘 (512x512)
- [ ] 그래픽 이미지 (1024x500)
- [ ] 개인정보처리방침 URL
- [ ] 콘텐츠 등급 설정
- [ ] AAB 파일 업로드
- [ ] 내부 테스트 완료
- [ ] 프로덕션 출시

---

## 업데이트 배포

### 1. 코드 수정 후

```bash
cd myapp-frontend

# 버전 업데이트 (package.json)
npm version patch  # 1.0.0 → 1.0.1
# 또는
npm version minor  # 1.0.0 → 1.1.0
# 또는
npm version major  # 1.0.0 → 2.0.0

# 빌드
npm run build
npx cap sync
```

### 2. iOS 업데이트

1. Xcode에서 버전 업데이트:
   - Version: 1.1.0
   - Build: 2 (증가)
2. Archive 생성
3. App Store Connect 업로드
4. TestFlight 테스트
5. 심사 제출

### 3. Android 업데이트

**`android/app/build.gradle`** 수정:
```gradle
defaultConfig {
    versionCode 2          // 1씩 증가
    versionName "1.1.0"    // Semantic versioning
}
```

빌드 및 업로드:
```bash
cd android
./gradlew bundleRelease
```

Google Play Console에서 새 버전 업로드.

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
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

3. **Railway 재배포**:
```bash
railway up
```

---

## 모니터링 및 로그

### Railway 로그

```bash
railway logs
```

또는 Railway Dashboard → Deployments → Logs

### 앱 크래시 모니터링

#### iOS - Crashlytics
```bash
npm install @capacitor-firebase/crashlytics
npx cap sync
```

#### Android - Crashlytics
Firebase Console에서 설정 후 `google-services.json` 추가.

### Sentry 통합 (선택사항)

```bash
cd myapp-backend
pip install sentry-sdk[fastapi]
```

`main.py`:
```python
import sentry_sdk

sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    environment="production"
)
```

---

## 데이터베이스 백업

### Supabase 자동 백업

Supabase는 일일 자동 백업을 수행합니다.

### 수동 백업

```bash
PGPASSWORD=<password> pg_dump -h db.vawhihblhegdinrsgjer.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

---

## 성능 최적화

### 백엔드

1. **Gunicorn Worker 수 조정**:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

2. **Connection Pooling**:
```python
# database.py
pool_size=10,
max_overflow=20
```

### 모바일 앱

1. **이미지 최적화**: WebP 포맷 사용
2. **Code Splitting**: React.lazy() 사용
3. **Capacitor 플러그인 최적화**: 불필요한 플러그인 제거

---

## 트러블슈팅

### iOS 빌드 오류

**오류**: "Signing certificate not found"
**해결**: Xcode → Preferences → Accounts → Download Manual Profiles

**오류**: "The bundle identifier is already in use"
**해결**: Bundle ID 변경 (com.vanta.party → com.yourcompany.vanta)

### Android 빌드 오류

**오류**: "Could not find or load main class org.gradle.wrapper.GradleWrapperMain"
**해결**:
```bash
cd android
./gradlew wrapper --gradle-version 8.0
```

### 네트워크 오류

**iOS**: `Info.plist`에 `NSAppTransportSecurity` 설정 확인
**Android**: `AndroidManifest.xml`에 `INTERNET` 권한 확인

---

## 긴급 상황 대응

### 앱 크래시 시

1. Crashlytics 또는 Sentry 로그 확인
2. TestFlight/내부 테스트로 긴급 패치 배포
3. 핫픽스 버전 제출

### 서버 다운 시

1. Railway 로그 확인
2. 데이터베이스 연결 확인
3. 필요시 롤백:
```bash
railway rollback
```

---

## 추가 권장 사항

1. **CI/CD 파이프라인**: GitHub Actions로 자동 빌드
2. **Feature Flags**: 기능을 단계적으로 출시
3. **A/B 테스팅**: Firebase Remote Config 사용
4. **Push Notifications**: Firebase Cloud Messaging 통합
5. **Analytics**: Firebase Analytics 또는 Mixpanel
6. **Deep Linking**: 초대 링크 구현

---

## 비용 예상

- **Apple Developer**: $99/년
- **Google Play Console**: $25 (일회성)
- **Railway**: ~$5-20/월 (사용량에 따라)
- **Supabase**: 무료 (현재 사용량)
- **도메인**: ~$10-15/년 (선택사항)

**총 초기 비용**: ~$140
**월간 유지 비용**: ~$5-20

---

## 도움말 및 참고 자료

- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [iOS App Store 심사 가이드라인](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play 정책](https://play.google.com/console/about/guides/releasewithconfidence/)
- [Railway 문서](https://docs.railway.app)
- [Supabase 문서](https://supabase.com/docs)

---

**앱 출시 성공을 기원합니다! 🚀📱**
