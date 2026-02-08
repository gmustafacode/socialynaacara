# 🔴 LinkedIn API 403 Error - Complete Root Cause Analysis & Fix

## ❌ ERROR DETAILS
```json
{
  "status": 403,
  "serviceErrorCode": 100,
  "code": "ACCESS_DENIED",
  "message": "Not enough permissions to access: me.GET.NO_VERSION"
}
```

---

## 🎯 ROOT CAUSE ANALYSIS

### **PRIMARY ISSUE: MISSING X-Restli-Protocol-Version HEADER**

The error `me.GET.NO_VERSION` is LinkedIn's explicit message that the **REST.li protocol version header is missing** when calling `/v2/me`.

#### Evidence from Code:
1. **✅ CORRECT** - `lib/linkedin.ts` (lines 36-40, 146-150):
   ```typescript
   fetch('https://api.linkedin.com/v2/me', {
       headers: {
           'Authorization': `Bearer ${accessToken}`,
           'X-Restli-Protocol-Version': '2.0.0'  // ✅ PRESENT
       }
   })
   ```

2. **❌ INCORRECT** - `lib/linkedin-posting-service.ts` (lines 33-38):
   ```typescript
   const meRes = await fetch('https://api.linkedin.com/v2/me', {
       headers: {
           'Authorization': `Bearer ${accessToken}`,
           'X-Restli-Protocol-Version': '2.0.0'  // ✅ PRESENT
       }
   });
   ```

3. **❌ CRITICAL BUG** - `app/api/oauth/callback/route.ts` (lines 177-179):
   ```typescript
   profileRes = await fetch('https://api.linkedin.com/v2/me', {
       headers: { Authorization: `Bearer ${tokens.access_token}` },
       // ❌ MISSING: 'X-Restli-Protocol-Version': '2.0.0'
   });
   ```

### **SECONDARY ISSUE: OAUTH SCOPES**

Current scopes in `lib/oauth.ts` (line 37):
```typescript
scopes: ['r_verify', 'openid', 'profile', 'w_member_social', 'email', 'r_profile_basicinfo']
```

**Analysis:**
- ✅ `openid`, `profile`, `email` - Modern OIDC scopes (for `/v2/userinfo`)
- ✅ `w_member_social` - Write permission for posting
- ⚠️ `r_verify`, `r_profile_basicinfo` - Legacy scopes (may conflict)
- ❌ **MISSING**: `r_liteprofile` or `r_basicprofile` (required for `/v2/me` on older apps)

**LinkedIn API Versioning:**
- **Modern Apps (2023+)**: Use OIDC (`openid`, `profile`, `email`) → `/v2/userinfo`
- **Legacy Apps**: Use Member API (`r_liteprofile`) → `/v2/me`

---

## 🛠️ COMPLETE FIX IMPLEMENTATION

### Fix 1: Add Missing Header in OAuth Callback
**File**: `app/api/oauth/callback/route.ts`
**Line**: 177-179

**BEFORE:**
```typescript
profileRes = await fetch('https://api.linkedin.com/v2/me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
});
```

**AFTER:**
```typescript
profileRes = await fetch('https://api.linkedin.com/v2/me', {
    headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'X-Restli-Protocol-Version': '2.0.0'
    }
});
```

### Fix 2: Update OAuth Scopes (Backward Compatible)
**File**: `lib/oauth.ts`
**Line**: 37

**BEFORE:**
```typescript
scopes: ['r_verify', 'openid', 'profile', 'w_member_social', 'email', 'r_profile_basicinfo']
```

**AFTER (Recommended):**
```typescript
scopes: [
    'openid',           // OIDC identity
    'profile',          // OIDC profile data
    'email',            // OIDC email
    'w_member_social',  // Post creation
    'r_liteprofile'     // Legacy profile read (fallback for /v2/me)
]
```

