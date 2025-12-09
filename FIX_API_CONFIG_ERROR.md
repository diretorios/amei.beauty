# 🚨 Fix: "API configuration error. The application is not properly configured for production."

## What This Error Means

This error appears when:
1. ✅ You're in production mode
2. ❌ The API URL is set to `localhost` (or not set at all)
3. ❌ A network request fails because it's trying to connect to localhost

**Root Cause**: `VITE_API_URL` is either:
- Not set in GitHub Actions secrets
- Contains `localhost` 
- Wasn't set when the build happened

## Quick Fix (5 minutes)

### Step 1: Verify Your Workers API URL

The correct URL should be:
```
https://amei-beauty-api.adsventures.workers.dev/api
```

⚠️ **Important**: 
- Must be `workers.dev` (plural, with 's'), NOT `worker.dev`
- Must include `/api` at the end
- Must use `https://` (not `http://`)

### Step 2: Check GitHub Actions Secret

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Look for `VITE_API_URL` in the secrets list

**If it's missing or wrong:**
- Click "New repository secret" (or "Update" if it exists)
- **Name**: `VITE_API_URL`
- **Value**: `https://amei-beauty-api.adsventures.workers.dev/api`
- Click "Add secret" (or "Update secret")

**Common mistakes to avoid:**
- ❌ `https://amei-beauty-api.adsventures.worker.dev/api` (missing 's' in workers)
- ❌ `https://amei-beauty-api.adsventures.workers.dev` (missing `/api`)
- ❌ `http://amei-beauty-api.adsventures.workers.dev/api` (should be `https://`)
- ❌ `http://localhost:8787/api` (won't work in production)

### Step 3: Trigger New Deployment

After updating the secret, trigger a new deployment:

```bash
git commit --allow-empty -m "Fix: Configure VITE_API_URL for production"
git push origin main
```

### Step 4: Verify the Fix

1. **Check GitHub Actions** (2-3 minutes after push):
   - Go to: GitHub → **Actions** tab
   - Open the latest workflow run
   - Look for **"Verify VITE_API_URL secret"** step
   - Should show: ✅ `VITE_API_URL is set`
   - The value shown should be: `https://amei-beauty-api.adsventures.workers.dev/api`
   - Wait for deployment to complete (usually 2-5 minutes)

2. **Check Production Site** (after deployment):
   - Open your production site: https://amei.beauty
   - Open **DevTools** (F12) → **Console** tab
   - Look for `[API Config]` messages:
     - ✅ **Good**: 
       ```
       [API Config] Production mode detected
       [API Config] VITE_API_URL: https://amei-beauty-api.adsventures.workers.dev/api
       [API Config] Using API_BASE_URL: https://amei-beauty-api.adsventures.workers.dev/api
       ```
     - ❌ **Bad**: 
       ```
       [API Config] Using API_BASE_URL: http://localhost:8787/api
       [API Config] ⚠️ WARNING: Using localhost URL in production!
       ```

3. **Test Publishing**:
   - Try to publish a card
   - Should work without the configuration error

## Why This Happens

**Vite environment variables are embedded at BUILD time, not runtime.**

This means:
- ✅ Setting `VITE_API_URL` in **GitHub Actions secrets** → Works (build happens in GitHub Actions)
- ❌ Setting `VITE_API_URL` in **Cloudflare Pages dashboard** → Doesn't work (build already happened)

The build process needs `VITE_API_URL` **before** it builds, so it must be in GitHub Actions secrets.

## Troubleshooting

### Still seeing the error after fixing?

1. **Check if secret was updated**:
   - GitHub → Settings → Secrets and variables → Actions
   - Verify `VITE_API_URL` exists and has the correct value

2. **Check if deployment completed**:
   - GitHub → Actions → Latest workflow
   - Should show all steps completed (green checkmarks)
   - Look for "Verify VITE_API_URL secret" step - should pass

3. **Check browser console**:
   - Open production site → DevTools → Console
   - Look for `[API Config]` messages
   - If still shows `localhost`, the secret wasn't set when build happened
   - Solution: Trigger a new deployment after fixing the secret

4. **Verify Workers is deployed**:
   ```bash
   curl https://amei-beauty-api.adsventures.workers.dev/api/health
   ```
   Should return: `{"status":"ok","timestamp":...}`

5. **Check for typos**:
   - Make sure it's `workers.dev` (plural), not `worker.dev`
   - Make sure it includes `/api` at the end
   - Make sure it uses `https://` not `http://`

## Summary

The error "API configuration error. The application is not properly configured for production" means your production build is trying to use `localhost` for the API URL.

**Fix**: Set `VITE_API_URL` in GitHub Actions secrets to: `https://amei-beauty-api.adsventures.workers.dev/api`

Then trigger a new deployment. The error should be resolved after the new deployment completes.

