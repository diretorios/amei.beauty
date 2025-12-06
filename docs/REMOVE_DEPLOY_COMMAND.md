# Remove Deploy Command from Cloudflare Pages

## ⚠️ Critical: This Must Be Done in Cloudflare Dashboard

The error you're seeing means Cloudflare Pages has a **deploy command** configured that's trying to run Workers deployment. This must be removed in the Cloudflare Dashboard.

## Step-by-Step Instructions

### Step 1: Go to Cloudflare Pages Dashboard

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **"Workers & Pages"** in the left sidebar
3. Click on your **`amei-beauty`** project

### Step 2: Navigate to Build Settings

1. Click **"Settings"** tab (at the top)
2. Scroll down to **"Builds & deployments"** section
3. Click **"Edit configuration"** or look for build settings

### Step 3: Remove Deploy Command

Look for these fields:

1. **Build command:** Should be `npm run build`
2. **Build output directory:** Should be `dist` (or empty - it reads from `wrangler.toml`)
3. **Deploy command:** ⚠️ **THIS MUST BE EMPTY**
   - If you see `npx wrangler deploy` or any command here, **DELETE IT**
   - Leave this field **completely empty**
4. **Root directory:** `/` (or leave empty)

### Step 4: Save Settings

1. Click **"Save"** or **"Update"**
2. Wait for confirmation

### Step 5: Trigger New Deployment

1. Go back to **"Deployments"** tab
2. Click **"Retry deployment"** on the failed deployment
   - OR push a new commit to trigger a new build

## What Should Happen

After removing the deploy command, Cloudflare Pages will:

1. ✅ Run build command: `npm run build`
2. ✅ Read output directory from `wrangler.toml` (`dist`)
3. ✅ Automatically deploy static files from `dist/`
4. ✅ **NO** deploy command runs (no `wrangler deploy`)

## Expected Build Logs (After Fix)

You should see:
```
Installing project dependencies: npm clean-install
Executing user build command: npm run build
✓ Build successful
✓ Deploying files from dist/
✓ Deployment successful
```

You should **NOT** see:
```
✘ Executing user deploy command: npx wrangler deploy
✘ [ERROR] It looks like you've run a Workers-specific command
```

## Why This Happens

- Cloudflare Pages can have a **deploy command** configured
- If set to `npx wrangler deploy`, it tries to deploy Workers
- Pages should **NOT** have a deploy command - it deploys static files automatically
- The deploy command overrides the default Pages behavior

## Verification Checklist

After making changes:

- [ ] Deploy command field is **empty** (not `npx wrangler deploy`)
- [ ] Build command is `npm run build`
- [ ] Build output directory is `dist` (or empty)
- [ ] Settings are saved
- [ ] New deployment triggered

## Still Having Issues?

If you still see the error after removing the deploy command:

1. **Check for multiple deploy commands** - Some Cloudflare Pages versions have "Post-build command" separate from "Deploy command"
2. **Clear browser cache** - Sometimes settings don't update immediately
3. **Check environment-specific settings** - Make sure Production AND Preview environments don't have deploy commands
4. **Wait a few minutes** - Settings changes can take a moment to propagate

---

**📍 Location:** Cloudflare Dashboard → Workers & Pages → amei-beauty → Settings → Builds & deployments → Deploy command (should be empty)

