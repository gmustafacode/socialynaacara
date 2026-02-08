# 🏗️ ONE ACCOUNT PER PLATFORM ENFORCEMENT - COMPLETE ARCHITECTURE

## 📊 SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                     ENFORCEMENT LAYERS                       │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Database Constraints (UNIQUE userId + platform)    │
│ Layer 2: OAuth Callback Validation (Pre-save check)         │
│ Layer 3: API Route Guards (canAttachPlatform)               │
│ Layer 4: Transaction Safety (Prevent race conditions)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ DATABASE SCHEMA DESIGN

### Current Issue ❌
```prisma
@@unique([platform, platformAccountId], name: "platform_platformAccountId")
```
**Problem**: This prevents the SAME platform account from being connected twice, but allows:
- User A → LinkedIn Account 1 ✅
- User A → LinkedIn Account 2 ✅ (WRONG!)

### Required Fix ✅
```prisma
@@unique([userId, platform], name: "user_platform_unique")
```
**Effect**: Enforces ONE account per platform per user at database level.

### Complete Schema
```prisma
model SocialAccount {
  id                    String    @id @default(uuid())
  userId                String
  platform              String    // 'linkedin', 'youtube', 'instagram', etc.
  platformAccountId     String?   // Platform-specific ID
  encryptedAccessToken  String?
  encryptedRefreshToken String?
  encryptedClientId     String?
  encryptedClientSecret String?
  customRedirectUri     String?
  accessTokenExpiresAt  DateTime? @map("access_token_expires_at")
  expiresAt             DateTime? @map("expires_at")
  scopes                String?
  metadata              String?
  status                String    @default("active")
  connectedAt           DateTime  @default(now())
  lastVerifiedAt        DateTime?
  capabilities          Json?
  updatedAt             DateTime  @updatedAt
  
  user                  User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  scheduledPosts        ScheduledPost[]
  linkedinPosts         LinkedInPost[]

  // CRITICAL: One user can have only ONE account per platform
  @@unique([userId, platform], name: "user_platform_unique")
  
  // OPTIONAL: Prevent same platform account from being shared (if needed)
  @@unique([platform, platformAccountId], name: "platform_platformAccountId")
  
  @@index([userId])
  @@index([platform])
  @@index([status])
  @@map("social_accounts")
}
```

### Migration Strategy
```sql
-- Step 1: Identify duplicates (for cleanup before migration)
SELECT userId, platform, COUNT(*) as count
FROM social_accounts
GROUP BY userId, platform
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicates (keep most recent)
DELETE FROM social_accounts
WHERE id NOT IN (
  SELECT MAX(id)
  FROM social_accounts
  GROUP BY userId, platform
);

-- Step 3: Add unique constraint
ALTER TABLE social_accounts
ADD CONSTRAINT user_platform_unique UNIQUE (userId, platform);
```

---

## 2️⃣ OAUTH CALLBACK VALIDATION

### Implementation Location
**File**: `app/api/oauth/callback/route.ts`

### Validation Logic (Before Token Storage)
```typescript
// After successful token exchange, BEFORE saving to database
const userId = (session.user as any).id;
const platform = storedData.platform; // 'linkedin', 'youtube', etc.

// CHECK: Does user already have this platform connected?
const existingAccount = await db.socialAccount.findUnique({
    where: {
        user_platform_unique: {
            userId: userId,
            platform: platform
        }
    }
});

if (existingAccount) {
    // BLOCK: User already has this platform
    return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connect?error=platform_already_connected&platform=${platform}`
    );
}

// PROCEED: Save new account
await db.socialAccount.create({
    data: {
        userId,
        platform,
        platformAccountId,
        encryptedAccessToken: encrypt(tokens.access_token),
        // ... rest of data
    }
});
```

### Error Handling Strategy
```typescript
enum OAuthError {
    PLATFORM_ALREADY_CONNECTED = 'platform_already_connected',
    INVALID_STATE = 'invalid_state',
    TOKEN_EXCHANGE_FAILED = 'token_exchange_failed'
}

function getErrorMessage(error: string, platform: string): string {
    switch (error) {
        case OAuthError.PLATFORM_ALREADY_CONNECTED:
            return `You already have a ${platform} account connected. Please disconnect it first to connect a different account.`;
        default:
            return 'An error occurred during authentication.';
    }
}
```

---

## 3️⃣ PLATFORM ACCOUNT ID MAPPING

### Platform-Specific Identifiers
```typescript
interface PlatformIdentifiers {
    linkedin: 'sub' | 'id';           // urn:li:person:{id}
    youtube: 'channelId';             // UC...
    instagram: 'id';                  // Instagram Business Account ID
    tiktok: 'open_id';                // TikTok Open ID
    x: 'id';                          // Twitter User ID
    facebook: 'id';                   // Facebook Page ID
    reddit: 'name';                   // Reddit username
    medium: 'id';                     // Medium user ID
}

