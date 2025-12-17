# Quick Fix: CORS Error When Publishing

## The Problem

You're getting: "Unable to connect to API server at https://amei-beauty-api.adsventures.workers.dev"

This is a **CORS (Cross-Origin Resource Sharing) issue**. Your frontend origin doesn't match what's allowed in the Workers API.

## Quick Solution (2 minutes)

### Step 1: Find Your Frontend URL

What URL are you accessing the site from?
- `https://amei-beauty.xxx.pages.dev` (Cloudflare Pages default)
- `https://amei.beauty` (custom domain)
- Something else?

### Step 2: Update CORS Configuration

Run this command (replace with your actual frontend URL):

```bash
# If using Pages.dev URL:
echo "https://amei-beauty.xxx.pages.dev" | npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production

# If using custom domain:
echo "https://amei.beauty,https://www.amei.beauty" | npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production

# If using both (recommended):
echo "https://amei-beauty.xxx.pages.dev,https://amei.beauty,https://www.amei.beauty" | npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production
```

**Or use the automated script:**
```bash
./scripts/fix-cors.sh
```

### Step 3: Wait and Test

1. Wait 1-2 minutes for changes to propagate
2. Hard refresh your browser (Ctrl+Shift+R)
3. Try publishing a card again

## What's Happening?

The Workers API is configured to only accept requests from specific origins (for security). If your frontend is at a different URL than what's configured, the browser blocks the request.

## Still Not Working?

1. **Check your frontend URL** in the browser address bar
2. **Check browser console** (F12) for the exact error
3. **Verify the secret was set:**
   ```bash
   npx wrangler secret list --config wrangler.workers.toml --env production
   ```
4. **Test the API directly:**
   ```bash
   curl https://amei-beauty-api.adsventures.workers.dev/api/health
   ```

## Need More Help?

See the detailed guide: [docs/FIX_CORS_PUBLISH_ERROR.md](docs/FIX_CORS_PUBLISH_ERROR.md)

