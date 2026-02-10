# Socialyncara - Production-Ready Social Media & AI Management Platform

Socialyncara is a high-performance, secure web platform built with **Next.js 16 (App Router)**, **Supabase (PostgreSQL)**, and **NextAuth.js**. It features AES-256 token encryption, a modern dashboard, and a modular architecture ready for AI-agent integration.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Supabase Project (or any PostgreSQL instance)
- Google Cloud Console Project (for Google OAuth)

### 2. Environment Setup
Create a `.env` file in the root directory (refer to `.env.example` or the template below):
```env
# Database Connection
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

# Supabase Keys
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Security
ENCRYPTION_KEY="your-32-char-encryption-key-!!"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# OAuth Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
# (Add LinkedIn, X, Instagram, etc. as needed)
```

### 3. Installation
```bash
npm install
npx prisma generate
npx prisma db push
```

### 4. Run Locally
```bash
npm run dev
```

## 🔐 Features & Architecture

### 1. Authentication Layer
- **OAuth 2.0**: Integrated with Google (more providers coming).
- **Credentials**: Email/Password login with **Bcrypt hashing**.
- **Email Verification**: Workflow included via `api/auth/signup` and `api/auth/verify`.
- **Protected Routes**: Middleware handles session validation for `/dashboard` and `/api`.

### 2. Database & Security
- **Supabase (PostgreSQL)**: Handles all relational data (Users, Accounts, Queue, Logs).
- **AES-256 Encryption**: Every social platform access token is encrypted before being saved to the database. Decryption only happens in isolated backend operations.
- **Foreign Key Safety**: Cascade deletes ensure data integrity (e.g., deleting a user removes all their connected accounts).

### 3. Dashboard & Social Integration
- **Platform Connectors**: Ready-to-use connect buttons for LinkedIn, X, Instagram, YouTube, WhatsApp, TikTok, Reddit, and Medium.
- **Policy Analytics**: Dashboard shows real-time limits for free vs. paid automation per platform.
- **AI Content Queue**: Mock placeholder for AI-generated posts, ready for integration with LLM agents.

## 🧪 Testing Guide

### Test Login & Signup
1.  Go to `/signup` and create an account.
2.  Check the console for the **Debug Verification Token**.
3.  Navigate to `/api/auth/verify?token=YOUR_TOKEN` to verify the account.
4.  Log in at `/login`.

### Test OAuth (Mock)
1.  Navigate to **Connected Accounts** in the dashboard.
2.  Click **Connect** on any platform (e.g., LinkedIn).
3.  Verify the account appears as "Connected".
4.  Check the database `social_accounts` table to see the encrypted token.

## 🛠️ Extending the Platform

### Adding Social Platforms
1.  Register your app on the platform's developer portal (e.g., Meta for Developers).
2.  Add the provider to `lib/auth.ts` under the `providers` array.
3.  Add the Client ID and Secret to `.env`.
4.  Add the platform metadata to `app/dashboard/connect/page.tsx`.

### Future AI Layer Integration
The platform is designed to plug in an AI agent. 
- The `AiLog` table is ready to track agent decisions.
- The `ContentQueue` table supports `viralScore` for AI-prioritized posting.
- Simply update `api/ai/generate` (placeholder) to call an OpenAI/Anthropic SDK.

## 📄 License
MIT License. © 2026 Socialyncara Team.