function extractPlatformAccountId(platform: string, profile: any): string {
    switch (platform) {
        case 'linkedin':
            return profile.sub || profile.id;
        case 'youtube':
            return profile.channelId;
        case 'instagram':
            return profile.id;
        case 'tiktok':
            return profile.open_id;
        case 'x':
            return profile.data.id;
        case 'facebook':
            return profile.id;
        case 'reddit':
            return profile.name;
        case 'medium':
            return profile.data.id;
        default:
            throw new Error(`Unknown platform: ${platform}`);
    }
}
```

---

## 4️⃣ BACKEND GUARD LOGIC

### Guard Function
**File**: `lib/platform-guard.ts`

```typescript
import db from './db';

export class PlatformGuard {
    /**
     * Checks if a user can attach a new account for the given platform.
     * Returns true if allowed, false if blocked.
     */
    static async canAttachPlatform(
        userId: string,
        platform: string
    ): Promise<{ allowed: boolean; reason?: string; existingAccount?: any }> {
        
        const existingAccount = await db.socialAccount.findUnique({
            where: {
                user_platform_unique: {
                    userId,
                    platform
                }
            },
            select: {
                id: true,
                platformAccountId: true,
                metadata: true,
                connectedAt: true,
                status: true
            }
        });

        if (existingAccount) {
            return {
                allowed: false,
                reason: `You already have a ${platform} account connected`,
                existingAccount
            };
        }

        return { allowed: true };
    }

    /**
     * Gets all connected platforms for a user.
     */
    static async getConnectedPlatforms(userId: string): Promise<string[]> {
        const accounts = await db.socialAccount.findMany({
            where: { userId },
            select: { platform: true }
        });
        
        return accounts.map(a => a.platform);
    }

    /**
     * Checks if a specific platform is connected.
     */
    static async isPlatformConnected(userId: string, platform: string): Promise<boolean> {
        const count = await db.socialAccount.count({
            where: {
                userId,
                platform,
                status: { not: 'revoked' }
            }
        });
        
        return count > 0;
    }
}
```

---

## 5️⃣ TOKEN STORAGE STRATEGY

### Upsert vs Create Strategy

**WRONG Approach** ❌:
```typescript
// This allows overwriting without user consent
await db.socialAccount.upsert({
    where: { user_platform_unique: { userId, platform } },
    update: { /* new tokens */ },
    create: { /* new account */ }
});
```

**CORRECT Approach** ✅:
```typescript
// Step 1: Check if exists
const guard = await PlatformGuard.canAttachPlatform(userId, platform);

if (!guard.allowed) {
    throw new Error(guard.reason);
}

// Step 2: Create (will fail if constraint violated)
await db.socialAccount.create({
    data: {
        userId,
        platform,
        platformAccountId,
        encryptedAccessToken: encrypt(tokens.access_token),
        encryptedRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        accessTokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        scopes: JSON.stringify(tokens.scope || config.scopes),
        metadata: JSON.stringify(metadata),
        status: 'active'
    }
});
```

### Reconnection Strategy (Optional)
If you want to allow users to **replace** their existing account:

```typescript
async function reconnectPlatform(userId: string, platform: string, newTokens: any) {
    // Use transaction for safety
    await db.$transaction(async (tx) => {
        // Delete old account
        await tx.socialAccount.deleteMany({
            where: { userId, platform }
        });

        // Create new account
        await tx.socialAccount.create({
            data: { /* new account data */ }
        });
    });
}
```

---

## 6️⃣ USER EXPERIENCE (UX) FLOW

### Scenario 1: User Tries to Connect Duplicate Platform

**Flow**:
```
1. User clicks "Connect LinkedIn"
2. OAuth flow starts
3. User authorizes on LinkedIn
4. Callback receives tokens
5. Backend checks: canAttachPlatform(userId, 'linkedin')
6. Result: FALSE (already connected)
7. Redirect to: /dashboard/connect?error=platform_already_connected&platform=linkedin
8. Frontend shows:
   ┌────────────────────────────────────────────┐
   │ ⚠️ LinkedIn Already Connected              │
   │                                            │
   │ You already have a LinkedIn account        │
   │ connected. To connect a different account: │
   │                                            │
   │ 1. Disconnect your current account         │
   │ 2. Then connect the new account            │
   │                                            │
   │ [View Connected Accounts] [Dismiss]        │
   └────────────────────────────────────────────┘
