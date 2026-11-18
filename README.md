# Vspark Studio — AI Social Media Content Generator & Scheduler

> **VSPARK 2026 Web Development Competition Submission**  
> Built with React 19, TypeScript, Vite, Tailwind CSS v4, Express, Supabase (Auth, PostgreSQL, Storage), Google Gemini AI (`gemini-2.5-flash`), EmailJS, and Google Drive Export.

Vspark Studio is an end-to-end SaaS workspace that transforms campaign briefs into platform-tailored social posts, renders real-time interactive feed mockups across LinkedIn, X/Twitter, and Instagram, uploads campaign media to Supabase Cloud Storage, manages full PostgreSQL CRUD scheduling with live countdowns and calendar/timeline views, and syncs schedules to Google Drive (`vspark-folder`) with customizable email lead-time reminders.

---

## Feature Breakdown & VSPARK 2026 Rubric Alignment

| Competition Rubric Area | Implementation Highlights |
| --- | --- |
| **Supabase Authentication** | Full Sign Up, Sign In, Sign Out, `ProtectedRoute` guard, randomized temporary credentials generator, and 1-click **Judge Demo Quick Login** (`judge@vspark2026.com` / `Vspark2026!`). |
| **PostgreSQL Full CRUD** | Persistent `scheduled_posts` table (RLS-scoped to `auth.uid()`), real-time chronological feed, Inline Edit Modal (`EditPostModal`), Delete confirmation (`DeleteConfirmModal`), plus hybrid `localStorage` starter resilience so the feed is never blank. |
| **Supabase Cloud Storage** | Drag-and-drop & file-picker upload (`MediaUploadZone`) to `post-media` bucket with size/type validation, live public URL thumbnails via `getPublicUrl()`, and resilient `FileReader` fallback. |
| **Google Gemini AI Engine** | Server-side Express proxy (`/api/gemini/generate`) calling `@google/genai` (`gemini-2.5-flash`) returning structured JSON (3 tailored captions, viral hashtags, engagement score `/100`, best posting window) + instant resilient fallback on rate-limits/timeouts + live interactive LinkedIn, X, and Instagram preview cards. |
| **External APIs (Drive + Email)** | 1-click **Sync to Google Drive** (`vspark-folder` JSON/CSV export bundle with `"Synced to Drive · Just now"` tracking) and **EmailJS / Webhook** customizable lead-time reminders (`15m prior`, `1h prior`, exact time, custom subject template, instant test dispatch). |
| **Production UI/UX & Polish** | Custom 3D isometric SVG logo (`BrandLogo3D`), dark/light Vercel/Linear studio aesthetic, `● Cloud Connected` status indicator, global `ToastProvider` alerts, `ErrorBoundary`, loading skeletons, and `375px` mobile responsiveness. |

---

## Tech Stack & System Architecture

```text
+-------------------------------------------------------------------------+
|                    Vspark Studio Client (React 19 + Vite)               |
|  Tailwind CSS v4 · Motion · Lucide Icons · BrandLogo3D · ToastProvider  |
+-------------------+-------------------------+---------------------------+
                    |                         |
                    v                         v
     +------------------------------+  +----------------------------------+
     |  Supabase Cloud Platform     |  |  Express API Server (server.ts)  |
     |  - Auth (Email/Password)     |  |  - POST /api/gemini/generate     |
     |  - PostgreSQL scheduled_posts|  |    (@google/genai gemini-2.5)    |
     |  - Storage bucket post-media |  |  - POST /api/notifications/      |
     +------------------------------+  |    test-email (Webhook)          |
                                       |  - GET  /api/health              |
                                       +----------------------------------+
                    |
                    v
     +--------------------------------------------------------------------+
     |  External Productivity & Notification Integrations                 |
     |  - Google Drive Sync Bundle (vspark-folder JSON / CSV + Webhook)   |
     |  - EmailJS REST API (api.emailjs.com/api/v1.0/email/send)          |
     +--------------------------------------------------------------------+
```

---

## Local Setup & Installation

### 1. Prerequisites
- Node.js **20+** and `npm`
- Optional (for live cloud persistence): Supabase project, Google Gemini API key, and EmailJS account

### 2. Install & Configure
```bash
# Clone the repository
git clone https://github.com/your-username/vspark-2026-scheduler.git
cd vspark-2026-scheduler

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 3. Initialize Supabase Schema (Optional if using Hybrid Demo Mode)
Run the SQL migration in `/supabase/schema.sql` inside your **Supabase SQL Editor** to provision:
- `public.scheduled_posts` table with `auth.uid()` Row Level Security (RLS) policies
- `post-media` public storage bucket with authenticated upload policies

### 4. Start Development Server
```bash
npm run dev
```
The full-stack Express + Vite server starts on `http://localhost:3000`.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## Environment Variables

Configure these keys in `.env` (never commit `.env`; `.gitignore` excludes `.env*` except `.env.example`):

| Variable | Required | Scope | Description |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Recommended | Server | Google AI Studio key used by `/api/gemini/generate` in `server.ts`. |
| `VITE_GEMINI_API_KEY` | Optional | Client | Reference key for Gemini client configuration / Vite builds. |
| `APP_URL` | Optional | Server | Hosted application URL for runtime self-links. |
| `VITE_SUPABASE_URL` | Recommended | Client | Your Supabase Project URL (`https://<ref>.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | Recommended | Client | Your Supabase public anonymous (`anon`) key. |
| `VITE_EMAILJS_SERVICE_ID` | Optional | Client | EmailJS service ID for live reminder emails. |
| `VITE_EMAILJS_TEMPLATE_ID` | Optional | Client | EmailJS template ID for scheduled alerts. |
| `VITE_EMAILJS_PUBLIC_KEY` | Optional | Client | EmailJS public user key. |
| `VITE_GOOGLE_DRIVE_WEBHOOK_URL` | Optional | Client | Apps Script / Make / Zapier webhook URL targeting `vspark-folder`. |

---

## Deployment Guide (Vercel + GitHub)

1. Push the repository to a public GitHub repository (`git push origin main`).
2. Import the repository in **Vercel** (`vercel.com/new`).
3. Set Build Command to `npm run build` and Output Directory to `dist` (or deploy full-stack Node runtime with `npm start` for Express proxy routes).
4. Add the environment variables from `.env.example` inside **Vercel -> Project Settings -> Environment Variables**.
5. Click **Deploy** and verify `/api/health` and the 1-click Judge Demo Login on your live URL.

---

## Process Screenshots

1. **Login & Authentication Screen (3D Logo & 1-Click Judge Demo Login)**  
   ![Login & Auth](screenshots/1-auth.png)
2. **Gemini AI Content Generator & Live Multi-Platform Previews**  
   ![Gemini AI Generator](screenshots/2-ai-generator.png)
3. **Supabase Cloud Storage Drag-and-Drop Media Upload**  
   ![Supabase Media Upload](screenshots/3-cloud-storage.png)
4. **Scheduled Posts Full CRUD Feed, Timeline & Calendar Dashboard**  
   ![Scheduled Posts CRUD](screenshots/4-crud-dashboard.png)
5. **Live Production Deployment & Drive/EmailJS Integrations**  
   ![Live Vercel Deployment](screenshots/5-live-deployment.png)

---

## Team Details

- **Team Members:** Aarav Mehta (Team Lead & Full-Stack Engineer)
- **Registration Numbers:** VSPARK-2026-0412
- **Live Vercel URL:** https://vspark-studio-2026.vercel.app
- **Public GitHub URL:** https://github.com/your-username/vspark-2026-scheduler
- **Google Drive Folder:** `vspark-folder`
