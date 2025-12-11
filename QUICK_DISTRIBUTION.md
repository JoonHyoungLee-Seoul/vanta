# Quick Distribution Guide

**Fastest way to get your app into users' hands**

---

## 🍎 iOS: TestFlight (Recommended)

### Step 1: Build & Archive
```bash
cd myapp-frontend
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Select **Any iOS Device** (not simulator)
2. **Product > Archive**
3. Wait for archive to complete

### Step 2: Upload
1. Click **Distribute App**
2. Select **App Store Connect**
3. Choose **Upload**
4. Follow prompts

### Step 3: Set up TestFlight
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps > Vanta Party > TestFlight**
3. Wait 10-30 minutes for processing
4. **Add Testers** (internal or external)
5. Share the TestFlight link

**Users install TestFlight app, then use your link to install your app!**

---

## 🤖 Android: Direct APK Download

### Step 1: Build Release APK
```bash
cd myapp-frontend
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

### Step 2: Sign the APK (Required)

**Option A: Using Android Studio (Easiest)**
1. Open `android` folder in Android Studio
2. **Build > Generate Signed Bundle / APK**
3. Select **APK**
4. Create new keystore (first time) or use existing
5. Build release APK

**Option B: Using Command Line**
```bash
# Generate keystore (first time only)
keytool -genkey -v -keystore vanta-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias vanta-key

# Sign the APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore vanta-release-key.jks app/build/outputs/apk/release/app-release-unsigned.apk vanta-key

# Align
zipalign -v 4 app/build/outputs/apk/release/app-release-unsigned.apk app-release.apk
```

### Step 3: Distribute
1. Find signed APK: `android/app/build/outputs/apk/release/app-release.apk`
2. Upload to:
   - Google Drive
   - Dropbox
   - Your website
   - [Diawi.com](https://www.diawi.com) (for iOS .ipa too)
3. Share the download link

**Users download APK and install directly!**

---

## 📱 User Instructions

### For iOS (TestFlight)
1. Install **TestFlight** from App Store
2. Open the invitation link you sent
3. Tap **Accept** and **Install**
4. App installs automatically

### For Android (Direct APK)
1. Open the download link
2. Download the APK file
3. If prompted, enable **"Install from Unknown Sources"**:
   - Settings > Security > Unknown Sources (enable)
4. Tap the downloaded APK to install
5. Follow installation prompts

---

## ⚡ Quick Commands

```bash
# Build for iOS (then open Xcode)
cd myapp-frontend
npm run ios:sync
npm run ios:open

# Build Android APK
cd myapp-frontend
npm run android:build

# Or use the script
cd myapp-frontend
./build-android-release.sh
```

---

## 🎯 Which Method Should I Use?

| Method | iOS | Android | Users | Cost | Setup Time |
|--------|-----|---------|-------|------|------------|
| **TestFlight** | ✅ | ❌ | 10,000 | $99/year | 30 min |
| **Direct APK** | ❌ | ✅ | Unlimited | Free | 10 min |
| **App Store** | ✅ | ✅ | Unlimited | $99/year | 2-3 days |
| **Play Store** | ❌ | ✅ | Unlimited | $25 once | 1-2 days |

**Recommendation:**
- **iOS**: Use TestFlight (easiest, professional)
- **Android**: Use Direct APK (fastest, no account needed)

---

## 🔐 Security Notes

- **iOS**: TestFlight is secure and trusted by users
- **Android**: Direct APK requires user trust. Consider Google Play for wider distribution later.

---

## 📞 Need Help?

See [APP_DISTRIBUTION_GUIDE.md](./APP_DISTRIBUTION_GUIDE.md) for detailed instructions.

