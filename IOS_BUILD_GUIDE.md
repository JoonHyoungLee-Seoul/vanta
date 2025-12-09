# iOS Build Guide

This guide explains how to build and run the Vanta Party app on iOS.

## Prerequisites

1. **macOS** - iOS development requires macOS
2. **Xcode** - Install from the Mac App Store (version 14.0 or later recommended)
3. **Xcode Command Line Tools** - Install by running:
   ```bash
   xcode-select --install
   ```
4. **CocoaPods** (if not already installed):
   ```bash
   sudo gem install cocoapods
   ```

## Project Structure

The iOS app is located in `myapp-frontend/ios/`. The project uses Capacitor to wrap the React web app in a native iOS container.

## Building the iOS App

### 1. Configure API URL

The app needs to know where your backend API is located. For iOS, you cannot use `localhost` - you need to use your actual backend URL.

**Option A: Using Environment Variable (Recommended)**

Create a `.env` file in `myapp-frontend/` with your backend URL:

```bash
VITE_API_URL=https://your-backend-url.com
# or for local development on same network:
# VITE_API_URL=http://192.168.1.XXX:8000  # Replace with your Mac's local IP
```

**Option B: Update client.js directly**

Edit `myapp-frontend/src/api/client.js` and change the default API URL:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.com';
```

### 2. Build the Web App

Before opening in Xcode, build the React app:

```bash
cd myapp-frontend
npm run build
```

### 3. Sync Capacitor

Sync the built files to the iOS project:

```bash
npx cap sync ios
```

### 4. Open in Xcode

```bash
npx cap open ios
```

Or manually open:
```bash
open ios/App/App.xcodeproj
```

### 5. Configure Signing & Capabilities

In Xcode:

1. Select the **App** target in the project navigator
2. Go to **Signing & Capabilities** tab
3. Select your **Team** (you need an Apple Developer account)
4. Xcode will automatically manage your provisioning profile

**Note**: For development, you can use a free Apple ID. For App Store distribution, you need a paid Apple Developer account ($99/year).

### 6. Select a Device or Simulator

- **Simulator**: Choose any iOS simulator from the device dropdown
- **Physical Device**: Connect your iPhone/iPad via USB and select it

### 7. Build and Run

Click the **Play** button (▶️) or press `Cmd + R` to build and run the app.

## Development Workflow

When you make changes to the React app:

1. **Make your changes** in `myapp-frontend/src/`
2. **Build the app**:
   ```bash
   cd myapp-frontend
   npm run build
   ```
3. **Sync to iOS**:
   ```bash
   npx cap sync ios
   ```
4. **Reload in Xcode** - The app will automatically reload if you're using a simulator, or rebuild in Xcode

## Testing on Physical Device

1. Connect your iPhone/iPad via USB
2. In Xcode, select your device from the device dropdown
3. You may need to trust your developer certificate on the device:
   - Go to Settings > General > VPN & Device Management
   - Trust your developer certificate
4. Build and run from Xcode

## App Configuration

### App Name and Bundle ID

The app is configured with:
- **App Name**: Vanta Party
- **Bundle ID**: com.vanta.party

To change these, edit `myapp-frontend/capacitor.config.ts` and then run:
```bash
npx cap sync ios
```

### Network Security

The app is configured to allow HTTP connections (for development). For production, you should:
1. Use HTTPS for your backend API
2. Update `Info.plist` to remove `NSAllowsArbitraryLoads` and configure specific domains

## Troubleshooting

### Build Errors

- **"No such module 'Capacitor'"**: Run `npx cap sync ios` to update dependencies
- **Signing errors**: Make sure you've selected a Team in Xcode's Signing & Capabilities
- **Network errors**: Check that your API URL is correct and accessible from the device/simulator

### API Connection Issues

- **localhost doesn't work**: Use your Mac's local IP address (find it with `ifconfig` or `ipconfig getifaddr en0`)
- **CORS errors**: Make sure your backend allows requests from the iOS app origin
- **HTTPS required**: iOS requires HTTPS for production. Use HTTP only for development.

### Simulator Issues

- If the app doesn't load, try:
  ```bash
  npx cap sync ios
  ```
  Then rebuild in Xcode

## Building for App Store

1. **Archive the app**:
   - In Xcode: Product > Archive
   - Wait for the archive to complete

2. **Distribute**:
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the prompts to upload

3. **Submit for Review**:
   - Go to App Store Connect
   - Complete app information, screenshots, etc.
   - Submit for review

## Additional Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [Apple Developer Portal](https://developer.apple.com/)

