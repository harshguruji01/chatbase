# ChatBase 💬

> **Production-ready social chatting application for Android and Modern Web browsers.**  
> **Brand**: Made by HarshGuruJi  
> **Website**: [www.webguruji.online](https://www.webguruji.online/)  
> **Developer**: HarshGuruJi  

---

## 🌟 Overview

ChatBase is a secure, fast, and feature-rich real-time chatting platform built with modern web technologies, full responsive desktop and mobile layouts, native Android APK readiness via Capacitor, and a Supabase backend.

---

## 🚀 Key Features

### 1. Brand Identity & Splash Screen
- Animated startup splash screen with ChatBase glowing logo and sleek pulse animations.
- Subtle branding throughout: Splash, Login/Register, About modal, Profile, and Admin footer.
- Smooth startup session checking that skips login for active sessions.

### 2. Complete Authentication
- **Login**: Email, Username, or Unique User ID + Password with show/hide password toggle.
- **Registration**: Username, Display Name, Email, Phone Number, Password, Confirm Password, and optional Avatar upload.
- **Unique Permanent User ID**: Automatically generated 8-character unique alphanumeric ID (e.g., `HG8X29K4`) assigned to every user account.
- Passwords safely hashed and authenticated via Supabase Auth.

### 3. Location Permission & Nearby People Discovery
- Transparent permission dialog explaining privacy protection before native browser/device geolocation requests.
- **Privacy-Preserving**: Only calculates approximate distance (e.g., `~1.5 km away`) via Haversine formula in PostgreSQL RPC (`get_nearby_users`). Raw GPS coordinates and addresses are NEVER exposed.
- Privacy switch to disable appearing in nearby discovery at any time.

### 4. Fast Debounced Search
- Search by Unique User ID (`HG...`) or `@username`.
- Fast debounced query (300ms) with instant matching user cards showing avatar, name, follow status, and direct chat action.

### 5. Follow & Social System
- Follow, Unfollow, and Accept/Reject follow requests for private accounts.
- Follower and Following counter with list modals.
- Self-following and following blocked users are prevented at both client and database levels.

### 6. Privacy & Block System
- Block and unblock any user with confirmation modal.
- Blocked users cannot send messages, follow, view profile, or discover via nearby search.
- Blocked status prevents search bypass.

### 7. Rich Messaging Interface
- **Responsive Layout**:
  - **Desktop**: Dual-pane layout (collapsible conversation list + active chat window).
  - **Mobile**: Seamless single-page view with bottom navigation bar (Chat, Nearby, Search, Profile) and back navigation.
- **Message Types**:
  - **Text & Emojis**: Built-in categorized Emoji Picker (Smiles, Gestures, Hearts, Animals, Food, etc.) with search.
  - **Voice Notes**: Tap to record up to **1 minute (60s hard ceiling)** with live animated waveform, elapsed timer, preview playback, cancel, and send.
  - **Video Messages**: Video file sharing strictly validated under **10 MB** (enforced on both client and storage), with upload progress bar and inline video player.
- **Delivery States**: Sent (`✓`), Delivered (`✓✓`), Read (`✓✓` in blue).
- **Message Deletion**: "Delete for me" and "Delete for everyone" (for sender).
- **30-Day Auto Cleanup**:
  - Messages store `expires_at = created_at + interval '30 days'`.
  - Automated PostgreSQL daily cron job (`cleanup-expired-messages-daily`) running at 3:00 AM UTC purges expired messages and media.

### 8. Profile & Customization
- Display profile picture, display name, username, bio, follower/following counts.
- Convenient **1-Click Copy User ID** button.
- **Edit Profile**: Avatar upload, display name, bio, phone.
- **Privacy & Safety Toggles**: Appear in Nearby, Show Online Status, Private Account.
- **Theme Modes**: Dark mode (default), Light mode, and System default mode with persistence.

### 9. Dedicated Admin Dashboard (`/admin`)
- Restricted to users with `role = 'admin'`.
- Analytics KPI cards: Total Users, Active Accounts, Messages Sent, Voice & Video Counts, Pending Reports.
- **User Management**: Search users, view metadata, Suspend / Unsuspend accounts, or Delete accounts.
- **Content Moderation**: Review abuse and spam reports with Dismiss / Resolve actions.
- **Immutable Audit Trail**: Logs all admin actions with targets, timestamps, and reasons.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript + Vite |
| **Styling & Design** | Modern Vanilla CSS Design Tokens, Glassmorphism, Animations |
| **Icons** | `lucide-react` |
| **Mobile & Android** | `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` |
| **Database & Auth** | Supabase (PostgreSQL 15+ with RLS, Realtime Channels, Auth) |
| **Media Storage** | Supabase Storage (`avatars`, `chat-media`) |
| **Automated Cleanup** | PostgreSQL `pg_cron` daily task |

---

## 💻 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+
- Android Studio / Android SDK (for native Android builds)

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=ChatBase
VITE_BRAND_NAME=Made by HarshGuruJi
VITE_BRAND_URL=https://www.webguruji.online
```

### 3. Run Web App Locally
```bash
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

### 4. Build for Production
```bash
npm run build
```

### 5. Build Native Android Application
```bash
# Build web assets and sync to Android
npm run build
npx cap sync android

# Open project in Android Studio to build APK
npx cap open android
```

---

## 📱 Android Permissions
The following native permissions are pre-configured in `AndroidManifest.xml`:
- `INTERNET`, `ACCESS_NETWORK_STATE` (Network & realtime messaging)
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` (Nearby discovery)
- `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` (60-second voice notes)
- `READ_MEDIA_AUDIO`, `READ_MEDIA_VIDEO`, `READ_MEDIA_IMAGES` (Media uploads)

---

## 🔒 Security & Privacy
- **Row-Level Security (RLS)** is strictly active across all tables.
- **Exact Coordinates are Never Exposed**: The PostgreSQL `get_nearby_users` function uses spherical trigonometry to compute approximate distance without exposing coordinates.
- **Strict File Limits**: 5 MB for avatars, 10 MB for videos, 60s for voice messages.
- **Sanitized Text**: User messages are rendered safely against script injection and XSS.

---

## 📄 License & Credits
Developed with ❤️ by **HarshGuruJi**  
Website: [www.webguruji.online](https://www.webguruji.online/)
