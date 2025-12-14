# 🔍 Diagnose "API configuration error" - Step by Step

## Quick Diagnosis Steps

Since you've recreated the secret but are still getting the error, let's diagnose systematically.

### Step 1: Check GitHub Actions Logs

1. Go to: GitHub → Your Repository → **Actions** tab
2. Open the **most recent** workflow run
3. Find the **"Verify VITE_API_URL secret"** step
4. **What does it show?**
   - Copy/paste the output here
   - Does it show `✅ VITE_API_URL is set`?
   - What URL does it show?

5. Find the **"Build frontend"** step
   - Did it complete successfully?
   - Any errors about localhost?

### Step 2: Check Production Site Console

1. Open: https://amei.beauty
2. Open **DevTools** (F12) → **Console** tab
3. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
4. Look for `[API Config]` messages immediately on page load
5. **What do you see?** Copy/paste the messages here

**Expected (GOOD):**
```
[API Config] Production mode detected
[API Config] VITE_API_URL: https://amei-beauty-api.adsventures.workers.dev/api
[API Config] Using API_BASE_URL: https://amei-beauty-api.adsventures.workers.dev/api
```

**If you see this (BAD):**
```
[API Config] Production mode detected
[API Config] VITE_API_URL: (not set)
[API Config] Using API_BASE_URL: http://localhost:8787/api
[API Config] ⚠️ WARNING: Using localhost URL in production!
```

### Step 3: Verify Secret Value

The secret value must be **exactly**:
```
https://amei-beauty-api.adsventures.workers.dev/api
```

**Double-check:**
- ✅ Starts with `https://` (not `http://`)
- ✅ Contains `workers.dev` (plural, with 's'), NOT `worker.dev`
- ✅ Ends with `/api`
- ✅ No extra spaces before or after
- ✅ No trailing slash after `/api` (optional but recommended without)

### Step 4: Check Deployment Timing

**Critical**: The deployment must happen **AFTER** you recreated the secret.

1. When did you recreate the secret? (approximate time)
2. When did the last deployment complete? (check GitHub Actions)
3. Was the deployment **after** you recreated the secret?

**If the deployment happened BEFORE you recreated the secret:**
- The old build (with localhost) is still deployed
- You need to trigger a NEW deployment

### Step 5: Trigger New Deployment

If you haven't triggered a deployment since recreating the secret:

```bash
git commit --allow-empty -m "Trigger deployment after recreating VITE_API_URL secret"
git push origin main
```

Wait 2-5 minutes for deployment to complete, then check again.

## Common Issues & Solutions

### Issue 1: Secret Value Has Typo

**Symptom**: GitHub Actions shows the secret is set, but production still shows localhost

**Check**: 
- Is it `workers.dev` (with 's') or `worker.dev` (without 's')?
- Does it include `/api` at the end?

**Fix**: Update the secret with the exact value: `https://amei-beauty-api.adsventures.workers.dev/api`

### Issue 2: Deployment Happened Before Secret Was Recreated

**Symptom**: Secret is correct, but production still shows old behavior

**Fix**: Trigger a new deployment after fixing the secret

### Issue 3: Secret Name Is Wrong

**Symptom**: GitHub Actions shows secret is not set

**Check**: 
- Secret name must be exactly: `VITE_API_URL` (case-sensitive)
- Not `VITE_API_URLS` (plural)
- Not `VITE_API` (missing `_URL`)

**Fix**: Delete and recreate with exact name: `VITE_API_URL`

### Issue 4: Build Cache Issue

**Symptom**: Everything looks correct but still not working

**Fix**: 
1. Delete the secret completely
2. Wait 1 minute
3. Recreate it with exact value: `https://amei-beauty-api.adsventures.workers.dev/api`
4. Trigger a new deployment

## Enhanced Workflow Validation

I've updated the GitHub Actions workflow to provide better validation. The next deployment will:

1. ✅ Verify the secret is set
2. ✅ Check if it contains localhost (will fail if it does)
3. ✅ Validate the URL format
4. ✅ Check the build output for localhost URLs

This will help catch configuration issues during deployment.

## Next Steps

1. **Check GitHub Actions logs** (Step 1 above)
2. **Check browser console** (Step 2 above)
3. **Share the output** so we can diagnose further
4. **If secret looks correct but still not working**, trigger a new deployment

## Quick Test

After the next deployment completes, run this locally to check what's in the build:

```bash
npm run check:build
```

This will scan the built files and show what API URLs are actually embedded.

