# 🚨 FIX THIS NOW - API Configuration Error

## Current Problem
Your production build is using `localhost` for the API URL, which doesn't work in production.

## ✅ Fix in 3 Steps (5 minutes)

### Step 1: Get Your Workers API URL

**Option A: Using Wrangler CLI**
```bash
npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api
```

**Option B: Using Cloudflare Dashboard**
1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **amei-beauty-api**
3. Click **Overview** tab
4. Find the URL (format: `https://amei-beauty-api.xxx.workers.dev`)

**Your API URL format should be**: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`
⚠️ **IMPORTANT**: Must include `/api` at the end!

---

### Step 2: Set GitHub Actions Secret

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** button
4. Fill in:
   - **Name**: `VITE_API_URL`
   - **Secret**: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`
     (Replace `YOUR_SUBDOMAIN` with your actual subdomain from Step 1)
5. Click **"Add secret"**

---

### Step 3: Trigger New Deployment

Run these commands:
```bash
git commit --allow-empty -m "Fix: Configure VITE_API_URL for production"
git push origin main
```

**Or** push any commit to the `main` branch.

---

## ✅ Verify It's Fixed

### 1. Check GitHub Actions (2-3 minutes after push)
- Go to: GitHub → **Actions** tab
- Open the latest workflow run
- Look for **"Verify VITE_API_URL secret"** step
- Should show: ✅ `VITE_API_URL is set`
- Wait for deployment to complete (usually 2-5 minutes)

### 2. Check Production Site (after deployment)
1. Open your production site
2. Open **DevTools** (F12) → **Console** tab
3. Look for `[API Config]` messages:
   - ✅ **Good**: `Using API_BASE_URL: https://amei-beauty-api.xxx.workers.dev/api`
   - ❌ **Bad**: `Using API_BASE_URL: http://localhost:8787/api`

### 3. Test Publishing
- Try to publish a card
- Should work without the configuration error

---

## Why This Happens

Vite environment variables are embedded **at BUILD time**, not runtime:
- ✅ **GitHub Actions secrets** → Works (build happens in GitHub Actions)
- ❌ **Cloudflare Pages environment variables** → Doesn't work (build already happened)

The build process needs `VITE_API_URL` **before** it builds, so it must be in GitHub Actions secrets.

---

## Still Seeing the Error?

### Check 1: Is the secret set?
- GitHub → Settings → Secrets and variables → Actions
- Should see `VITE_API_URL` in the list

### Check 2: Did deployment complete?
- GitHub → Actions → Latest workflow
- Should show all steps completed (green checkmarks)

### Check 3: Check browser console
- Open production site → DevTools → Console
- Look for `[API Config]` messages
- If still shows `localhost`, the secret wasn't set when build happened

### Check 4: Verify Workers is deployed
```bash
curl https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api/health
```
Should return: `{"status":"ok","timestamp":...}`

---

## Quick Reference

**Get Workers URL:**
```bash
npm run get:workers-url
```

**Test API:**
```bash
npm run test:production-api https://amei-beauty-api.xxx.workers.dev/api
```

**Check Configuration:**
```bash
npm run check:api-url
```

---

## Need More Help?

See detailed guides:
- `docs/IMMEDIATE_FIX.md` - Step-by-step fix guide
- `docs/FIX_VITE_API_URL.md` - Complete troubleshooting
- `docs/PRODUCTION_NETWORK_ERROR_FIX.md` - Network error fixes

