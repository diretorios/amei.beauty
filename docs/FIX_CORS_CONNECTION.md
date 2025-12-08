# Fixing "Unable to connect to API server" Error

## Current Status
✅ `VITE_API_URL` is now set correctly (no longer localhost)  
❌ Getting connection error: "Unable to connect to API server"

## Quick Diagnosis

### Step 1: Check the API URL Format

I noticed your URL might have a typo. Check if it's:
- ❌ `https://amei-beauty-api.adsventures.worker.dev/api` (missing 's')
- ✅ `https://amei-beauty-api.adsventures.workers.dev/api` (correct)

**Fix**: Update `VITE_API_URL` in GitHub Actions secrets if it's wrong.

### Step 2: Test Workers Health Endpoint

```bash
curl https://amei-beauty-api.adsventures.workers.dev/api/health
```

**Expected**: `{"status":"ok","timestamp":...}`

**If it fails**:
- Workers might not be deployed
- URL might be wrong
- Check: `npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api`

### Step 3: Test CORS Configuration

```bash
curl -X OPTIONS https://amei-beauty-api.adsventures.workers.dev/api/publish \
  -H "Origin: https://amei.beauty" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Look for**: `Access-Control-Allow-Origin: https://amei.beauty`

**If missing**: CORS is not configured (see fix below)

---

## Most Likely Fix: CORS Not Configured

The error "Unable to connect to API server" is often caused by **CORS blocking the request** in the browser.

### Fix: Set ALLOWED_ORIGINS Secret

```bash
npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production
```

**When prompted, enter your production domains** (comma-separated):
```
https://amei.beauty,https://www.amei.beauty
```

**Or if using Cloudflare Pages domain**:
```
https://amei-beauty.adsventures.pages.dev,https://amei.beauty
```

### Verify CORS is Set

```bash
# Check secrets (won't show values, but confirms it's set)
npx wrangler secret list --config wrangler.workers.toml --env production
```

Should see `ALLOWED_ORIGINS` in the list.

---

## Other Possible Issues

### 1. Workers Not Deployed

**Check**:
```bash
npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api
```

**Deploy if needed**:
```bash
npm run deploy:workers
```

### 2. Wrong API URL in GitHub Secrets

**Check**: GitHub → Settings → Secrets and variables → Actions → `VITE_API_URL`

**Should be**: `https://amei-beauty-api.adsventures.workers.dev/api`

**Common mistakes**:
- ❌ Missing `/api` at the end
- ❌ Using `worker.dev` instead of `workers.dev` (missing 's')
- ❌ Using `http://` instead of `https://`

**Fix**: Update the secret, then trigger new deployment:
```bash
git commit --allow-empty -m "Fix: Update VITE_API_URL"
git push origin main
```

### 3. Browser Console Errors

Open production site → DevTools (F12) → Console tab

**Look for**:
- CORS errors: `Access to fetch at ... has been blocked by CORS policy`
- Network errors: `Failed to fetch` or `NetworkError`
- `[API Error]` messages with diagnostic details

---

## Complete Fix Checklist

- [ ] Verify Workers URL is correct (check for `workers.dev` not `worker.dev`)
- [ ] Test health endpoint: `curl https://amei-beauty-api.adsventures.workers.dev/api/health`
- [ ] Set `ALLOWED_ORIGINS` secret in Workers production
- [ ] Verify `VITE_API_URL` in GitHub Actions secrets is correct
- [ ] Check browser console for specific error messages
- [ ] Test CORS preflight request
- [ ] Try publishing a card after fixes

---

## Quick Test Script

Run this to test everything:

```bash
# Test health endpoint
echo "Testing health endpoint..."
curl https://amei-beauty-api.adsventures.workers.dev/api/health

# Test CORS
echo -e "\n\nTesting CORS..."
curl -X OPTIONS https://amei-beauty-api.adsventures.workers.dev/api/publish \
  -H "Origin: https://amei.beauty" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -i "access-control"
```

---

## Still Not Working?

1. **Check Workers logs**:
   - Cloudflare Dashboard → Workers & Pages → amei-beauty-api → Logs
   - Look for errors or failed requests

2. **Check browser Network tab**:
   - Open DevTools → Network tab
   - Try to publish
   - Check the failed request:
     - Status code?
     - Response headers?
     - CORS headers present?

3. **Verify production domain**:
   - What's your actual production domain?
   - Make sure `ALLOWED_ORIGINS` includes it exactly (with `https://`)

4. **Test with diagnostic script**:
   ```bash
   npm run test:production-api https://amei-beauty-api.adsventures.workers.dev/api
   ```

---

## Expected Behavior After Fix

✅ Health endpoint returns: `{"status":"ok","timestamp":...}`  
✅ CORS preflight returns: `Access-Control-Allow-Origin: https://amei.beauty`  
✅ Browser console shows: `[API Config] Using API_BASE_URL: https://amei-beauty-api.adsventures.workers.dev/api`  
✅ Publishing a card works without errors

