/**
 * LinkedIn Token Validation & Debugging Utilities
 * 
 * This module provides comprehensive token validation and scope checking
 * to prevent 403 ACCESS_DENIED errors.
 */

export interface LinkedInTokenInfo {
    isValid: boolean;
    scopes: string[];
    endpoints: {
        userinfo: boolean;
        me: boolean;
    };
    errors: string[];
}

/**
 * Validates a LinkedIn access token by testing actual API endpoints.
 * This is the ONLY reliable way to check token validity since LinkedIn
 * doesn't provide a public token introspection endpoint.
 */
export async function validateLinkedInToken(accessToken: string): Promise<LinkedInTokenInfo> {
    const result: LinkedInTokenInfo = {
        isValid: false,
        scopes: [],
        endpoints: {
            userinfo: false,
            me: false
        },
        errors: []
    };

    if (!accessToken || accessToken.length < 50) {
        result.errors.push('Token is missing or too short');
        return result;
    }

    // Test 1: OIDC /v2/userinfo endpoint (Modern)
    try {
        const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (userinfoRes.ok) {
            result.endpoints.userinfo = true;
            result.scopes.push('openid', 'profile', 'email');
            result.isValid = true;
            console.log('[LinkedIn Validation] ✅ /v2/userinfo accessible (OIDC scopes present)');
        } else {
            const error = await userinfoRes.json().catch(() => ({ message: 'Unknown error' }));
            result.errors.push(`/v2/userinfo failed: ${JSON.stringify(error)}`);
            console.warn('[LinkedIn Validation] ⚠️ /v2/userinfo failed:', error);
        }
    } catch (e: any) {
        result.errors.push(`/v2/userinfo error: ${e.message}`);
    }

    // Test 2: Legacy /v2/me endpoint
    try {
        const meRes = await fetch('https://api.linkedin.com/v2/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });

        if (meRes.ok) {
            result.endpoints.me = true;
            result.scopes.push('r_liteprofile');
            result.isValid = true;
            console.log('[LinkedIn Validation] ✅ /v2/me accessible (r_liteprofile present)');
        } else {
            const error = await meRes.json().catch(() => ({ message: 'Unknown error' }));
            result.errors.push(`/v2/me failed: ${JSON.stringify(error)}`);
            console.warn('[LinkedIn Validation] ⚠️ /v2/me failed:', error);
        }
    } catch (e: any) {
        result.errors.push(`/v2/me error: ${e.message}`);
    }

    // Test 3: Check posting permission (w_member_social)
    // We can't actually test this without creating a post, so we infer from profile access
    if (result.isValid) {
        result.scopes.push('w_member_social'); // Assumed if profile works
    }

    // Deduplicate scopes
    result.scopes = [...new Set(result.scopes)];

    console.log('[LinkedIn Validation] Final result:', {
        isValid: result.isValid,
        scopes: result.scopes,
        endpoints: result.endpoints,
        errorCount: result.errors.length
    });

    return result;
}

/**
 * Gets LinkedIn profile using the most reliable endpoint available.
 * Tries OIDC first, falls back to legacy /v2/me.
 */
export async function getLinkedInProfile(accessToken: string) {
    // Try modern OIDC endpoint first
    let profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (profileRes.ok) {
        const profile = await profileRes.json();
        console.log('[LinkedIn] Profile fetched via OIDC /v2/userinfo');
        return {
            id: profile.sub,
            email: profile.email,
            name: profile.name,
            picture: profile.picture,
            firstName: profile.given_name,
            lastName: profile.family_name,
            source: 'oidc'
        };
    }

    // Fallback to legacy endpoint
    profileRes = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
        }
    });

    if (!profileRes.ok) {
        const error = await profileRes.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`LinkedIn profile fetch failed: ${JSON.stringify(error)}`);
    }

    const profile = await profileRes.json();
    console.log('[LinkedIn] Profile fetched via Legacy /v2/me');

    return {
        id: profile.id,
        email: null, // /v2/me doesn't return email
        name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        picture: null,
        firstName: profile.localizedFirstName,
        lastName: profile.localizedLastName,
        source: 'legacy'
    };
}

/**
 * Diagnostic function to log all token information
 */
export function logTokenDiagnostics(accessToken: string, context: string = 'Unknown') {
    console.log(`[LinkedIn Token Diagnostics - ${context}]`, {
        length: accessToken.length,
        prefix: accessToken.substring(0, 20) + '...',
        suffix: '...' + accessToken.substring(accessToken.length - 10),
        startsWithBearer: accessToken.startsWith('Bearer '),
        hasSpaces: accessToken.includes(' '),
        timestamp: new Date().toISOString()
    });
}
