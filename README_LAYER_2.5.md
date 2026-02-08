# SocialyNikara — Layer 2.5: Scaling & Production Readiness

This document outlines the critical next steps to move from the core OAuth implementation to a fully functional, production-ready social media automation engine.

---

## 🚀 1. OAuth Provider Finalization

The core flow is built, but each platform needs specific logic in `app/api/oauth/callback/route.ts`:

- [ ] **Instagram Graph API**: Implement the profile fetching logic (requires Page ID and User ID exchange).
- [ ] **LinkedIn**: Map the `r_liteprofile` fields to the `metadata` JSON.
- [ ] **TikTok/Reddit**: Add these to the `OAUTH_PROVIDERS` config in `lib/oauth.ts` and handle their unique response formats.
- [ ] **Redirect URI Sync**: Ensure `http://localhost:3000/api/oauth/callback` is registered in **all** developer portals (Meta, Google, X, etc.).

---

## ⚙️ 2. Automated Token Lifecycle Management

Tokens expire. To ensure automations don't fail, we need a refresh strategy:

- [ ] **Token Refresh Utility**: Create a function in `lib/oauth.ts` that takes an `encryptedRefreshToken`, decrypts it, calls the provider's token endpoint, and updates the DB.
- [ ] **Proactive Refresh**: Implement a check before any posting job. If `expiresAt` < 5 minutes, trigger the refresh.
- [ ] **Revocation Handler**: If a refresh fails (user revoked access), update `status = 'revoked'` and notify the user via `lib/mail.ts`.

---

## 🕒 3. The Automation Engine (Queuing)

The `ContentQueue` table is ready. Now you need a processing layer:

- [ ] **Job Processor**: Use a background worker (e.g., **Inngest**, **Upstash Workflow**, or a simple Cron job via **Vercel Cron**).
- [ ] **Posting Logic**: Create a function that:
    1. Fetches `pending` items from `ContentQueue` where `scheduledAt` <= now.
    2. Decrypts the `accessToken`.
    3. Calls the platform API.
    4. Updates `PostHistory` with the resulting `postId` or error message.

---

## 🎨 4. Enhanced Dashboard UI

Make the "Connect Accounts" page feel premium and informative:

- [ ] **Account Thumbnails**: Use the `metadata.picture` or `metadata.avatar` in the UI.
- [ ] **Last Verified Status**: Show a "Last synced 2 hours ago" label.
- [ ] **Disconnect Logic**: Implement `DELETE /api/accounts/[id]` to remove the entry and cancel pending jobs.
- [ ] **Health Indicator**: Highlight accounts that need re-authentication (expired/failed refresh).

---

## 🛡️ 5. Production Security Audit

- [ ] **Supabase RLS**: Run the `prisma/setup-rls.sql` script in the Supabase dashboard.
- [ ] **Secret Management**: Move all Client IDs and Secrets to a secure vault (Vercel Environment Variables or Supabase Secrets).
- [ ] **Encryption Key Rotation**: Plan a strategy for rotating the `ENCRYPTION_KEY` without losing access to old tokens.

---

## 📈 6. Layer 3 Preview: Analytics & Insights

- [ ] **Webhook Endpoints**: Set up listeners for Meta/X webhooks to track likes, comments, and shares in real-time.
- [ ] **Engagement Sync**: Periodically update the `engagementMetrics` JSON in `PostHistory`.

---

### ✅ Success Checklist
1. All sensitive tokens are AES-256 encrypted.
2. `auth.uid() = userId` is enforced on all API requests.
3. No secrets are exposed in the frontend.
4. Token refresh logic is tested for at least one platform.
