# ✅ Update VITE_API_URL Secret - Correct Value

## The Correct Value

Since GitHub encrypts secrets and you can't see the current value, here's the **exact correct value** you need to set:

```
https://amei-beauty-api.adsventures.workers.dev/api
```

## Step-by-Step: Update the Secret

### Step 1: Delete the Old Secret

1. Go to: GitHub → Your Repository → **Settings** → **Secrets and variables** → **Actions**
2. Find `VITE_API_URL` in the list
3. Click the **trash icon** (or "Delete") next to it
4. Confirm deletion

**Why delete first?** This ensures you're starting fresh and won't accidentally keep a typo.

### Step 2: Create the Secret with Correct Value

1. In the same page (Secrets and variables → Actions)
2. Click **"New repository secret"** button
3. Fill in:
   - **Name**: `VITE_API_URL` (exactly this, case-sensitive)
   - **Secret**: Copy and paste this **exact value**:
     ```
     https://amei-beauty-api.adsventures.workers.dev/api
     ```
4. **Double-check before clicking "Add secret"**:
   - ✅ Starts with `https://` (not `http://`)
   - ✅ Contains `workers.dev` (plural, with 's')
   - ✅ Ends with `/api`
   - ✅ No extra spaces before or after
   - ✅ No trailing slash after `/api`

5. Click **"Add secret"**

### Step 3: Verify via GitHub Actions

After creating the secret, trigger a deployment to verify it's correct:

```bash
git commit --allow-empty -m "Verify VITE_API_URL secret is set correctly"
git push origin main
```

Then check GitHub Actions:

1. Go to: GitHub → **Actions** tab
2. Open the latest workflow run
3. Find the **"Verify VITE_API_URL secret"** step
4. **What to look for**:
   - ✅ Should show: `✅ VITE_API_URL is set`
   - ✅ Should show: `Value: https://amei-beauty-api.adsventures.workers.dev/api`
   - ❌ Should NOT show any warnings about localhost
   - ❌ Should NOT show warnings about URL format

5. Check the **"Build frontend"** step:
   - ✅ Should complete successfully
   - ✅ Should NOT show: "Build still contains localhost URLs!"

### Step 4: Verify Production Site

After deployment completes (2-5 minutes):

1. Open: https://amei.beauty
2. Open **DevTools** (F12) → **Console** tab
3. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
4. Look for `[API Config]` messages

**Expected (GOOD):**
```
[API Config] Production mode detected
[API Config] VITE_API_URL: https://amei-beauty-api.adsventures.workers.dev/api
[API Config] Using API_BASE_URL: https://amei-beauty-api.adsventures.workers.dev/api
```

**If you see this (BAD):**
```
[API Config] Using API_BASE_URL: http://localhost:8787/api
```

This means the secret wasn't applied correctly.

## Common Copy-Paste Mistakes

When copying the URL, watch out for:

1. **Extra spaces**:
   - ❌ ` https://amei-beauty-api.adsventures.workers.dev/api ` (spaces before/after)
   - ✅ `https://amei-beauty-api.adsventures.workers.dev/api` (no spaces)

2. **Missing 's' in workers**:
   - ❌ `https://amei-beauty-api.adsventures.worker.dev/api` (missing 's')
   - ✅ `https://amei-beauty-api.adsventures.workers.dev/api` (with 's')

3. **Missing /api**:
   - ❌ `https://amei-beauty-api.adsventures.workers.dev` (missing /api)
   - ✅ `https://amei-beauty-api.adsventures.workers.dev/api` (with /api)

4. **Wrong protocol**:
   - ❌ `http://amei-beauty-api.adsventures.workers.dev/api` (http)
   - ✅ `https://amei-beauty-api.adsventures.workers.dev/api` (https)

## Quick Copy-Paste Template

Here's the exact value you can copy (no spaces, correct format):

```
https://amei-beauty-api.adsventures.workers.dev/api
```

**Copy the line above** and paste it directly into the GitHub secret value field.

## Verification Checklist

After updating the secret and triggering a deployment:

- [ ] Secret `VITE_API_URL` exists in GitHub Actions secrets
- [ ] GitHub Actions "Verify VITE_API_URL secret" step shows the correct URL
- [ ] GitHub Actions "Build frontend" step completes without errors
- [ ] GitHub Actions "Build frontend" step does NOT show "localhost URLs" error
- [ ] Production site console shows correct API URL (not localhost)
- [ ] Can publish a card without "API configuration error"

## Still Not Working?

If after following these steps it's still not working:

1. **Check GitHub Actions logs**:
   - What does "Verify VITE_API_URL secret" step show?
   - Copy the output and check if the URL is correct

2. **Check browser console**:
   - What does `[API Config]` show?
   - Is it still showing localhost?

3. **Try deleting and recreating again**:
   - Sometimes there can be caching issues
   - Delete the secret completely
   - Wait 1 minute
   - Recreate it with the exact value above
   - Trigger a new deployment

