# Fix: "Can't redefine existing key" Error

## Problem

Cloudflare Pages is showing this error:

```
✘ [ERROR] Can't redefine existing key
    /opt/buildhome/repo/wrangler.toml:3:23:
      3 │ name = "amei-beauty-api"
```

This means `wrangler.toml` has the `name` key defined twice, or Cloudflare Pages is reading multiple config files.

## Root Cause

Cloudflare Pages might be:
1. Reading both `wrangler.toml` and `wrangler.workers.toml` and merging them
2. Cloudflare's PR modified `wrangler.toml` to include Workers config
3. There's a duplicate `name` key in `wrangler.toml`

## Solution

### Step 1: Verify wrangler.toml is Pages-Only

Your `wrangler.toml` should ONLY have:

```toml
name = "amei-beauty"
pages_build_output_dir = "dist"
```

**It should NOT have:**
- ❌ `main = "workers/index.ts"` (Workers field)
- ❌ `name = "amei-beauty-api"` (Workers name)
- ❌ Any Workers-specific configuration

### Step 2: Ensure Only One Name Key

Check your `wrangler.toml` file:

```bash
grep "^name\s*=" wrangler.toml
```

You should see only ONE line:
```
name = "amei-beauty"
```

If you see two `name` lines, remove the duplicate.

### Step 3: Verify Workers Config is Separate

Your `wrangler.workers.toml` should have:
```toml
name = "amei-beauty-api"
main = "workers/index.ts"
# ... rest of Workers config
```

### Step 4: Check Cloudflare Pages Settings

1. Go to Cloudflare Dashboard → Workers & Pages → Your project
2. Go to Settings → Builds & deployments
3. Verify:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Deploy command:** (empty - no deploy command)
   - **Root directory:** `/` (or empty)

### Step 5: If Cloudflare's PR Modified the File

If Cloudflare's PR added Workers config to `wrangler.toml`:

1. **Accept the PR** (if it makes `wrangler.toml` Pages-only)
2. **OR manually fix** `wrangler.toml` to be Pages-only
3. **Ensure** `wrangler.workers.toml` exists for Workers deployment

## Current Correct Configuration

### wrangler.toml (Pages only)
```toml
name = "amei-beauty"
pages_build_output_dir = "dist"
```

### wrangler.workers.toml (Workers only)
```toml
name = "amei-beauty-api"
main = "workers/index.ts"
compatibility_date = "2024-01-01"
# ... rest of config
```

### package.json scripts
```json
{
  "deploy:workers": "wrangler deploy --config wrangler.workers.toml --name amei-beauty-api",
  "dev:workers": "wrangler dev --config wrangler.workers.toml --name amei-beauty-api"
}
```

## Verification

After fixing:

1. **Check wrangler.toml:**
   ```bash
   cat wrangler.toml
   ```
   Should only show Pages config.

2. **Check for duplicate name keys:**
   ```bash
   grep "^name\s*=" wrangler.toml
   ```
   Should show only one line.

3. **Push and test:**
   - Push the corrected `wrangler.toml`
   - Cloudflare Pages should build successfully
   - Workers deployment should still work using `wrangler.workers.toml`

---

**Quick Fix:** Ensure `wrangler.toml` has only `name = "amei-beauty"` (no duplicate, no Workers config)

