# Vspark Studio — AI Social Media Content Engine & Scheduler

Built for the **VSPARK 2026 Web Development Competition**, Vspark Studio is a full-stack React, TypeScript, Tailwind CSS, Express, Supabase, and Google Gemini AI publishing studio.

## Core Architecture

- **Frontend Studio**: Vite + React 19 + TypeScript + Tailwind CSS v4 (Dark & Light Studio themes) + Lucide Icons + Motion.
- **Authentication & Database**: Supabase Auth (`signUp`, `signInWithPassword`, `signOut`, 1-click Judge Demo Quick Login) + PostgreSQL (`scheduled_posts` table with RLS and real-time subscriptions) + Supabase Cloud Storage (`post-media` bucket).
- **AI Content Engine**: Server-side Express proxy (`POST /api/gemini/generate`) invoking `@google/genai` (`gemini-2.5-flash`) with strict JSON schema output returning 3 tailored captions, viral hashtags, engagement score, and best posting time.
- **Live Multi-Platform Previews**: Real-time interactive mockups for **LinkedIn**, **X / Twitter**, and **Instagram** with character limit telemetry and live uploaded media thumbnails.
- **Google Drive Sync & Export (`vspark-folder`)**: Packages scheduled posts into sync-ready JSON & CSV bundles with sync timestamp logging and optional webhook bridge.
- **Customizable Email Notifications**: Recipient configuration, pre-publish timing (`15 mins before`, `1 hour before`, `Exact time`), custom subject templates (`[Platform]`), and instant EmailJS / server webhook test dispatch.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="http://localhost:3000"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
VITE_EMAILJS_SERVICE_ID="your-emailjs-service-id"
VITE_EMAILJS_TEMPLATE_ID="your-emailjs-template-id"
VITE_EMAILJS_PUBLIC_KEY="your-emailjs-public-key"
VITE_GOOGLE_DRIVE_WEBHOOK_URL=""
```

## Database Setup

Run `/supabase/schema.sql` in your Supabase SQL Editor to provision `public.scheduled_posts`, Row-Level Security policies, and the `post-media` public storage bucket.

## Local Development & Production

```bash
npm install
npm run dev      # Starts Express + Vite middleware on port 3000
npm run lint     # Runs tsc --noEmit
npm run build    # Builds dist/ bundle
```
