# LinkedIn OAuth Debug Guide

## Your Current Configuration

### LinkedIn App Settings (from your portal)
- **Client ID**: `YOUR_CLIENT_ID`
- **Client Secret**: `YOUR_CLIENT_SECRET`
- **Redirect URI**: `http://localhost:3000/api/oauth/callback`

### Approved Scopes (from your portal)
- `r_verify` - Get your profile verification
- `openid` - Use your name and photo
- `profile` - Use your name and photo
- `w_member_social` - Create, modify, and delete posts
- `email` - Use the primary email address
- `r_profile_basicinfo` - Access your basic profile information

### Current Request Scopes
We're requesting: `openid profile email w_member_social`

## Common LinkedIn OAuth Errors

### 1. `unauthorized_scope_error`
**Cause**: Requesting scopes that aren't approved for your app
**Fix**: 
- Go to LinkedIn Developer Portal > Your App > Products tab
- Ensure "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect" are approved
- Wait for approval if pending

### 2. `redirect_uri_mismatch`
**Cause**: The redirect URI doesn't exactly match what's in your app settings
**Fix**:
- Verify `http://localhost:3000/api/oauth/callback` is in your "Authorized redirect URLs"
- Check for trailing slashes, http vs https, port numbers

### 3. `invalid_client_id` or `invalid_client_secret`
**Cause**: Credentials don't match
**Fix**:
- Double-check you copied the Client ID and Secret correctly
- Regenerate the Client Secret if needed

### 4. `access_denied`
**Cause**: User clicked "Cancel" or app doesn't have required products
**Fix**:
- Click "Allow" when LinkedIn asks for permissions
- Ensure products are approved in developer portal

## Testing Steps

1. **Clear any existing setup records**:
   ```sql
   DELETE FROM social_accounts WHERE platform = 'linkedin' AND status = 'setup';
   ```

2. **Try with minimal scopes first**:
   Start with just: `openid profile email`
   
3. **Check LinkedIn Developer Portal**:
   - Products tab: Are "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect" showing as "Approved"?
   - Auth tab: Is the redirect URI exactly `http://localhost:3000/api/oauth/callback`?

4. **Check browser console**:
   - Open DevTools (F12)
   - Look for any error messages when clicking "Initiate Handshake"

## Next Steps

If you're still seeing "Bummer, something went wrong":
1. Check the URL you're redirected to - it should contain `?error=something`
2. Share that error code
3. Verify your LinkedIn app products are fully approved (not pending)
