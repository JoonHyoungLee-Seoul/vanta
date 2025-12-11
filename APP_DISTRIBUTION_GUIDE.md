# App Distribution Guide

This guide explains how to distribute the Vanta Party app so people can download it directly on their iPhones and Android devices.

---

## 📱 iOS Distribution Options

### Option 1: TestFlight (Recommended - Easiest & Free)

**Best for:** Distributing to up to 10,000 testers without App Store approval

#### Prerequisites
- Apple Developer Account ($99/year) - Required for TestFlight
- Xcode installed on macOS

#### Steps

1. **Build and Archive the App**
   ```bash
   cd myapp-frontend
   npm run build
   npx cap sync ios
   npx cap open ios
   ```

2. **In Xcode:**
   - Select **Product > Scheme > App**
   - Select **Any iOS Device** (not a simulator)
   - Go to **Product > Archive**
   - Wait for archive to complete

3. **Upload to App Store Connect:**
   - In the Organizer window, click **Distribute App**
   - Select **App Store Connect**
   - Choose **Upload**
   - Follow the prompts to upload

4. **Set up TestFlight:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Navigate to **My Apps** > **Vanta Party** > **TestFlight**
   - Wait for processing (usually 10-30 minutes)
   - Add internal testers (up to 100) or external testers (up to 10,000)
   - Send invitation emails or share a public link

5. **Share with Users:**
   - Users need to install **TestFlight** app from App Store
   - Send them the invitation link or have them enter the code
   - They can download and install directly

**TestFlight Links:**
- Internal Testers: Instant access
- External Testers: Requires App Review (usually 24-48 hours, but simpler than full App Store review)

---

### Option 2: Ad-Hoc Distribution (Limited to 100 Devices)

**Best for:** Small group testing without App Store

#### Steps