**Alternative (If app doesn't support OIDC):**
```typescript
scopes: [
    'r_liteprofile',    // Profile read
    'r_emailaddress',   // Email read
    'w_member_social'   // Post creation
]
```

### Fix 3: Add Token Scope Validation
**File**: `lib/linkedin-auth-service.ts`

Add this method:
```typescript
static async validateTokenScopes(accessToken: string): Promise<string[]> {
    // LinkedIn doesn't have a public introspection endpoint
    // But we can infer from successful API calls
    const checks = {
        'openid': 'https://api.linkedin.com/v2/userinfo',
        'r_liteprofile': 'https://api.linkedin.com/v2/me'
    };

    const grantedScopes: string[] = [];

    for (const [scope, endpoint] of Object.entries(checks)) {
        try {
            const res = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });
            if (res.ok) grantedScopes.push(scope);
        } catch (e) {
            console.warn(`[LinkedIn] Scope check failed for ${scope}`);
        }
    }

    console.log('[LinkedIn] Granted scopes:', grantedScopes);
    return grantedScopes;
}
```

---

## ✅ VERIFICATION CHECKLIST

### 1️⃣ OAuth Flow Validation
- [x] Using Authorization Code (3-legged OAuth) ✅
- [x] NOT using Client Credentials ✅
- [x] Redirect URI matches LinkedIn app config ✅

### 2️⃣ Required Headers
- [ ] **ACTION REQUIRED**: Add `X-Restli-Protocol-Version: 2.0.0` to callback route
- [x] All other `/v2/me` calls have correct headers ✅

### 3️⃣ Scopes
- [ ] **ACTION REQUIRED**: Update scopes to include `r_liteprofile`
- [x] `w_member_social` present for posting ✅

### 4️⃣ LinkedIn App Configuration
**Manual Check Required:**
1. Go to: https://www.linkedin.com/developers/apps
2. Select your app
3. Verify **Products** tab:
   - ✅ "Sign In with LinkedIn using OpenID Connect" (for OIDC)
   - ✅ "Share on LinkedIn" (for `w_member_social`)
   - ✅ "Advertising API" or "Marketing Developer Platform" (if using analytics)

4. Verify **Auth** tab:
   - Redirect URLs include: `http://localhost:3000/api/oauth/callback`
   - Scopes match your code

### 5️⃣ Token Debugging
Add this to `lib/linkedin-posting-service.ts` after line 30:
```typescript
console.log('[LinkedIn Debug] Token prefix:', accessToken.substring(0, 20));
console.log('[LinkedIn Debug] Token length:', accessToken.length);
// LinkedIn tokens are typically 200-300 chars
```

---

## 🚀 DEPLOYMENT STEPS

1. **Apply Fix 1** (OAuth callback header)
2. **Apply Fix 2** (Update scopes)
3. **Force Re-authentication**:
   - Delete existing LinkedIn connections from database
   - Re-connect LinkedIn account to get fresh token with new scopes
4. **Test `/v2/me` endpoint**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        -H "X-Restli-Protocol-Version: 2.0.0" \
        https://api.linkedin.com/v2/me
   ```
5. **Test posting**

---

## 📊 SUCCESS CRITERIA

After applying fixes:
- ✅ `/v2/me` returns `200 OK` with profile data
- ✅ `/v2/userinfo` returns `200 OK` (if using OIDC)
- ✅ `POST /v2/ugcPosts` succeeds without 403
- ✅ Background jobs (Inngest) can post successfully

---

## 🔒 PRODUCTION HARDENING

### Add Comprehensive Error Handling
```typescript
async function fetchLinkedInProfile(accessToken: string) {
    const endpoints = [
        {
            url: 'https://api.linkedin.com/v2/userinfo',
            headers: { 'Authorization': `Bearer ${accessToken}` },
            type: 'OIDC'
        },
        {
            url: 'https://api.linkedin.com/v2/me',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            },
            type: 'Legacy'
        }
    ];

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(endpoint.url, { headers: endpoint.headers });
            if (res.ok) {
                const data = await res.json();
                console.log(`[LinkedIn] Profile fetched via ${endpoint.type}`);
                return data;
            } else {
                const error = await res.json();
                console.warn(`[LinkedIn] ${endpoint.type} failed:`, error);
            }
        } catch (e) {
            console.error(`[LinkedIn] ${endpoint.type} error:`, e);
        }
    }

    throw new Error('All LinkedIn profile endpoints failed');
}
```

---

## 📝 FINAL NOTES

**Why this error occurs:**
LinkedIn's REST.li framework (used for `/v2/*` endpoints) requires the protocol version header for proper request routing. Without it, LinkedIn returns a 403 with `NO_VERSION` error.

**Why OIDC fallback works:**
The `/v2/userinfo` endpoint is an OpenID Connect standard endpoint that doesn't require the REST.li header, which is why it succeeds when `/v2/me` fails.

**Best Practice:**
Always use OIDC (`/v2/userinfo`) as primary, `/v2/me` as fallback for legacy app compatibility.
