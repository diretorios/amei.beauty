# Immediate Fix for "API configuration error"

## The Problem
You're seeing: **"API configuration error. The application is not properly configured for production. Please contact support."**

This means `VITE_API_URL` is either:
- ❌ Not set in GitHub Actions secrets
- ❌ Contains `localhost` (wrong for production)
- ❌ Wasn't set when the build happened

## Quick Fix (5 minutes)

### Step 1: Get Your Workers API URL

Run this command to find your Workers URL:
```bash
npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api
```

Or check in Cloudflare Dashboard:
1. Go to: Cloudflare Dashboard → Workers & Pages → `amei-beauty-api`
2. Look at the "Overview" tab
3. Find the URL (format: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev`)

**Your API URL should be**: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`
(Note: Must include `/api` at the end)

### Step 2: Set GitHub Actions Secret

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Fill in:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`
   - (Replace `YOUR_SUBDOMAIN` with your actual subdomain from Step 1)
5. Click **"Add secret"**

### Step 3: Trigger New Deployment

After setting the secret, trigger a new deployment:

```bash
git commit --allow-empty -m "Fix: Set VITE_API_URL for production"
git push origin main
```

Or push any commit to the `main` branch.

### Step 4: Verify

1. **Check GitHub Actions**:
   - Go to: GitHub → Actions tab
   - Open the latest workflow run
   - Look for "Verify VITE_API_URL secret" step
   - Should show: ✅ `VITE_API_URL is set`

2. **Wait for deployment** (usually 2-5 minutes)

3. **Check production site**:
   - Open your production site
   - Open DevTools (F12) → Console tab
   - Look for `[API Config]` messages
   - Should show: `Using API_BASE_URL: https://amei-beauty-api.xxx.workers.dev/api`
   - Should NOT show: `localhost` or `(not set)`

4. **Test publishing**:
   - Try to publish a card
   - Should work without the configuration error

## Why This Happens

Vite environment variables (like `VITE_API_URL`) are embedded **at BUILD time**, not runtime.

- ✅ **GitHub Actions secrets** → Works (build happens in GitHub Actions)
- ❌ **Cloudflare Pages environment variables** → Doesn't work (build already happened)

The build process in GitHub Actions needs the `VITE_API_URL` secret to embed the correct API URL into the JavaScript bundle.

## Still Not Working?

### Check 1: Verify Secret is Set
- GitHub → Settings → Secrets and variables → Actions
- Should see `VITE_API_URL` in the list

### Check 2: Check Latest Build
- GitHub → Actions → Latest workflow
- "Build frontend" step should use `VITE_API_URL`
- Check the logs to see what URL was used

### Check 3: Check Built Files
After deployment, check the browser console:
- Should see: `[API Config] Using API_BASE_URL: https://...`
- Should NOT see: `localhost` anywhere

### Check 4: Verify Workers URL
Make sure your Workers is deployed and accessible:
```bash
curl https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api/health
```
Should return: `{"status":"ok","timestamp":...}`

## Common Mistakes

❌ **Wrong**: `https://amei-beauty-api.xxx.workers.dev` (missing `/api`)
✅ **Correct**: `https://amei-beauty-api.xxx.workers.dev/api`

❌ **Wrong**: Setting in Cloudflare Pages dashboard
✅ **Correct**: Setting in GitHub Actions secrets

❌ **Wrong**: Setting after build already completed
✅ **Correct**: Set secret, then trigger new build

## Need More Help?

See detailed guides:
- `docs/FIX_VITE_API_URL.md` - Complete guide
- `docs/PRODUCTION_NETWORK_ERROR_FIX.md` - Troubleshooting network errors
- `docs/TROUBLESHOOTING_PUBLISH_ISSUE.md` - More troubleshooting steps

