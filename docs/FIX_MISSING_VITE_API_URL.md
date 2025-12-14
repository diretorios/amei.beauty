# 🚨 Fix: VITE_API_URL Not Set in Production

## Current Error

You're seeing this error in production:
```
[API Config] ⚠️ WARNING: Using localhost URL in production!
[API Config] VITE_API_URL must be set during build time in GitHub Actions secrets.
```

This means `VITE_API_URL` is **not set** in your GitHub Actions secrets, or it's set incorrectly.

## Quick Fix (5 minutes)

### Step 1: Set the GitHub Actions Secret

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** (or **"Update"** if it already exists)
4. Fill in:
   - **Name**: `VITE_API_URL` (exactly this, case-sensitive)
   - **Value**: `https://amei-beauty-api.adsventures.workers.dev/api`
   - ⚠️ **Important**: 
     - No leading or trailing spaces
     - Must include `/api` at the end
     - Must use `https://` (not `http://`)
     - Must be `workers.dev` (plural, with 's')
5. Click **"Add secret"** (or **"Update secret"**)

### Step 2: Trigger a New Deployment

After setting/updating the secret, trigger a new deployment:

```bash
git commit --allow-empty -m "Fix: Set VITE_API_URL for production"
git push origin main
```

Or push any commit to the `main` branch.

### Step 3: Verify the Fix

1. **Check GitHub Actions** (2-3 minutes after push):
   - Go to: GitHub → **Actions** tab
   - Open the latest workflow run
   - Look for **"Verify VITE_API_URL secret"** step
   - Should show: ✅ `VITE_API_URL is set`
   - Look for **"Build frontend"** step
   - Should show: ✅ `Build verified: No localhost URLs found in dist/`
   - Wait for deployment to complete (usually 2-5 minutes)

2. **Check Production Site** (after deployment):
   - Open: https://amei.beauty
   - Open **DevTools** (F12) → **Console** tab
   - **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
   - Look for `[API Config]` messages:
     - ✅ **Good**: 
       ```
       [API Config] Production mode detected
       [API Config] VITE_API_URL: https://amei-beauty-api.adsventures.workers.dev/api
       [API Config] Using API_BASE_URL: https://amei-beauty-api.adsventures.workers.dev/api
       ```
     - ❌ **Bad** (still broken):
       ```
       [API Config] Using API_BASE_URL: http://localhost:8787/api
       [API Config] ⚠️ WARNING: Using localhost URL in production!
       ```

3. **Test Publishing**:
   - Try to publish a card
   - Should work without errors

## Why This Happens

**Vite environment variables are embedded at BUILD time, not runtime.**

This means:
- ✅ Setting `VITE_API_URL` in **GitHub Actions secrets** → Works (build happens in GitHub Actions)
- ❌ Setting `VITE_API_URL` in **Cloudflare Pages dashboard** → Doesn't work (build already happened)

The build process needs `VITE_API_URL` **before** it builds, so it must be in GitHub Actions secrets.

## Common Mistakes

1. **Setting in Cloudflare Pages instead of GitHub Actions**:
   - ❌ Cloudflare Pages → Environment Variables → `VITE_API_URL`
   - ✅ GitHub Actions → Secrets → `VITE_API_URL`

2. **Wrong URL format**:
   - ❌ `https://amei-beauty-api.adsventures.worker.dev/api` (missing 's' in workers)
   - ❌ `https://amei-beauty-api.adsventures.workers.dev` (missing `/api`)
   - ❌ `http://amei-beauty-api.adsventures.workers.dev/api` (should be `https://`)
   - ✅ `https://amei-beauty-api.adsventures.workers.dev/api` (correct)

3. **Leading/trailing spaces**:
   - ❌ ` https://amei-beauty-api.adsventures.workers.dev/api ` (has spaces)
   - ✅ `https://amei-beauty-api.adsventures.workers.dev/api` (no spaces)

## Still Not Working?

1. **Verify the secret exists**:
   - GitHub → Settings → Secrets and variables → Actions
   - Should see `VITE_API_URL` in the list

2. **Check the latest deployment**:
   - GitHub → Actions → Latest workflow
   - Look for "Build frontend" step
   - Check if it shows the correct API URL
   - Check if it shows any errors

3. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear cache and reload

4. **Check if deployment completed**:
   - Wait 5-10 minutes after pushing
   - Check Cloudflare Pages dashboard to see if deployment finished

## Need Help?

If you're still seeing the error after:
- ✅ Setting `VITE_API_URL` in GitHub Actions secrets
- ✅ Triggering a new deployment
- ✅ Waiting for deployment to complete
- ✅ Hard refreshing the browser

Then check:
1. GitHub Actions logs for the "Build frontend" step
2. Browser console for `[API Config]` messages
3. Verify the secret value is exactly: `https://amei-beauty-api.adsventures.workers.dev/api`

