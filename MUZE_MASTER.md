# MUZE — Master App File
**Version:** 1.0 Post-Launch  
**Last Updated:** April 19, 2026  
**Brand:** MUZE — "Music You Feel"  
**Stack:** Express + Vite + React + Tailwind + shadcn/ui + Drizzle ORM + SQLite (`better-sqlite3`)

---

## Table of Contents
1. [App Overview](#1-app-overview)
2. [Deployed URL & Access](#2-deployed-url--access)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [All Pages & Features](#5-all-pages--features)
6. [Payment System](#6-payment-system)
7. [Artist Account Security](#7-artist-account-security)
8. [Backend API Routes](#8-backend-api-routes)
9. [How to Update the App](#9-how-to-update-the-app)
10. [How to Add New Songs](#10-how-to-add-new-songs)
11. [How to Change Prices](#11-how-to-change-prices)
12. [How to Add a New Page / Feature](#12-how-to-add-a-new-page--feature)
13. [How to Update Payment Handles](#13-how-to-update-payment-handles)
14. [Post-Launch Data Collected](#14-post-launch-data-collected)
15. [Monitoring & Admin](#15-monitoring--admin)
16. [Environment Variables](#16-environment-variables)
17. [Build & Deploy Commands](#17-build--deploy-commands)
18. [Security Summary](#18-security-summary)
19. [Planned Future Updates](#19-planned-future-updates)

---

## 1. App Overview

MUZE is a full-stack music app where artists sell and stream music. Users can:
- Stream and browse 26 songs across 13 genres
- Buy songs ($0.99–$2.49), albums, or send gifts via Cash App / Zelle
- Create artist accounts with email verification + security questions
- Explore features like AI Mood DJ, Equalizer, Listening Party, Smart Playlists, and more

**Revenue Split:** 40% MUZE Platform / 60% Artist (automatically calculated on every payment)

---

## 2. Deployed URL & Access

| Item | Value |
|------|-------|
| **Live App URL** | `https://www.perplexity.ai/computer/a/muze-music-app-v1ZNbSQrSzyIEeRC2nXzWw` |
| **Local Dev Port** | `5000` |
| **Cash App Handle** | `$MUZEmusic` |
| **Zelle Email** | `payments@muze.music` |
| **Admin Earnings Page** | `/#/earnings` |

---

## 3. Project Structure

```
/home/user/workspace/muze/
├── client/
│   └── src/
│       ├── App.tsx                    ← Router + auth-page detection
│       ├── context/
│       │   └── AuthContext.tsx        ← Artist login state (JWT)
│       ├── lib/
│       │   ├── auth.ts                ← Token storage helpers
│       │   └── queryClient.ts         ← API base + apiRequest
│       ├── components/
│       │   ├── Layout.tsx             ← Sidebar + nav + artist session bar
│       │   ├── MiniPlayer.tsx         ← Bottom music player
│       │   ├── NowPlayingModal.tsx    ← Full-screen now playing
│       │   ├── QueueSidebar.tsx       ← Slide-out queue
│       │   ├── BuyModal.tsx           ← Quick buy → checkout bridge
│       │   └── PlayerProvider.tsx     ← Global playback context
│       └── pages/
│           ├── HomePage.tsx           ← Featured tracks + hero
│           ├── StorePage.tsx          ← All songs, filter by genre
│           ├── PlaylistsPage.tsx      ← Manual playlists
│           ├── SmartPlaylists.tsx     ← Auto rule-based playlists
│           ├── AIMoodDJ.tsx           ← Time/mood auto-queue
│           ├── LyricsSearch.tsx       ← Search by lyric snippet
│           ├── EqualizerPage.tsx      ← 10-band EQ + presets
│           ├── ListeningParty.tsx     ← Shared room with room codes
│           ├── MuzeWrapped.tsx        ← Monthly stats card
│           ├── EventsPage.tsx         ← 8 MUZE concerts
│           ├── FanTipPage.tsx         ← Direct fan tip
│           ├── MarketingPage.tsx      ← TikTok/IG/FB/YouTube share
│           ├── CheckoutPage.tsx       ← 3-step payment flow
│           ├── EarningsPage.tsx       ← Admin earnings dashboard
│           ├── RegisterPage.tsx       ← Artist sign-up (2-step)
│           ├── LoginPage.tsx          ← Artist login
│           ├── ForgotPasswordPage.tsx ← Security question reset flow
│           ├── ResetPasswordPage.tsx  ← New password after token
│           └── VerifyEmailPage.tsx    ← Email verification landing
├── server/
│   ├── index.ts                       ← Express entry point
│   ├── routes.ts                      ← All API routes (payments + auth)
│   ├── storage.ts                     ← Drizzle ORM + all DB methods
│   └── vite.ts                        ← Vite dev server middleware
├── shared/
│   └── schema.ts                      ← Drizzle table definitions + Zod schemas
├── muze.db                            ← SQLite database (all data lives here)
├── MUZE_MASTER.md                     ← THIS FILE
├── package.json
└── dist/
    ├── index.cjs                      ← Compiled server (production)
    └── public/                        ← Compiled frontend (deploy this folder)
```

---

## 4. Database Schema

### `songs` — Music catalog
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Auto PK |
| title | TEXT | Song name |
| artist | TEXT | Default: "MUZE" |
| album | TEXT | Album name |
| genre | TEXT | See genres list below |
| duration | INTEGER | Seconds |
| price | REAL | $0.99–$2.49 |
| cover_url | TEXT | Image URL (null = gradient) |
| audio_url | TEXT | MP3 URL (null = simulated) |
| description | TEXT | Short description |
| lyrics | TEXT | Full song lyrics |
| release_year | INTEGER | |
| featured | BOOLEAN | Shows in hero section |
| play_count | INTEGER | Auto-incremented |
| bpm | INTEGER | Beats per minute |
| key_signature | TEXT | e.g. "F# minor" |

**Genres in app:** R&B, Trap, Christian/Worship, Gospel, Neo Soul, Hip-Hop, Pop, Drill, Soul, Afrobeats, Jazz, Reggae, Lo-Fi

### `payments` — All purchase transactions
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Auto PK |
| item_type | TEXT | "song" / "album" / "gift_tip" |
| item_title | TEXT | What was purchased |
| buyer_name | TEXT | |
| buyer_email | TEXT | |
| gross_amount | REAL | Total paid |
| muze_split | REAL | 40% of gross |
| artist_split | REAL | 60% of gross |
| payment_method | TEXT | "cashapp" / "zelle" |
| status | TEXT | "pending" / "confirmed" / "failed" |
| confirmation_token | TEXT | 64-char random hex — unique |
| ip_address | TEXT | Buyer's IP (security log) |
| created_at | INTEGER | Unix timestamp |
| confirmed_at | INTEGER | When buyer tapped "I've Sent" |

### `artists` — Artist accounts
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Auto PK |
| name | TEXT | |
| email | TEXT | Unique, lowercased |
| password_hash | TEXT | bcrypt-hashed (12 rounds) |
| phone | TEXT | |
| is_verified | BOOLEAN | False until email confirmed |
| verification_token | TEXT | 64-char hex, expires 24h |
| sq1 / sq2 / sq3 | TEXT | Security question texts |
| sa1 / sa2 / sa3 | TEXT | bcrypt-hashed answers |
| reset_token | TEXT | Password reset token |
| login_attempts | INTEGER | Resets on success |
| locked_until | INTEGER | Epoch ms — lockout timer |

### `rate_limits` — Brute-force protection
| Column | Notes |
|--------|-------|
| key | "register:ip", "login:ip", "forgot:ip" |
| hits | Count in current window |
| window_start | Epoch ms window start |

---

## 5. All Pages & Features

| Route | Page | Description |
|-------|------|-------------|
| `/#/` | Home | Hero banner, featured tracks |
| `/#/store` | Store | All 26 songs, genre filter |
| `/#/playlists` | Playlists | 8 genre-based playlists |
| `/#/smart-playlists` | Smart Lists | Auto rule playlists (8 types) |
| `/#/mood-dj` | Mood DJ | Time-of-day + mood auto-queue |
| `/#/lyrics-search` | Lyrics | Search songs by lyric snippet |
| `/#/equalizer` | Equalizer | 10-band EQ + 6 presets |
| `/#/party` | Listen Party | Shared room with code |
| `/#/wrapped` | Wrapped | Monthly stats + export |
| `/#/events` | Live Events | 8 MUZE concerts |
| `/#/tip` | Support MUZE | Direct fan tip |
| `/#/marketing` | Share | TikTok / IG / FB / YouTube |
| `/#/checkout` | Buy / Gift | 3-step payment checkout |
| `/#/earnings` | Earnings | Admin revenue dashboard |
| `/#/register` | Register | Artist sign-up (2-step) |
| `/#/login` | Login | Artist portal sign-in |
| `/#/forgot-password` | Forgot PW | Security question reset |
| `/#/reset-password` | Reset PW | Set new password via token |
| `/#/verify-email` | Verify Email | Email confirmation landing |

---

## 6. Payment System

### Flow (3 steps)
1. **What** — Pick Song / Album / Gift. Select item. Toggle "Send as a gift."
2. **Details** — Enter name + email. Choose Cash App or Zelle. See 60/40 split.
3. **Pay** — App shows handle + unique reference code. User sends money in their app. Taps "I've Sent the Payment."

### Payment Handles
```
Cash App:  $MUZEmusic
Zelle:     payments@muze.music
```

### Changing Payment Handles
Edit `/home/user/workspace/muze/server/routes.ts`, find:
```js
const PAYMENT_HANDLES = {
  cashapp: "$MUZEmusic",
  zelle: "payments@muze.music",
};
```
Update values, then rebuild and redeploy.

### Revenue Split
- MUZE keeps **40%** (`muze_split` column)
- Artist receives **60%** (`artist_split` column)

To change the split, edit `server/storage.ts`:
```ts
const MUZE_SPLIT_RATE = 0.40;   // change to e.g. 0.30 for 30%
const ARTIST_SPLIT_RATE = 0.60; // must add up to 1.0
```

---

## 7. Artist Account Security

### Registration Flow
1. Artist fills: Name, Email, Password, Phone
2. Artist picks 3 security questions from a list of 10 + types answers
3. App creates account → sends verification email
4. Artist clicks link in email → account activated

### Password Requirements
- 8+ characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

### Security Layers
| Layer | Detail |
|-------|--------|
| Passwords | bcrypt, 12 salt rounds |
| Security answers | bcrypt-hashed at rest (never stored plain) |
| Sessions | JWT, 7-day expiry |
| Login lockout | 5 failed attempts → 30-minute lockout |
| Rate limiting | 10 login / 5 register attempts per IP per 15 min |
| Email verification | 64-char random token, 24-hour expiry |
| Timing attack prevention | Dummy hash checked even for non-existent accounts |

### Forgot Password Flow
1. Artist enters email
2. App returns their 3 security questions
3. Artist answers — must pass **2 of 3**
4. Reset link emailed (valid 1 hour)
5. Artist clicks link → sets new password

---

## 8. Backend API Routes

### Songs
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/songs` | All songs |
| GET | `/api/songs/featured` | Featured songs |
| GET | `/api/songs/:id` | Single song |
| GET | `/api/songs/search?q=` | Search songs |
| POST | `/api/songs/:id/play` | Increment play count |

### Payments
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/payments` | Create payment (rate-limited) |
| POST | `/api/payments/:token/confirm` | Mark as sent |
| POST | `/api/payments/:token/cancel` | Cancel payment |
| GET | `/api/payments/:token` | Get payment by token |
| GET | `/api/payments/stats` | Revenue stats (admin) |
| GET | `/api/payments` | All payments (admin) |

### Artist Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account (rate-limited) |
| GET | `/api/auth/verify-email?token=` | Verify email link |
| POST | `/api/auth/login` | Sign in, returns JWT |
| GET | `/api/auth/me` | Get current artist (JWT required) |
| POST | `/api/auth/forgot-password` | Lookup + return questions |
| POST | `/api/auth/verify-security` | Check answers, send reset email |
| POST | `/api/auth/reset-password` | Set new password via token |
| GET | `/api/auth/security-questions?email=` | Get question texts |

---

## 9. How to Update the App

Every change follows this 3-step process:

```bash
# Step 1 — Edit files in /home/user/workspace/muze/
# (edit any .tsx, .ts file you need to change)

# Step 2 — Build
cd /home/user/workspace/muze
npm run build

# Step 3 — Start server + deploy
NODE_ENV=production node dist/index.cjs   # runs on port 5000

# Then deploy the frontend via the Computer deploy_website tool:
# project_path = /home/user/workspace/muze/dist/public
# site_name = "MUZE Music App"
# entry_point = index.html
# should_validate = false
```

**IMPORTANT:** Always use the same `site_name = "MUZE Music App"` when deploying so it updates the existing URL instead of creating a new one.

---

## 10. How to Add New Songs

Edit `server/storage.ts` — find the `SEED_SONGS` array and add a new entry:

```ts
{
  title: "Song Title",
  artist: "MUZE",
  album: "Album Name",
  genre: "R&B",           // must match an existing genre or add a new one
  duration: 210,          // seconds
  price: 1.99,
  releaseYear: 2026,
  featured: false,        // true = shows in hero section
  bpm: 90,
  keySignature: "A minor",
  description: "Short description of the vibe.",
  lyrics: `[Verse 1]\nYour lyrics here...`,
  coverUrl: null,         // null = auto gradient color by genre
  audioUrl: null,         // null = simulated playback (add MP3 URL when ready)
},
```

Then rebuild and redeploy. New songs appear automatically since the seed function checks for new titles.

---

## 11. How to Change Prices

**Per song:** Find the song in `SEED_SONGS` in `server/storage.ts` and change `price: 1.99` to your new price.

**Price range guidelines:**
- Lo-Fi / Gospel / Christian: `$0.99`
- Pop / Reggae: `$1.49`
- R&B / Trap / Hip-Hop / Soul / Drill / Neo Soul / Afrobeats: `$1.99`
- Jazz (longer tracks): `$2.49`

**Min/max enforced by backend:** `$0.50` min, `$500.00` max (edit `createPaymentSchema` in `routes.ts` to change).

---

## 12. How to Add a New Page / Feature

1. Create `client/src/pages/YourPage.tsx`
2. Add the route to `App.tsx`:
```tsx
import YourPage from "@/pages/YourPage";
// Inside AppInner's Layout <Switch>:
<Route path="/your-page" component={YourPage} />
```
3. Add the nav item to `client/src/components/Layout.tsx`:
```ts
import { IconName } from "lucide-react";
// In navItems array:
{ href: "/your-page", label: "Your Label", icon: IconName },
```
4. Rebuild and redeploy.

---

## 13. How to Update Payment Handles

If you change your Cash App tag or Zelle email:

**Backend** — `server/routes.ts`:
```ts
const PAYMENT_HANDLES = {
  cashapp: "$YourNewTag",
  zelle: "your@new-email.com",
};
```

**Frontend** — `client/src/pages/CheckoutPage.tsx` — search for `$MUZEmusic` and `payments@muze.music` and update both occurrences.

Rebuild and redeploy after changes.

---

## 14. Post-Launch Data Collected

All data is stored in `/home/user/workspace/muze/muze.db` (SQLite).

### What Gets Tracked Automatically

| Data | Where Stored | How to View |
|------|-------------|-------------|
| Every payment attempt | `payments` table | `/#/earnings` page or `GET /api/payments` |
| Revenue per song/album | `payments` table | Filter by `item_title` |
| MUZE vs artist split | `payments.muze_split` / `artist_split` | `GET /api/payments/stats` |
| Payment method breakdown | `payments.payment_method` | Query the DB |
| Buyer names + emails | `payments` table | For follow-up / receipts |
| Song play counts | `songs.play_count` | Auto-incremented on play |
| Artist accounts | `artists` table | Name, email, phone, join date |
| Login activity | `artists.last_login` | Updated on every login |
| Failed login attempts | `artists.login_attempts` | Security monitoring |
| Rate limit hits | `rate_limits` table | IP-based abuse detection |

### How to Export Data

```bash
# Export all payments to CSV
cd /home/user/workspace/muze
sqlite3 muze.db -separator ',' \
  "SELECT id,item_title,buyer_name,buyer_email,gross_amount,muze_split,artist_split,payment_method,status,datetime(created_at/1000,'unixepoch') FROM payments" \
  > payments_export.csv

# Export all artists
sqlite3 muze.db -separator ',' \
  "SELECT id,name,email,phone,is_verified,datetime(created_at/1000,'unixepoch') FROM artists" \
  > artists_export.csv

# Revenue summary
sqlite3 muze.db \
  "SELECT COUNT(*) as total_payments, SUM(gross_amount) as total_revenue, SUM(muze_split) as muze_take, SUM(artist_split) as artist_take FROM payments WHERE status='confirmed'"
```

### Direct DB Access (SQLite)
```bash
cd /home/user/workspace/muze
sqlite3 muze.db

# Useful queries:
.tables                                          -- list all tables
SELECT * FROM payments ORDER BY created_at DESC LIMIT 20;
SELECT * FROM artists;
SELECT title, play_count FROM songs ORDER BY play_count DESC;
SELECT SUM(gross_amount) FROM payments WHERE status='confirmed';
```

---

## 15. Monitoring & Admin

### Earnings Dashboard
Visit `/#/earnings` in the app — shows:
- Total revenue (confirmed payments)
- MUZE platform take (40%)
- Artist payouts (60%)
- Transaction count + pending count
- Visual 40/60 split bar
- Full transaction table

### Check Server Health
```bash
curl http://localhost:5000/api/songs | python3 -m json.tool | head -20
curl http://localhost:5000/api/payments/stats
```

### View Logs
```bash
# If started with start_server, view logs at:
cat /tmp/server.log

# Or restart with explicit logging:
cd /home/user/workspace/muze
NODE_ENV=production node dist/index.cjs 2>&1 | tee /tmp/muze.log
```

---

## 16. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `muze-super-secret-jwt-2026...` | **Change this in production!** |
| `APP_URL` | `http://localhost:5000` | Used in email links |
| `SMTP_HOST` | none (uses Ethereal test) | Your email server host |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | none | SMTP username |
| `SMTP_PASS` | none | SMTP password |
| `PORT` | `5000` | Server port |

### Setting Up Real Email (Production)
Create a `.env` file in `/home/user/workspace/muze/`:
```env
JWT_SECRET=your-very-long-random-secret-here
APP_URL=https://your-production-url.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
```

**Note:** In dev/test mode, verification emails go to Ethereal (ethereal.email) — check server logs for the preview URL printed after registration.

---

## 17. Build & Deploy Commands

```bash
# Full rebuild + restart + deploy sequence:
cd /home/user/workspace/muze

# 1. Install new dependencies (only when adding packages)
npm install <package-name>

# 2. Build both client and server
npm run build

# 3. Start production server
NODE_ENV=production node dist/index.cjs
# Server starts on port 5000

# 4. Deploy (via Computer's deploy_website tool)
# project_path: /home/user/workspace/muze/dist/public
# site_name: "MUZE Music App"
# entry_point: index.html
# should_validate: false
```

### Quick DB Reset (nuclear option — loses all data)
```bash
cd /home/user/workspace/muze
rm muze.db
# Restart server — DB and seed songs recreated automatically
NODE_ENV=production node dist/index.cjs
```

---

## 18. Security Summary

| Threat | Protection |
|--------|-----------|
| Weak passwords | Enforced: 8+ chars, uppercase, number, special char |
| Brute-force login | 5 attempts → 30-min lockout + IP rate limiting |
| Account enumeration | Same error + timing for invalid email vs wrong password |
| Token theft | JWT 7-day expiry; token cleared on logout |
| Email spoofing | Verification required before login works |
| Password recovery abuse | Must pass 2/3 security questions + email token |
| Payment tampering | Server-side price verification; amount can't be faked |
| Payment replay | Unique 64-char token per payment |
| Spam registrations | Rate limit: 5 registrations per IP per 15 min |
| SQL injection | Drizzle ORM parameterized queries only |
| XSS | React JSX auto-escaping on all user content |

---

## 19. Planned Future Updates

Track what to build next here:

### High Priority
- [ ] **Real audio playback** — Upload MP3 files and add URLs to `audioUrl` column
- [ ] **Artist dashboard** — Artists see their own sales after login
- [ ] **Song upload** — Artists can upload their own tracks via the app
- [ ] **Real SMTP email** — Set up production email (Gmail/SendGrid) for verifications

### Medium Priority
- [ ] **Album artwork** — Add cover image URLs to songs
- [ ] **Promo codes** — Discount codes for fans
- [ ] **Push notifications** — New release alerts
- [ ] **Artist profiles** — Public artist bio + discography page

### Nice to Have
- [ ] **Stripe/Square integration** — Replace manual Cash App / Zelle flow
- [ ] **Analytics page** — Deeper play count + sales graphs
- [ ] **Comment system** — Fan comments on songs

---

## 20. Mobile App (iOS + Android)

**Status:** Capacitor configured, icons generated, PWA manifest + service worker in place.

### App Info
| Field | Value |
|-------|-------|
| App ID | `com.muzemusic.app` |
| App Name | MUZE |
| Web Dir | `dist/public` |
| Min iOS | 14.0 |
| Min Android | API 22 (Android 5.1) |
| Target Android | API 34 (Android 14) |

### Files Created for App Store
| File | Purpose |
|------|---------|
| `capacitor.config.ts` | Capacitor config (app ID, webDir, plugins) |
| `client/public/manifest.json` | PWA manifest (icons, shortcuts, theme) |
| `client/public/sw.js` | Service worker (offline caching, push support) |
| `client/public/favicon.png` | Browser favicon |
| `client/public/icons/` | 9 PWA icon sizes (72–1024px) |
| `mobile-assets/ios/` | 13 iOS icon sizes (20–1024px) |
| `mobile-assets/android/` | Android icons for all density buckets |
| `mobile-assets/` | 13 splash screens (iOS + Android) |
| `APP_STORE_GUIDE.md` | Full step-by-step submission guide |

### Mobile Build Commands

```bash
# Always run this sequence before any native build
cd /home/user/workspace/muze

# Step 1: Build web app
npm run build

# Step 2: Sync into native projects
npx cap sync

# First time only — add platforms
npx cap add ios
npx cap add android

# Open native IDEs
npx cap open ios        # Opens Xcode (macOS required)
npx cap open android    # Opens Android Studio

# Run directly on connected device (optional)
npx cap run ios
npx cap run android
```

### API URL Logic (queryClient.ts)
The app automatically detects whether it is running inside the Capacitor native
shell (iOS/Android) or on the web and switches the API base URL accordingly:
- **Web:** Uses `__PORT_5000__` proxy (local dev) or relative path (deployed)
- **Capacitor native:** Uses `https://www.perplexity.ai/computer/a/muze-music-app-v1ZNbSQrSzyIEeRC2nXzWw`

### Apple App Store Notes
- Apple requires digital download purchases use Apple In-App Purchase (IAP)
- Frame Cash App / Zelle payments as "artist tips/support" to comply
- Full details + rejection fixes: see `APP_STORE_GUIDE.md` → Section 7

### Updating After Launch
See `APP_STORE_GUIDE.md` → Section 8 for the full update workflow.
Short version: `npm run build` → `npx cap sync` → bump version → archive → submit.

---

*This file is your single source of truth for MUZE. Update it whenever you make major changes to the app.*
