# Debugging "Server error. Please try again later."

## What This Error Means

A **500 Internal Server Error** means something went wrong on the server side (Cloudflare Workers). The error message "Server error. Please try again later." is shown when the API returns a 500 status code.

## Step 1: Check Cloudflare Workers Logs

The most important step is to check what the actual error is:

1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **amei-beauty-api**
3. Click on **"Logs"** tab (or **"Real-time Logs"**)
4. Look for recent errors when you tried to publish/use the API
5. The logs will show the actual error message

**What to look for:**
- Database connection errors
- Missing environment variables/secrets
- Code errors (TypeError, ReferenceError, etc.)
- Missing table errors (migrations not applied)

## Step 2: Common Causes & Fixes

### Cause 1: Database Migrations Not Applied

**Symptom**: Errors about missing tables or columns

**Fix**:
```bash
# Apply migrations
npx wrangler d1 migrations apply amei-beauty-db --config wrangler.workers.toml
```

Or check GitHub Actions:
- Go to: GitHub → Actions → Latest workflow
- Check if "Run migrations" step completed successfully

### Cause 2: Missing Secrets

**Symptom**: Errors about undefined environment variables

**Common missing secrets:**
- `AUTH_SECRET` - Required for token hashing
- `ALLOWED_ORIGINS` - Required for CORS (though defaults to `*`)

**Fix**:
```bash
# Set AUTH_SECRET (if missing)
npx wrangler secret put AUTH_SECRET --config wrangler.workers.toml --name amei-beauty-api

# Set ALLOWED_ORIGINS (if needed)
npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --name amei-beauty-api
# Value: https://amei.beauty,https://www.amei.beauty
```

### Cause 3: Database Connection Issues

**Symptom**: Errors about database not found or connection failed

**Fix**:
1. Check D1 database exists:
   - Cloudflare Dashboard → Workers & Pages → D1
   - Verify `amei-beauty-db` exists

2. Check database binding:
   - Workers & Pages → amei-beauty-api → Settings → Variables
   - Verify `DB` binding is set to `amei-beauty-db`

### Cause 4: Code Errors

**Symptom**: TypeError, ReferenceError, or other JavaScript errors in logs

**Fix**:
1. Check Workers logs for the exact error
2. Look at the stack trace to find which file/line
3. Common issues:
   - Undefined variables
   - Missing imports
   - Type errors
   - Null/undefined access

### Cause 5: R2/KV Access Issues

**Symptom**: Errors about R2 bucket or KV namespace

**Fix**:
1. Check bindings in Workers settings:
   - `IMAGES` → Should be bound to R2 bucket
   - `RATE_LIMIT_KV` → Should be bound to KV namespace

2. Verify resources exist:
   - R2 → Check `amei-beauty-images` bucket exists
   - KV → Check namespace exists

## Step 3: Test API Endpoints

Test individual endpoints to isolate the issue:

```bash
# Test health endpoint (should always work)
curl https://amei-beauty-api.adsventures.workers.dev/api/health

# Test publish endpoint (might fail with 500)
curl -X POST https://amei-beauty-api.adsventures.workers.dev/api/publish \
  -H "Content-Type: application/json" \
  -H "Origin: https://amei.beauty" \
  -d '{"profile":{"full_name":"Test"}}' \
  -v
```

## Step 4: Check Browser Console

1. Open your production site: https://amei.beauty
2. Open **DevTools** (F12) → **Console** tab
3. Try to publish a card
4. Look for `[API Error]` messages with details

**What to look for:**
```
[API Error] Server error details: {
  url: "...",
  endpoint: "/publish",
  status: 500,
  statusText: "Internal Server Error",
  apiBaseUrl: "..."
}
```

## Step 5: Verify Workers Deployment

1. Check if Workers is deployed:
   - Cloudflare Dashboard → Workers & Pages → amei-beauty-api
   - Check "Deployments" tab
   - Should show recent successful deployment

2. Check GitHub Actions:
   - GitHub → Actions → Latest workflow
   - "Deploy Workers" step should be completed (green checkmark)

## Step 6: Check Environment Variables

Verify all required environment variables are set:

1. Go to: Cloudflare Dashboard → Workers & Pages → amei-beauty-api → Settings → Variables
2. Check:
   - **Secrets**: `AUTH_SECRET`, `ALLOWED_ORIGINS` (if set)
   - **Environment Variables**: `ENVIRONMENT` (should be "production" in production env)

## Quick Diagnostic Checklist

- [ ] Checked Cloudflare Workers logs for actual error
- [ ] Verified database migrations are applied
- [ ] Verified all required secrets are set (`AUTH_SECRET`)
- [ ] Verified database binding is correct
- [ ] Verified R2/KV bindings are correct
- [ ] Tested health endpoint (should return 200)
- [ ] Checked browser console for detailed error messages
- [ ] Verified Workers deployment completed successfully

## Getting More Details

### Enable Detailed Logging

The Workers code already logs errors. To see more details:

1. **Cloudflare Dashboard Logs**:
   - Workers & Pages → amei-beauty-api → Logs
   - Shows `console.error()` and `console.log()` output

2. **Browser Console**:
   - Check for `[API Error]` messages
   - These show diagnostic information

### Common Error Messages

**"Cannot read property 'X' of undefined"**:
- Missing data or incorrect data structure
- Check the request payload

**"Database error"**:
- Database connection issue or query error
- Check migrations are applied
- Check database binding

**"AUTH_SECRET is not defined"**:
- Missing secret
- Set `AUTH_SECRET` secret in Workers

**"Table 'cards' doesn't exist"**:
- Migrations not applied
- Run: `npx wrangler d1 migrations apply amei-beauty-db --config wrangler.workers.toml`

## Still Not Working?

If you've checked everything above:

1. **Share the error from Workers logs**:
   - Copy the exact error message from Cloudflare Dashboard → Logs
   - Include the stack trace if available

2. **Share the browser console output**:
   - Copy the `[API Error]` messages from browser console

3. **Check when it started**:
   - Did it work before?
   - What changed recently?
   - Was there a recent deployment?

4. **Test the health endpoint**:
   ```bash
   curl https://amei-beauty-api.adsventures.workers.dev/api/health
   ```
   - If this fails, the Workers might not be deployed correctly
   - If this works, the issue is with a specific endpoint

