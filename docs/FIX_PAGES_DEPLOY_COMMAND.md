# Fix: Cloudflare Pages Running Workers Deploy Command

## Problem

Cloudflare Pages is trying to run `npx wrangler deploy` (Workers command) instead of deploying Pages, giving this error:

```
✘ [ERROR] It looks like you've run a Workers-specific command in a Pages project.
  For Pages, please run `wrangler pages deploy` instead.
```

## Root Cause

Cloudflare Pages detects `main = "workers/index.ts"` in `wrangler.toml` and thinks it should deploy Workers instead of Pages. Additionally, a deploy command may be configured in Cloudflare Pages settings.

## Solution: Remove Deploy Command from Cloudflare Pages

Cloudflare Pages should **NOT** have a deploy command configured. It should only:
1. Build your project (`npm run build`)
2. Deploy the static files from `dist/`

### Step-by-Step Fix

1. **Go to Cloudflare Pages Dashboard**
   - Navigate to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com)
   - Click on your `amei-beauty` project

2. **Go to Settings → Builds & deployments**

3. **Remove the Deploy Command**
   - Look for **"Deploy command"** or **"Post-build command"**
   - **Delete/clear** any command like `npx wrangler deploy` or similar
   - Leave it **empty**

4. **Verify Build Settings**
   - **Build command:** `npm run build`
   - **Build output directory:** `dist` (or leave empty - it reads from `wrangler.toml`)
   - **Deploy command:** (should be empty)

5. **Save Settings**

6. **Trigger a New Deployment**
   - Push a commit to trigger a new build
   - Or manually trigger from the dashboard

## Alternative: Use Separate Config Files

If you need to keep a deploy command, you can use separate config files:

### Option A: Rename wrangler.toml for Workers

1. Rename `wrangler.toml` to `wrangler.workers.toml`
2. Create a new `wrangler.toml` with only Pages config:

```toml
name = "amei-beauty"
pages_build_output_dir = "dist"
```

3. Update Workers deployment to use the renamed file:
   ```bash
   wrangler deploy --config wrangler.workers.toml --name amei-beauty-api
   ```

### Option B: Use wrangler.pages.toml (if supported)

Some versions of Cloudflare Pages support `wrangler.pages.toml`. If your version supports it:
- Keep `wrangler.toml` for Workers (with `main` field)
- Use `wrangler.pages.toml` for Pages (without `main` field)

## Recommended Configuration

### Cloudflare Pages Settings

- ✅ **Build command:** `npm run build`
- ✅ **Build output directory:** `dist` (or empty - reads from `wrangler.toml`)
- ✅ **Deploy command:** (empty - let Pages deploy static files automatically)
- ✅ **Root directory:** `/` (or empty)

### wrangler.toml for Pages

```toml
name = "amei-beauty"
pages_build_output_dir = "dist"
# NO 'main' field - that's for Workers only
```

### wrangler.toml for Workers

```toml
name = "amei-beauty-api"  # or use --name flag
main = "workers/index.ts"
compatibility_date = "2024-01-01"
# ... rest of Workers config
```

## Why This Happens

- `main` field in `wrangler.toml` indicates a Workers project
- Cloudflare Pages sees this and tries to deploy Workers instead
- A deploy command in Pages settings overrides the default behavior
- Pages should deploy static files, not run Workers commands

## Verification

After removing the deploy command:
1. Push a commit
2. Check the build logs
3. You should see:
   - ✅ Build command runs (`npm run build`)
   - ✅ Files are deployed from `dist/`
   - ✅ No `wrangler deploy` command runs

---

**Quick Fix:** Go to Cloudflare Pages → Settings → Builds → Remove any deploy command → Save → Deploy