```

### Scenario 2: User Connects Multiple Different Platforms

**Flow**:
```
1. User connects LinkedIn ✅
2. User connects YouTube ✅
3. User connects Instagram ✅
4. User tries LinkedIn again ❌ (blocked)
5. User connects TikTok ✅
```

---

## 7️⃣ SECURITY & EDGE CASES

### Race Condition Prevention

**Problem**: Two parallel OAuth requests for same platform
```
Request A: Connect LinkedIn (starts)
Request B: Connect LinkedIn (starts)
Request A: Check exists → FALSE → Create ✅
Request B: Check exists → FALSE → Create ❌ (DB constraint violation)
```

**Solution**: Database constraint catches this automatically
```typescript
try {
    await db.socialAccount.create({ /* data */ });
} catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('user_platform_unique')) {
        // Unique constraint violation
        return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/dashboard/connect?error=platform_already_connected`
        );
    }
    throw error;
}
```

### Token Overwrite Prevention

**Scenario**: User reconnects same platform account (same platformAccountId)

**Current Constraint**:
```prisma
@@unique([platform, platformAccountId])
```

**Behavior**:
- User A connects LinkedIn Account X ✅
- User B tries to connect LinkedIn Account X ❌ (blocked by DB)
- User A tries to reconnect LinkedIn Account X ❌ (blocked by userId+platform constraint)

**If you want to allow reconnection**:
Remove the `[platform, platformAccountId]` constraint and only keep `[userId, platform]`.

---

## 8️⃣ COMPLETE IMPLEMENTATION CHECKLIST

### Database Layer ✅
- [ ] Add `@@unique([userId, platform])` constraint
- [ ] Run migration to clean up existing duplicates
- [ ] Test constraint enforcement

### OAuth Callback ✅
- [ ] Add `canAttachPlatform` check before token save
- [ ] Handle `platform_already_connected` error
- [ ] Redirect with clear error message

### Backend API ✅
- [ ] Create `PlatformGuard` utility class
- [ ] Add guard checks to all account creation endpoints
- [ ] Implement proper error responses

### Frontend UX ✅
- [ ] Show error message when platform already connected
- [ ] Add "Disconnect" button on connected accounts page
- [ ] Prevent UI from showing "Connect" button if already connected

### Testing ✅
- [ ] Test: User connects LinkedIn → Success
- [ ] Test: User connects LinkedIn again → Blocked
- [ ] Test: User connects YouTube after LinkedIn → Success
- [ ] Test: Parallel OAuth requests → One succeeds, one fails gracefully
- [ ] Test: Different users can connect same platform account → Blocked

---

## 9️⃣ MIGRATION PLAN

### Step 1: Audit Current Data
```sql
-- Find users with multiple accounts per platform
SELECT userId, platform, COUNT(*) as account_count
FROM social_accounts
GROUP BY userId, platform
HAVING COUNT(*) > 1
ORDER BY account_count DESC;
```

### Step 2: Clean Up Duplicates
```sql
-- Keep most recent account, delete older ones
WITH ranked_accounts AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY userId, platform ORDER BY connectedAt DESC) as rn
    FROM social_accounts
)
DELETE FROM social_accounts
WHERE id IN (
    SELECT id FROM ranked_accounts WHERE rn > 1
);
```

### Step 3: Apply Schema Change
```bash
npx prisma migrate dev --name enforce_one_account_per_platform
```

---

## 🔟 FUTURE-PROOFING

### Prevent Misuse
1. **API Rate Limiting**: Prevent rapid OAuth attempts
2. **Audit Logging**: Track all account connections/disconnections
3. **Admin Dashboard**: View users with suspicious connection patterns
4. **Webhook Notifications**: Alert on unusual account activity

### Scalability
1. **Caching**: Cache `getConnectedPlatforms` results
2. **Indexing**: Ensure `[userId, platform]` is indexed for fast lookups
3. **Monitoring**: Track constraint violation rates

---

## ✅ SUCCESS CRITERIA VALIDATION

| Requirement | Implementation | Status |
|------------|----------------|--------|
| One account per platform per user | `@@unique([userId, platform])` | ✅ |
| Multiple platforms per user | No cross-platform restrictions | ✅ |
| Database enforcement | Unique constraint | ✅ |
| Backend validation | `PlatformGuard.canAttachPlatform` | ✅ |
| OAuth callback check | Pre-save validation | ✅ |
| Race condition safety | DB constraint catches duplicates | ✅ |
| Clear error messages | Custom error handling | ✅ |
| Transaction safety | Prisma transactions | ✅ |

---

## 📝 FINAL ARCHITECTURE SUMMARY

```
User Authentication Flow:
┌─────────────────────────────────────────────────────────┐
│ 1. User clicks "Connect LinkedIn"                       │
│ 2. OAuth flow → LinkedIn authorization                  │
│ 3. Callback receives tokens                             │
│ 4. CHECK: PlatformGuard.canAttachPlatform(user, 'linkedin') │
│    ├─ FALSE → Redirect with error ❌                    │
│    └─ TRUE → Proceed to save ✅                         │
│ 5. db.socialAccount.create({ userId, platform, ... })   │
│    ├─ Success → Account connected ✅                    │
│    └─ P2002 Error → Constraint violation (race) ❌      │
│ 6. Redirect to dashboard                                │
└─────────────────────────────────────────────────────────┘

Database Constraints:
┌─────────────────────────────────────────────────────────┐
│ @@unique([userId, platform])  ← ONE ACCOUNT PER PLATFORM│
│ @@unique([platform, platformAccountId]) ← NO SHARING    │
└─────────────────────────────────────────────────────────┘
```

**This architecture is production-ready, secure, and fully enforceable.** 🚀
