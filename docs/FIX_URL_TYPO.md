# 🚨 FIX: API URL Typo in GitHub Actions Secret

## Problem Identified

Your `VITE_API_URL` secret in GitHub Actions has a typo:
- ❌ **Current (WRONG)**: `https://amei-beauty-api.adsventures.worker.dev/api` (missing 's')
- ✅ **Correct**: `https://amei-beauty-api.adsventures.workers.dev/api` (with 's')

The domain should be `workers.dev` (plural), not `worker.dev` (singular).

## Verification

Tested both URLs:
```bash
# Wrong URL (fails)
curl https://amei-beauty-api.adsventures.worker.dev/api/health
# Result: Host not found (exit code 6)

# Correct URL (works)
curl https://amei-beauty-api.adsventures.workers.dev/api/health
# Result: {"status":"ok","timestamp":1765239730351}
```

## Fix Steps

### Step 1: Update GitHub Actions Secret

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Find `VITE_API_URL` in the list
4. Click **"Update"** (or delete and recreate)
5. Change the value to: `https://amei-beauty-api.adsventures.workers.dev/api`
   - ⚠️ **Important**: Make sure it's `workers.dev` (with 's'), not `worker.dev`
6. Click **"Update secret"**

### Step 2: Trigger New Deployment

After updating the secret, trigger a new deployment:

```bash
git commit --allow-empty -m "Fix: Update VITE_API_URL with correct workers.dev domain"
git push origin main
```

### Step 3: Verify the Fix

1. **Check GitHub Actions** (2-3 minutes after push):
   - Go to: GitHub → **Actions** tab
   - Open the latest workflow run
   - Look for **"Verify VITE_API_URL secret"** step
   - Should show: ✅ `VITE_API_URL is set`
   - The value shown should be: `https://amei-beauty-api.adsventures.workers.dev/api`

2. **Check Production Site** (after deployment completes):
   - Open your production site: https://amei.beauty
   - Open **DevTools** (F12) → **Console** tab
   - Look for `[API Config]` messages:
     - ✅ **Good**: `Using API_BASE_URL: https://amei-beauty-api.adsventures.workers.dev/api`
     - ❌ **Bad**: `Using API_BASE_URL: https://amei-beauty-api.adsventures.worker.dev/api` (still wrong)

3. **Test API Connection**:
   - Try to publish a card or make any API call
   - Should work without "Unable to connect to API server" errors

## Why This Happens

Cloudflare Workers URLs always use the domain `*.workers.dev` (plural). The typo `worker.dev` (singular) doesn't exist, so DNS resolution fails, causing the connection error.

## Additional Notes

- ✅ CORS is already configured correctly (tested and verified)
- ✅ Workers API is deployed and responding
- ✅ The only issue is the typo in the GitHub Actions secret

Once you fix the secret and redeploy, the connection error should be resolved.

