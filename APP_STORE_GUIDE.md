# MUZE — App Store Submission Guide
**App Name:** MUZE – Music You Feel  
**Bundle ID / App ID:** `com.muzemusic.app`  
**Version:** 1.0.0  
**Last Updated:** April 19, 2026

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Build the Web App First](#2-build-the-web-app-first)
3. [Sync Capacitor](#3-sync-capacitor)
4. [iOS — Apple App Store](#4-ios--apple-app-store)
5. [Android — Google Play Store](#5-android--google-play-store)
6. [App Store Metadata (Both)](#6-app-store-metadata-both)
7. [After Submission](#7-after-submission)
8. [Updating the App Post-Launch](#8-updating-the-app-post-launch)
9. [Common Errors & Fixes](#9-common-errors--fixes)

---

## 1. Prerequisites

### Tools You Must Install

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| Xcode (macOS only) | 15+ | Mac App Store |
| Android Studio | Latest | https://developer.android.com/studio |
| JDK | 17+ | https://www.oracle.com/java/technologies/downloads/ |
| CocoaPods | Latest | `sudo gem install cocoapods` |

### Accounts You Must Have

| Account | Cost | URL |
|---------|------|-----|
| Apple Developer Account | $99/year | https://developer.apple.com/programs/ |
| Google Play Developer Account | $25 one-time | https://play.google.com/console |

---

## 2. Build the Web App First

Every Capacitor build starts with a fresh web build. **Always run this before any native build.**

```bash
cd /home/user/workspace/muze

# Install dependencies (first time only)
npm install

# Build the web app → outputs to dist/public/
npm run build
```

Verify the build succeeded — `dist/public/index.html` should exist.

---

## 3. Sync Capacitor

After every web build, sync the output into the native iOS/Android projects:

```bash
cd /home/user/workspace/muze

# Syncs dist/public into ios/App/App/public and android/app/src/main/assets/public
npx cap sync
```

This also updates native plugins. Run this every time you update JavaScript code.

---

## 4. iOS — Apple App Store

### Step 1: Add the iOS Platform (First Time Only)

```bash
cd /home/user/workspace/muze
npx cap add ios
```

This creates an `ios/` directory with an Xcode project.

### Step 2: Install CocoaPods Dependencies

```bash
cd /home/user/workspace/muze/ios/App
pod install
```

### Step 3: Open in Xcode

```bash
cd /home/user/workspace/muze
npx cap open ios
```

### Step 4: Configure App in Xcode

Inside Xcode, click on the **App** project in the left panel, then select the **App** target:

1. **General tab:**
   - Display Name: `MUZE`
   - Bundle Identifier: `com.muzemusic.app`
   - Version: `1.0.0`
   - Build: `1`
   - Deployment Info → Minimum iOS: `14.0`
   - Supported Destinations: iPhone, iPad

2. **Signing & Capabilities tab:**
   - Team: Select your Apple Developer team
   - Automatically manage signing: ✅ ON
   - Check: Push Notifications capability is added (for future use)

3. **App Icons:**
   - Copy all files from `mobile-assets/ios/` into Xcode's `Assets.xcassets/AppIcon.appiconset/`
   - Or drag-and-drop the entire `AppIcon.appiconset` folder

### Step 5: Add Privacy Descriptions (Required by Apple)

In Xcode, open `ios/App/App/Info.plist` and add:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>MUZE needs microphone access for audio features.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>MUZE needs photo access to set your profile picture.</string>
<key>NSCameraUsageDescription</key>
<string>MUZE needs camera access for profile photos.</string>
```

### Step 6: Test on Simulator

In Xcode: Select a simulator (iPhone 15 Pro recommended) → Press **Run (▶)**.

Check:
- [ ] App launches without crash
- [ ] Music player works
- [ ] All pages navigate correctly
- [ ] Login/Register flow works
- [ ] Payment checkout shows correct handles

### Step 7: Archive for App Store

1. In Xcode: **Product → Archive**
2. Wait for archive to complete (5–10 minutes)
3. Xcode Organizer opens automatically
4. Click **Distribute App**
5. Select **App Store Connect** → Next
6. Select **Upload** → Next
7. Leave all checkboxes default → Next
8. Review → **Upload**

### Step 8: Submit in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - Platform: iOS
   - Name: `MUZE – Music You Feel`
   - Primary Language: English (U.S.)
   - Bundle ID: `com.muzemusic.app`
   - SKU: `muzemusic001`
   - User Access: Full Access
4. Go to **App Information** → set:
   - Category: **Music**
   - Secondary Category: **Entertainment**
   - Content Rights: Check if you own the music rights
   - Age Rating: **4+**
5. Go to **Pricing** → Free (with in-app purchases) or set a price
6. Upload screenshots (see Section 6 for specs)
7. Fill in description, keywords, support URL
8. Select the build you uploaded in Step 7
9. Click **Submit for Review**

**Apple review time:** Typically 1–3 business days.

---

## 5. Android — Google Play Store

### Step 1: Add the Android Platform (First Time Only)

```bash
cd /home/user/workspace/muze
npx cap add android
```

This creates an `android/` directory with an Android Studio project.

### Step 2: Open in Android Studio

```bash
cd /home/user/workspace/muze
npx cap open android
```

### Step 3: Configure the App

In Android Studio, open `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        applicationId "com.muzemusic.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Step 4: Copy App Icons

1. Open Android Studio's **Resource Manager** (View → Tool Windows → Resource Manager)
2. Click the **+** → **Import Drawables**
3. Or manually copy from `mobile-assets/android/` into `android/app/src/main/res/`:
   ```
   mipmap-mdpi/ic_launcher.png
   mipmap-hdpi/ic_launcher.png
   mipmap-xhdpi/ic_launcher.png
   mipmap-xxhdpi/ic_launcher.png
   mipmap-xxxhdpi/ic_launcher.png
   (repeat for ic_launcher_round and ic_launcher_foreground)
   ```

### Step 5: Add App Permissions

In `android/app/src/main/AndroidManifest.xml`, ensure these are present:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

### Step 6: Test on Emulator / Device

In Android Studio:
- Select an emulator (Pixel 7, API 34 recommended) → **Run (▶)**
- Or connect a real Android device with USB debugging on

Check same items as iOS checklist above.

### Step 7: Generate a Signed APK / AAB

Android Play Store requires an **AAB (Android App Bundle)**:

1. In Android Studio: **Build → Generate Signed Bundle/APK**
2. Select **Android App Bundle** → Next
3. Create a new keystore (or use existing):
   - Key store path: Save to a safe location — **you need this forever**
   - Alias: `muze-key`
   - Password: Use a strong password, **write it down securely**
4. Click **Next** → Select **release** build variant → **Finish**
5. AAB file is created at `android/app/release/app-release.aab`

⚠️ **CRITICAL:** Back up your keystore file and passwords. If you lose them, you cannot update the app on Google Play.

### Step 8: Submit to Google Play Console

1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - App name: `MUZE – Music You Feel`
   - Default language: English (United States)
   - App or game: **App**
   - Free or paid: Choose based on your model
4. Complete the setup checklist:
   - **App access:** All functionality accessible
   - **Ads:** Does not contain ads (unless you add ads later)
   - **Content rating:** Complete the questionnaire → Music app
   - **Target audience:** 13+ (due to payments)
   - **Data safety:** Fill in what data you collect (email, name, phone, music preferences)
5. Go to **Production → Create new release**
6. Upload the `.aab` file
7. Add release notes: "MUZE – Music You Feel. Stream and download music."
8. **Review and roll out to production**

**Google Play review time:** Typically 1–7 business days for first submission.

---

## 6. App Store Metadata (Both Stores)

### App Name
```
MUZE – Music You Feel
```

### Short Description (Google Play, 80 chars max)
```
Stream & download exclusive music. R&B, Trap, Gospel, Hip-Hop, and more.
```

### Full Description
```
MUZE is your personal music experience. Stream and purchase exclusive tracks 
across 13 genres including R&B, Trap, Hip-Hop, Gospel, Neo Soul, Drill, 
Afrobeats, Jazz, Reggae, Lo-Fi, Pop, Soul, and Christian Worship.

FEATURES:
• Stream 26+ tracks across 13 genres
• Buy songs for $0.99–$2.49 or full albums
• Send music as a gift to friends
• AI Mood DJ — music matched to your vibe
• Smart Playlists — auto-organized by your listening
• Listening Party — stream music together with friends in real-time
• Advanced Equalizer with genre presets
• Artist accounts with secure verification
• Support artists directly — 60% goes straight to the creator

PAYMENTS:
Simple and transparent. Pay via Cash App ($MUZEmusic) or Zelle 
(payments@muze.music). Secure, simple, artist-first.

MUZE — Music You Feel.
```

### Keywords (Apple App Store, comma-separated)
```
music, stream, R&B, trap, gospel, hip-hop, neo soul, playlist, download, artist, 
beats, afrobeats, jazz, reggae, lo-fi, independent music, music app
```

### Category
- Primary: **Music**
- Secondary: **Entertainment**

### Screenshot Sizes Required

**iOS (App Store):**
| Device | Size |
|--------|------|
| iPhone 6.9" (iPhone 15 Pro Max) | 1320 × 2868 px |
| iPhone 6.5" (iPhone 14 Plus) | 1284 × 2778 px |
| iPhone 5.5" | 1242 × 2208 px |
| iPad Pro 12.9" (optional) | 2048 × 2732 px |

**Android (Google Play):**
| Type | Size |
|------|------|
| Phone screenshots | 1080 × 1920 px minimum |
| 7" Tablet (optional) | 1200 × 1920 px |

**How to take screenshots:**
- iOS: Run in Xcode simulator → Device → iPhone 15 Pro Max → `Cmd+S`
- Android: Run in Android Studio emulator → Screenshot button in toolbar

### App Icon Specs
- **iOS:** 1024×1024 PNG (no transparency, no rounded corners — Apple adds them)
  - File: `mobile-assets/ios/icon-1024.png`
- **Android:** 512×512 PNG
  - File: `mobile-assets/android/mipmap-xxxhdpi/ic_launcher.png`

### Age Rating
- **Apple:** 4+ (no objectionable content)
- **Google Play:** Teen (13+) — due to payment features

### Privacy Policy URL
You need a privacy policy URL. Options:
1. Host a simple privacy policy page (can be a Google Doc published to web)
2. Use a privacy policy generator: https://www.privacypolicygenerator.info
3. Add a `/privacy` route to the MUZE web app

**Minimum required disclosures:**
- What data you collect (name, email, phone, music preferences, payment references)
- How you use it (account management, payment processing)
- That you use Cash App / Zelle for payments
- Contact email for privacy requests

---

## 7. After Submission

### Apple App Store Timeline
| Stage | Duration |
|-------|----------|
| Processing (after upload) | 15–60 minutes |
| In Review | 1–3 business days |
| Approved → Live | Immediate or up to 24h |

### Google Play Timeline
| Stage | Duration |
|-------|----------|
| Upload processing | 1–2 hours |
| Review | 1–7 business days |
| Published | Immediate after approval |

### If Rejected

**Apple common rejections for music apps:**
- Missing privacy descriptions in Info.plist → add them (Section 4, Step 5)
- In-app purchases not using Apple IAP → for digital goods, Apple requires their payment system. Cash App/Zelle is only allowed for physical goods or artist tips. **See note below.**
- Missing privacy policy URL

⚠️ **Important note on payments:** Apple's guidelines (Guideline 3.1.1) require that digital downloads sold inside an iOS app use Apple's In-App Purchase system. Cash App/Zelle direct payments are permitted for:
- Physical merchandise
- Real-world services
- Tips/donations to artists (with proper disclosure)

For full compliance, consider framing purchases as "artist support" or "tip" rather than "download purchase" — or explore adding Apple IAP alongside the existing payment methods.

**Google Play** is more lenient — external payment methods are allowed under their alternative billing policy.

---

## 8. Updating the App Post-Launch

Every update follows this exact sequence:

```bash
# 1. Make your code changes in client/ or server/

# 2. Rebuild the web app
cd /home/user/workspace/muze
npm run build

# 3. Sync to native projects
npx cap sync

# 4. Bump version numbers
# iOS: Xcode → App target → General → Version + Build number
# Android: android/app/build.gradle → versionCode + versionName

# 5. Open native IDE and create a new release
npx cap open ios      # Xcode → Product → Archive → Distribute
npx cap open android  # Build → Generate Signed Bundle

# 6. Submit update in App Store Connect / Play Console
# iOS: Select new build in App Store Connect → Submit for Review
# Android: Play Console → Production → Create new release → Upload AAB
```

### Version Numbering Convention
- `1.0.0` — Initial launch
- `1.0.1` — Bug fixes only
- `1.1.0` — New features, no breaking changes
- `2.0.0` — Major redesign or breaking changes

---

## 9. Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `No profiles for 'com.muzemusic.app'` | Signing not configured | Xcode → Signing tab → Select your team |
| `Pod install failed` | CocoaPods out of date | `sudo gem update cocoapods && pod install` |
| `Gradle build failed` | Android SDK not set up | Android Studio → SDK Manager → Install API 34 |
| `cap sync` fails | Cap CLI version mismatch | `npm install @capacitor/cli@latest` |
| White screen on device | API URL wrong in Capacitor context | Check `queryClient.ts` PRODUCTION_API value |
| App rejected (3.1.1) | Payment method issue | Frame as "artist tip/support" or add Apple IAP |
| `keystore not found` | Wrong path to keystore | Use absolute path or put keystore in project root |
| Build fails on `better-sqlite3` | Native module in web bundle | Ensure `better-sqlite3` is server-only, not imported in client |

---

## Quick Reference — All Build Commands

```bash
# Full build pipeline (run every time before native build)
cd /home/user/workspace/muze
npm run build           # Build web → dist/public/
npx cap sync            # Sync web build into native projects

# Open native IDEs
npx cap open ios        # Opens Xcode (macOS only)
npx cap open android    # Opens Android Studio

# Add platforms (first time only)
npx cap add ios
npx cap add android

# Run on connected device from CLI
npx cap run ios
npx cap run android

# Update Capacitor to latest
npm install @capacitor/core@latest @capacitor/ios@latest @capacitor/android@latest
npx cap sync
```

---

*For questions or issues, reference MUZE_MASTER.md — the complete post-launch reference file.*
