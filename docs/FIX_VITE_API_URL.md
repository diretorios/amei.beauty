# Fixing VITE_API_URL Issues in Production

## Problem

`VITE_API_URL` is set but doesn't seem to be working in production.

## Root Cause

**Vite environment variables are embedded at BUILD time, not runtime.**

This means:
- ✅ Setting `VITE_API_URL` in **GitHub Actions secrets** → Works (build-time)
- ❌ Setting `VITE_API_URL` in **Cloudflare Pages dashboard** → Doesn't work (runtime, too late)

## Quick Diagnosis

Run the diagnostic script:

```bash
npm run check:api-url
```

Or check manually:

1. **Check browser console** (in production):
   - Open your production site
   - Open DevTools (F12) → Console tab
   - Look for `[API Config]` messages
   - If you see `localhost` in the API URL, the variable wasn't set during build

2. **Check GitHub Actions**:
   - Go to your GitHub repo → Actions tab
   - Open the latest deployment workflow
   - Look for "Verify VITE_API_URL secret" step
   - If it fails, the secret is not set

## Solution

### Step 1: Get Your Workers API URL

First, find your Workers deployment URL:

```bash
npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api
```

Or check in Cloudflare Dashboard:
- Workers & Pages → Your Worker → Overview
- The URL will be: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev`

Your API URL should be: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`

### Step 2: Set GitHub Actions Secret

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`
   - (Replace `YOUR_SUBDOMAIN` with your actual subdomain)
5. Click **"Add secret"**

### Step 3: Trigger a New Deployment

After setting the secret, trigger a new deployment:

```bash
git commit --allow-empty -m "Trigger deployment with VITE_API_URL"
git push origin main
```

Or simply push any new commit to the `main` branch.

### Step 4: Verify the Fix

1. **Check GitHub Actions**:
   - Go to Actions tab
   - Verify the "Verify VITE_API_URL secret" step passes
   - Verify the build completes successfully

2. **Check Production Site**:
   - Open your production site
   - Open DevTools → Console
   - Look for `[API Config]` messages:
     ```
     [API Config] Production mode detected
     [API Config] VITE_API_URL: https://amei-beauty-api.xxx.workers.dev/api
     [API Config] Using API_BASE_URL: https://amei-beauty-api.xxx.workers.dev/api
     ```
   - Should NOT see `localhost` in the URL

3. **Test API Calls**:
   - Try publishing a card or making any API call
   - Should work without network errors

## Common Mistakes

### ❌ Setting in Cloudflare Pages Dashboard

**Wrong**: Setting `VITE_API_URL` in Cloudflare Pages → Settings → Environment Variables

**Why it doesn't work**: The build already happened in GitHub Actions. Cloudflare Pages just serves the pre-built files.

**Fix**: Set it in GitHub Actions secrets instead (see Step 2 above).

### ❌ Using Wrong URL Format

**Wrong**: `https://amei-beauty-api.xxx.workers.dev` (missing `/api`)

**Correct**: `https://amei-beauty-api.xxx.workers.dev/api`

### ❌ Setting After Build

**Wrong**: Setting the secret after the build already completed

**Fix**: Set the secret, then trigger a new build/deployment.

## Verification Checklist

- [ ] `VITE_API_URL` secret is set in GitHub Actions
- [ ] Secret value includes `/api` at the end
- [ ] Secret value uses `https://` (not `http://`)
- [ ] Secret value does NOT include `localhost`
- [ ] New deployment was triggered after setting the secret
- [ ] GitHub Actions workflow shows "Verify VITE_API_URL secret" step passing
- [ ] Browser console shows correct API URL (not localhost)
- [ ] API calls work in production

## Still Not Working?

If you've followed all steps and it's still not working:

1. **Check the actual built files**:
   ```bash
   npm run build
   grep -r "localhost" dist/assets/*.js
   ```
   If you see `localhost` in the built files, the variable wasn't set during build.

2. **Verify secret is accessible**:
   - GitHub Actions → Your workflow → "Verify VITE_API_URL secret" step
   - Should show: `✅ VITE_API_URL is set`
   - Should NOT show: `::error::VITE_API_URL secret is not set`

3. **Check for typos**:
   - Secret name must be exactly: `VITE_API_URL` (case-sensitive)
   - No extra spaces or characters

4. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear cache and reload

5. **Check CORS**:
   - If API calls fail with CORS errors, check Workers `ALLOWED_ORIGINS` secret
   - See: `docs/PRODUCTION_CONFIG_VERIFICATION.md`

## Additional Resources

- `docs/TROUBLESHOOTING_PUBLISH_ISSUE.md` - More troubleshooting steps
- `docs/PRODUCTION_CONFIG_VERIFICATION.md` - Complete production checklist
- Run `npm run check:api-url` - Diagnostic script

