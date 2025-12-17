# Fix: CORS Error When Publishing Cards

## Problem

You're getting this error when trying to publish a card:

```
Unable to connect to API server at https://amei-beauty-api.adsventures.workers.dev. 
This could be a CORS issue, network problem, or the server may be down.
```

## Root Cause

The Workers API has CORS configured to only allow requests from specific origins. If your frontend is running from a different origin than what's configured in `ALLOWED_ORIGINS`, the browser will block the requests.

**Common scenarios:**
- Frontend is at `https://amei-beauty.xxx.pages.dev` but `ALLOWED_ORIGINS` only includes `https://amei.beauty`
- Frontend is at `https://amei.beauty` but `ALLOWED_ORIGINS` is not set or set incorrectly

## Quick Fix

### Option 1: Use the Fix Script (Recommended)

Run the automated fix script:

```bash
./scripts/fix-cors.sh
```

The script will:
1. Detect your Pages URL automatically
2. Check current CORS configuration
3. Update `ALLOWED_ORIGINS` to include your frontend origin
4. Verify the fix

### Option 2: Manual Fix

#### Step 1: Find Your Frontend URL

Check what URL your frontend is running on:
- Cloudflare Pages URL: `https://amei-beauty.xxx.pages.dev`
- Custom domain: `https://amei.beauty`

You can find your Pages URL by:
```bash
npx wrangler pages deployment list --project-name=amei-beauty
```

Or check in the Cloudflare Dashboard → Pages → Your Project → Deployments

#### Step 2: Update ALLOWED_ORIGINS Secret

Update the `ALLOWED_ORIGINS` secret to include your frontend origin(s):

```bash
# If using custom domain
npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production
# When prompted, enter: https://amei.beauty,https://www.amei.beauty

# If using Pages.dev URL
npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production
# When prompted, enter: https://amei-beauty.xxx.pages.dev

# If using both (recommended)
npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production
# When prompted, enter: https://amei-beauty.xxx.pages.dev,https://amei.beauty,https://www.amei.beauty
```

**Important:**
- Use comma-separated list for multiple origins
- Include protocol (`https://`)
- No trailing slashes
- No spaces between origins

#### Step 3: Verify the Fix

Test CORS with curl:

```bash
# Replace with your actual Pages URL
curl -X OPTIONS https://amei-beauty-api.adsventures.workers.dev/api/publish \
  -H "Origin: https://amei-beauty.xxx.pages.dev" \
  -H "Access-Control-Request-Method: POST" \
  -i | grep -i "access-control-allow-origin"
```

You should see:
```
access-control-allow-origin: https://amei-beauty.xxx.pages.dev
```

If you see `access-control-allow-origin: *` or a different origin, the configuration hasn't updated yet (wait 1-2 minutes).

#### Step 4: Test in Browser

1. Open your frontend in the browser
2. Open DevTools (F12) → Console tab
3. Try to publish a card
4. Check for CORS errors

## Verify Current Configuration

Check what `ALLOWED_ORIGINS` is currently set to:

```bash
npx wrangler secret list --config wrangler.workers.toml --env production
```

## Common Issues

### Issue: "Secret not found"

If `ALLOWED_ORIGINS` is not set, the Workers defaults to allowing all origins (`*`). However, this may not work correctly in all browsers. Set it explicitly:

```bash
npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production
```

### Issue: "Still getting CORS errors after update"

1. **Wait 1-2 minutes** - Changes can take time to propagate
2. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. **Clear browser cache** if needed
4. **Check the exact origin** in browser DevTools → Network tab → Request Headers → `Origin`
5. **Verify the secret** was set correctly:
   ```bash
   npx wrangler secret list --config wrangler.workers.toml --env production
   ```

### Issue: "Multiple origins not working"

Make sure origins are comma-separated with **no spaces**:

✅ **Correct:**
```
https://amei-beauty.xxx.pages.dev,https://amei.beauty,https://www.amei.beauty
```

❌ **Wrong:**
```
https://amei-beauty.xxx.pages.dev, https://amei.beauty  (has spaces)
https://amei-beauty.xxx.pages.dev/,https://amei.beauty/  (has trailing slashes)
```

## Testing CORS Configuration

### Test from Command Line

```bash
# Test OPTIONS (preflight)
curl -X OPTIONS https://amei-beauty-api.adsventures.workers.dev/api/publish \
  -H "Origin: https://amei-beauty.xxx.pages.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -i

# Test actual POST request
curl -X POST https://amei-beauty-api.adsventures.workers.dev/api/publish \
  -H "Origin: https://amei-beauty.xxx.pages.dev" \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}' \
  -i
```

### Test in Browser Console

Open your frontend in the browser and run:

```javascript
// Check what origin the page is using
console.log('Current origin:', window.location.origin);

// Test API call
fetch('https://amei-beauty-api.adsventures.workers.dev/api/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(r => r.json())
  .then(data => console.log('✅ API call successful:', data))
  .catch(err => console.error('❌ API call failed:', err));
```

## Prevention

To avoid this issue in the future:

1. **Include all possible origins** in `ALLOWED_ORIGINS`:
   - Pages.dev URL (for preview deployments)
   - Custom domain (for production)
   - www version of custom domain (if used)

2. **Use the fix script** before deploying:
   ```bash
   ./scripts/fix-cors.sh
   ```

3. **Document your origins** in your deployment notes

## See Also

- [CORS Configuration Guide](./FIX_CORS_CONNECTION.md)
- [Production Deployment Script](./PRODUCTION_DEPLOYMENT_SCRIPT.md)
- [Workers Configuration](../wrangler.workers.toml)