1. **Get Device UDIDs:**
   - Users need to provide their iPhone UDID
   - Find UDID: Settings > General > About > Scroll to find UDID
   - Or use [udid.tech](https://udid.tech) - users visit on their iPhone

2. **Register Devices in Apple Developer Portal:**
   - Go to [developer.apple.com](https://developer.apple.com)
   - Certificates, Identifiers & Profiles > Devices
   - Add all device UDIDs

3. **Create Ad-Hoc Provisioning Profile:**
   - In Xcode: Signing & Capabilities
   - Select your Team
   - Choose "Ad-Hoc" distribution
   - Select registered devices

4. **Build and Distribute:**
   - Archive the app in Xcode
   - Distribute > Ad-Hoc
   - Export the .ipa file

5. **Distribute:**
   - Upload .ipa to a file hosting service (Dropbox, Google Drive, etc.)
   - Users download and install via iTunes/Finder or using a service like [Diawi](https://www.diawi.com)

**Note:** Ad-Hoc builds expire after 1 year and are limited to 100 devices.

---

### Option 3: App Store (Full Distribution)

**Best for:** Public distribution to unlimited users

Follow the TestFlight steps, but instead of TestFlight:
- Complete App Store listing (screenshots, description, etc.)
- Submit for App Review
- Once approved, app is available to everyone

---

## 🤖 Android Distribution Options

### Option 1: Direct APK Download (Easiest - No Account Needed)

**Best for:** Quick distribution to any number of users

#### Steps

1. **Build Release APK:**
   ```bash
   cd myapp-frontend
   npm run build
   npx cap sync android
   cd android
   ./gradlew assembleRelease
   ```

2. **Find the APK:**
   - Location: `android/app/build/outputs/apk/release/app-release.apk`

3. **Sign the APK (Required for installation):**
   ```bash
   # Generate a keystore (first time only)
   keytool -genkey -v -keystore vanta-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias vanta-key
   
   # Sign the APK
   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore vanta-release-key.jks app-release.apk vanta-key
   
   # Align the APK
   zipalign -v 4 app-release-unsigned.apk app-release.apk
   ```

   Or use Android Studio:
   - Build > Generate Signed Bundle / APK
   - Select APK
   - Create new keystore or use existing
   - Build release APK

4. **Distribute the APK:**
   - Upload to file hosting (Google Drive, Dropbox, your website)
   - Share the download link
   - Users download and install directly

5. **User Installation:**
   - Users need to enable "Install from Unknown Sources" in Android settings
   - Download the APK
   - Tap to install

**Security Note:** Users will see a warning about installing from unknown sources. This is normal for direct APK distribution.

---

### Option 2: Google Play Store Internal Testing (Free)

**Best for:** Distribution to up to 100 testers with Google Play infrastructure

#### Prerequisites
- Google Play Developer Account ($25 one-time fee)

#### Steps

1. **Build Signed APK or AAB:**
   ```bash
   cd android
   ./gradlew bundleRelease  # Creates .aab file (recommended)
   # or
   ./gradlew assembleRelease  # Creates .apk file
   ```

2. **Upload to Google Play Console:**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Create app listing
   - Upload APK/AAB in Internal Testing track
   - Add testers by email or create a testing link

3. **Share Testing Link:**
   - Google Play provides a testing link
   - Share with users
   - They can install directly from Play Store (but app won't be publicly searchable)

---

### Option 3: Google Play Store (Full Distribution)

**Best for:** Public distribution to unlimited users

- Complete app listing
- Upload APK/AAB
- Submit for review
- Once approved, available to everyone on Play Store

---

## 🚀 Quick Start: Direct Distribution

### For iOS (TestFlight - Recommended)

1. **Archive in Xcode:**
   ```bash
   cd myapp-frontend
   npm run build
   npx cap sync ios
   npx cap open ios
   ```
   - In Xcode: Product > Archive
   - Distribute > App Store Connect > Upload

2. **Set up TestFlight:**
   - App Store Connect > TestFlight
   - Add testers and share link

### For Android (Direct APK)

1. **Build and Sign APK:**
   ```bash
   cd myapp-frontend
   npm run build
   npx cap sync android
   cd android
   ./gradlew assembleRelease
   ```

2. **Find APK:**
   - `android/app/build/outputs/apk/release/app-release.apk`

3. **Upload and Share:**
   - Upload to Google Drive/Dropbox/your website
   - Share download link

---

## 📋 Distribution Checklist

### Before Distribution

- [ ] App is tested and working
- [ ] Backend API URL is set to production
- [ ] App version number is updated
- [ ] App icon and splash screen are set
- [ ] App name and bundle ID are correct

### iOS Specific

- [ ] Apple Developer Account active
- [ ] App signed with distribution certificate
- [ ] TestFlight or App Store listing prepared
- [ ] Privacy policy URL (required for App Store)

### Android Specific

- [ ] APK is signed with release keystore
- [ ] Keystore file is backed up securely
- [ ] App permissions are properly declared
- [ ] Target SDK version is up to date

---

## 🔗 Helpful Services

### For iOS Distribution

- **TestFlight**: Built into App Store Connect (free with Developer account)
- **Diawi**: [diawi.com](https://www.diawi.com) - Upload .ipa for direct download
- **App Store Connect**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)

### For Android Distribution

- **Google Play Console**: [play.google.com/console](https://play.google.com/console)
- **APK Mirror**: For hosting APKs (if you want a public mirror)
- **Firebase App Distribution**: Free alternative for beta testing

---

## 📝 Notes

### iOS
- TestFlight builds expire after 90 days (but auto-renew)
- Ad-Hoc builds expire after 1 year
- App Store builds don't expire

### Android
- APK files can be installed indefinitely
- Google Play requires app updates every 90 days to stay active
- Direct APK distribution bypasses Play Store but requires user trust

---

## 🆘 Troubleshooting

### iOS: "Unable to Install"
- Check device UDID is registered (for Ad-Hoc)
- Verify TestFlight invitation was accepted
- Ensure device has enough storage

### Android: "App not installed"
- Check if APK is properly signed
- Verify "Install from Unknown Sources" is enabled
- Check device storage space
- Try uninstalling previous version first

### Both: App crashes on launch
- Verify backend API URL is accessible
- Check network permissions are granted
- Review app logs in Xcode/Android Studio

---

## 📞 Support

For issues with distribution:
- iOS: [Apple Developer Support](https://developer.apple.com/support/)
- Android: [Google Play Developer Support](https://support.google.com/googleplay/android-developer)

