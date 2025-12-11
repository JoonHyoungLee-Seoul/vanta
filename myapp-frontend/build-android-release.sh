#!/bin/bash

# Build Android Release APK
# This script builds a release APK that can be distributed directly

set -e

echo "🚀 Building Vanta Party Android Release APK..."

# Navigate to frontend directory
cd "$(dirname "$0")"

# Build web app
echo "📦 Building web app..."
npm run build

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync android

# Build release APK
echo "🔨 Building release APK..."
cd android
./gradlew assembleRelease

# Find the APK
APK_PATH="app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    echo ""
    echo "✅ Build successful!"
    echo "📱 APK location: $(pwd)/$APK_PATH"
    echo ""
    echo "⚠️  Note: This APK is unsigned. For distribution, you need to:"
    echo "   1. Sign the APK with a keystore"
    echo "   2. Or use Android Studio: Build > Generate Signed Bundle / APK"
    echo ""
    echo "To sign the APK, use:"
    echo "   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore your-key.jks $APK_PATH your-key-alias"
else
    echo "❌ Build failed - APK not found"
    exit 1
fi

