import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // ─── App Identity ───────────────────────────────────────────────────────────
  appId: "com.muzemusic.app",           // Unique bundle ID — must match App Store Connect + Google Play
  appName: "MUZE",                       // Display name on device home screen
  webDir: "dist/public",                 // Vite build output folder

  // ─── Server config ──────────────────────────────────────────────────────────
  // In production mobile builds, the app loads from the bundled dist files.
  // Set CAPACITOR_SERVER_URL to your live API for API calls (not page routing).
  server: {
    // Uncomment for live-reload during development:
    // url: "http://YOUR_LOCAL_IP:5000",
    // cleartext: true,  // Android only — allows HTTP in dev

    // Allow navigation within the app
    allowNavigation: [],

    // Android: Use the app's URL scheme instead of file:// for better cookie/storage support
    androidScheme: "https",
  },

  // ─── iOS specific ───────────────────────────────────────────────────────────
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    backgroundColor: "#0a0a0f",          // Match app background (dark)
    // limitsNavigationsToAppBoundDomains: true,  // Restrict to your domain in production
  },

  // ─── Android specific ───────────────────────────────────────────────────────
  android: {
    backgroundColor: "#0a0a0f",
    allowMixedContent: false,            // Security: block HTTP on HTTPS pages
    captureInput: true,
    webContentsDebuggingEnabled: false,  // Set true only in dev builds
    // minSdkVersion: 23,               // Android 6.0+ (covers 99%+ of devices)
    // targetSdkVersion: 35,            // Required by Google Play as of 2025
  },

  // ─── Plugins ────────────────────────────────────────────────────────────────
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a0a0f",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#a855f7",
    },
    StatusBar: {
      style: "Dark",                     // Dark content (light icons) for dark theme
      backgroundColor: "#0a0a0f",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
