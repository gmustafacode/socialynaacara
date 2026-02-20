# Vercel Deployment Guide

To deploy this project to Vercel, follow these steps:

## 1. Environment Variables

Set the following environment variables in your Vercel Project Settings:

### Database (Supabase)
- `DATABASE_URL`: Connection string for Prisma (Pooler port 6543)
- `DIRECT_URL`: Direct connection string for Prisma migrations (Direct port 5432)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Security
- `ENCRYPTION_KEY`: A random 32-character string (Used for encrypting tokens)
- `NEXTAUTH_SECRET`: A random string for NextAuth.js
- `NEXTAUTH_URL`: Your production URL (e.g., `https://your-app.vercel.app`)

### AI Service
- `AI_SERVICE_URL`: URL of the deployed Python AI Service
- `GROQ_API_KEY`: API key for Groq LLM

### Services
- `NEWS_API_KEY`: API key for NewsAPI
- `UNSPLASH_ACCESS_KEY`: Access key for Unsplash
- `PEXELS_API_KEY`: API key for Pexels
- `WEBHOOK_SECRET`: Secret for Inngest webhooks
- `N8N_PUBLISH_WEBHOOK_URL`: Webhook URL for n8n

## 2. AI Service Deployment

The `ai-service` folder contains a Python FastAPI application. You should deploy this separately:
- **Railway/Render**: Highly recommended for easy Python deployment.
- **Vercel**: Can be deployed using Vercel Python Functions if refactored, but a separate host is often simpler for LangGraph.

## 3. Inngest Setup

1. Sign up for [Inngest Cloud](https://www.inngest.com/).
2. Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to your Vercel environment variables.
3. Configure the Inngest Cloud to point to your Vercel deployment's `/api/inngest` endpoint.
