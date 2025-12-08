# Troubleshooting: Card Not Publishing in Production

## Problem
After completing card details, the card does not seem to be publishing in production.

## Root Causes

### 1. Missing `VITE_API_URL` Environment Variable (Most Likely)
**Symptom**: API calls fail silently or show network errors.

**Why it happens**: 
- The frontend uses `import.meta.env.VITE_API_URL` to determine the API endpoint
- If not set, it falls back to `http://localhost:8787/api`
- In production, this localhost URL doesn't work, causing all API calls to fail

**How to verify**:
1. Open browser DevTools (F12) → Console tab
2. Try to publish a card
3. Look for errors like:
   - `Failed to fetch`
   - `NetworkError`
   - `Unable to connect to server`

**How to fix**:

#### ⚠️ IMPORTANT: Set in GitHub Actions Secrets (REQUIRED)
**Note**: Vite environment variables are embedded at BUILD time, not runtime. Setting `VITE_API_URL` in Cloudflare Pages dashboard will NOT work because the build already happened in GitHub Actions.

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`
4. Push a new commit to trigger redeployment

**Why not Cloudflare Pages?**: Cloudflare Pages environment variables are runtime-only. Since Vite embeds `VITE_*` variables during the build process (which happens in GitHub Actions), setting it in Cloudflare Pages has no effect. You can safely delete `VITE_API_URL` from Cloudflare Pages settings if it's there.

#### Option C: Verify Workers URL
First, get your Workers URL:
```bash
npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api
```

Or check in Cloudflare Dashboard → Workers & Pages → Your Worker → Overview

The URL should be: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev`

### 2. CORS Configuration Issue
**Symptom**: API calls fail with CORS errors in browser console.

**Why it happens**:
- Workers `ALLOWED_ORIGINS` secret is not set or doesn't include your Pages domain
- Default allows all origins (`*`) which may be blocked in production

**How to fix**:
```bash
# Set ALLOWED_ORIGINS secret in Workers production environment
npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production

# When prompted, enter your Pages domain(s), comma-separated:
# Example: https://amei-beauty.YOUR_SUBDOMAIN.pages.dev,https://amei.beauty
```

### 3. Workers Not Deployed
**Symptom**: API endpoint returns 404 or connection refused.

**How to verify**:
```bash
# Check if Workers is deployed
curl https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api/health

# Should return: {"status":"ok","timestamp":...}
```

**How to fix**:
```bash
# Deploy Workers
npm run deploy:workers

# Or manually
npx wrangler deploy --config wrangler.workers.toml --env production
```

### 4. Database Migrations Not Applied
**Symptom**: Publish succeeds but card doesn't appear in directory.

**How to verify**:
```bash
# Check if migrations are applied
npx wrangler d1 migrations list amei-beauty-db --config wrangler.workers.toml
```

**How to fix**:
```bash
# Apply migrations
npx wrangler d1 migrations apply amei-beauty-db --config wrangler.workers.toml --env production
```

## Recent Improvements

### Visible Error Messages
The `PublishButton` component now shows visible error messages when publishing fails:
- Network errors
- Authentication errors
- Username conflicts
- API configuration errors

### Better Error Handling
- Network errors are caught and displayed
- API URL validation checks for localhost in production
- More descriptive error messages

## Verification Steps

1. **Check API URL in Production**:
   ```javascript
   // Open browser console on production site
   console.log(import.meta.env.VITE_API_URL);
   // Should NOT be: http://localhost:8787/api
   // Should be: https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api
   ```

2. **Test API Endpoint**:
   ```bash
   curl https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api/health
   ```

3. **Test Publish from Browser Console**:
   ```javascript
   // On production site, open console
   const card = await storage.loadCard();
   const publishedCard = await api.publish(card, 'test-username');
   console.log('Published:', publishedCard);
   ```

4. **Check Browser Network Tab**:
   - Open DevTools → Network tab
   - Try to publish
   - Look for `/api/publish` request
   - Check if it succeeds (200) or fails (error status)

## Quick Fix Checklist

- [ ] `VITE_API_URL` is set in **GitHub Actions secrets** (NOT Cloudflare Pages)
- [ ] `VITE_API_URL` points to correct Workers URL (not localhost)
- [ ] `VITE_API_URL` is removed from Cloudflare Pages settings (if it was set there)
- [ ] Workers is deployed and accessible
- [ ] `ALLOWED_ORIGINS` secret is set in Workers (if using custom domain)
- [ ] Database migrations are applied
- [ ] No CORS errors in browser console
- [ ] API health check returns success

## Still Having Issues?

1. Check browser console for specific error messages
2. Check Workers logs in Cloudflare Dashboard
3. Verify all environment variables are set correctly
4. Test API endpoint directly with curl or Postman
5. Check that both Workers and Pages are deployed to production environment

