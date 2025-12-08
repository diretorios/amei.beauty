# Fixing Production Network Errors

## Problem
Getting "Network error. Please check your connection and try again." in production.

## Quick Diagnosis

### Step 1: Check Browser Console
1. Open your production site
2. Open DevTools (F12) → Console tab
3. Look for `[API Config]` messages:
   - ✅ **Good**: Shows production API URL (e.g., `https://amei-beauty-api.xxx.workers.dev/api`)
   - ❌ **Bad**: Shows `localhost` or `(not set)`

4. Try to publish a card and check for errors:
   - Look for `[API Error]` messages with diagnostic details
   - Check Network tab → Failed requests → Check response headers

### Step 2: Run Diagnostic Script
```bash
# Test your production API
npm run test:production-api https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api
```

This will test:
- Health endpoint connectivity
- CORS configuration
- Publish endpoint accessibility

## Common Causes & Solutions

### 1. ❌ VITE_API_URL Not Set in GitHub Actions (Most Common)

**Symptom**: Browser console shows `localhost` in API URL or `[API Config] ⚠️ WARNING: Using localhost URL in production!`

**Solution**:
1. Get your Workers URL:
   ```bash
   npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api
   ```
   Or check Cloudflare Dashboard → Workers & Pages → Your Worker → Overview

2. Set GitHub Actions secret:
   - Go to: GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VITE_API_URL`
   - Value: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`
   - ⚠️ **IMPORTANT**: Must include `/api` at the end

3. Trigger new deployment:
   ```bash
   git commit --allow-empty -m "Trigger deployment with VITE_API_URL"
   git push origin main
   ```

4. Verify:
   - Check GitHub Actions → Latest workflow → "Verify VITE_API_URL secret" step should pass
   - After deployment, check browser console - should show correct API URL

**Why**: Vite environment variables are embedded at BUILD time, not runtime. Setting `VITE_API_URL` in Cloudflare Pages dashboard won't work because the build already happened in GitHub Actions.

---

### 2. ❌ CORS Not Configured (Very Common)

**Symptom**: 
- Browser console shows CORS errors
- Network tab shows failed requests with CORS-related errors
- Diagnostic script shows "CORS headers missing"

**Solution**:
```bash
# Set ALLOWED_ORIGINS secret in Workers production environment
npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production

# When prompted, enter your production domains (comma-separated):
# https://amei.beauty,https://www.amei.beauty
```

**Verify**:
```bash
# Test CORS
curl -X OPTIONS https://amei-beauty-api.xxx.workers.dev/api/publish \
  -H "Origin: https://amei.beauty" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Should see: Access-Control-Allow-Origin: https://amei.beauty
```

**Why**: If `ALLOWED_ORIGINS` is not set, Workers defaults to allowing all origins (`*`), but browsers may still block requests. Setting it explicitly ensures CORS works correctly.

---

### 3. ❌ Workers Not Deployed or Wrong URL

**Symptom**: 
- Health endpoint returns 404 or connection refused
- Diagnostic script can't reach the API

**Solution**:
```bash
# Check if Workers is deployed
npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api

# Deploy Workers if needed
npm run deploy:workers

# Test health endpoint
curl https://amei-beauty-api.xxx.workers.dev/api/health
# Should return: {"status":"ok","timestamp":...}
```

---

### 4. ❌ Wrong API URL Format

**Symptom**: API URL doesn't include `/api` or uses wrong protocol

**Common Mistakes**:
- ❌ `https://amei-beauty-api.xxx.workers.dev` (missing `/api`)
- ❌ `http://amei-beauty-api.xxx.workers.dev/api` (should be `https://`)
- ❌ `https://amei-beauty-api.xxx.workers.dev/api/` (trailing slash is OK but not required)

**Correct Format**:
- ✅ `https://amei-beauty-api.xxx.workers.dev/api`

---

### 5. ❌ ALLOWED_ORIGINS Contains Wildcard in Production

**Symptom**: CORS works but security warning, or browsers block requests

**Solution**: Remove `*` from `ALLOWED_ORIGINS` and specify exact domains:
```bash
npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production
# Enter: https://amei.beauty,https://www.amei.beauty
```

---

## Enhanced Error Messages

The application now provides better error diagnostics:

### In Browser Console
Look for `[API Error]` messages that include:
- The API URL being used
- Whether it's localhost (configuration issue)
- CORS-related errors
- Network error details

### In UI
Error messages are now more specific:
- **"API configuration error"** → `VITE_API_URL` not set correctly
- **"Network error: Unable to connect to API server"** → CORS or connectivity issue
- **"Server error"** → Workers returned 500 error

---

## Verification Checklist

After fixing the issue, verify:

- [ ] `VITE_API_URL` is set in GitHub Actions secrets (not Cloudflare Pages)
- [ ] `VITE_API_URL` includes `/api` at the end
- [ ] `VITE_API_URL` uses `https://` (not `http://`)
- [ ] `VITE_API_URL` does NOT contain `localhost`
- [ ] New deployment was triggered after setting the secret
- [ ] GitHub Actions workflow shows "Verify VITE_API_URL secret" step passing
- [ ] Browser console shows correct API URL (not localhost)
- [ ] `ALLOWED_ORIGINS` secret is set in Workers production environment
- [ ] `ALLOWED_ORIGINS` does NOT contain `*` in production
- [ ] `ALLOWED_ORIGINS` includes your production domain(s)
- [ ] Health endpoint returns success: `curl https://amei-beauty-api.xxx.workers.dev/api/health`
- [ ] CORS test passes (see Step 2 above)
- [ ] API calls work in production (try publishing a card)

---

## Still Not Working?

### 1. Check Built Files
```bash
npm run build
grep -r "localhost" dist/assets/*.js
```
If you see `localhost`, the `VITE_API_URL` wasn't set during build.

### 2. Check GitHub Actions Logs
- Go to GitHub → Actions → Latest workflow
- Check "Build frontend" step
- Verify `VITE_API_URL` is being used
- Check for any build errors

### 3. Test API Directly
```bash
# Test health endpoint
curl https://amei-beauty-api.xxx.workers.dev/api/health

# Test CORS
curl -X OPTIONS https://amei-beauty-api.xxx.workers.dev/api/publish \
  -H "Origin: https://amei.beauty" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Test publish endpoint (should return 400/401, not network error)
curl -X POST https://amei-beauty-api.xxx.workers.dev/api/publish \
  -H "Content-Type: application/json" \
  -H "Origin: https://amei.beauty" \
  -d '{}'
```

### 4. Check Workers Logs
- Go to Cloudflare Dashboard → Workers & Pages → Your Worker
- Check "Logs" tab for errors
- Look for CORS-related errors or 500 errors

### 5. Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or clear cache and reload

---

## Related Documentation

- `docs/FIX_VITE_API_URL.md` - Detailed guide for fixing VITE_API_URL
- `docs/PRODUCTION_CONFIG_VERIFICATION.md` - Complete production checklist
- `docs/TROUBLESHOOTING_PUBLISH_ISSUE.md` - More troubleshooting steps

---

## Quick Fix Summary

**Most likely fix** (covers 90% of cases):

1. Set `VITE_API_URL` in GitHub Actions secrets:
   ```
   https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api
   ```

2. Set `ALLOWED_ORIGINS` in Workers production:
   ```
   https://amei.beauty,https://www.amei.beauty
   ```

3. Trigger new deployment:
   ```bash
   git commit --allow-empty -m "Fix production API configuration"
   git push origin main
   ```

4. Wait for deployment, then test in production.

