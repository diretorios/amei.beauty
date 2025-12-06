# Troubleshooting Cloudflare Pages Deployment

## Error: "Authentication error" (403) when deploying Pages

If you're seeing this error:

```
✘ [ERROR] A request to the Cloudflare API (/accounts/***/pages/projects/amei-beauty) failed.
  Authentication error [code: 10000]
```

**👉 Quick Fix:** 
- **Can't find Pages permission?** → See [QUICK_FIX_PAGES_PERMISSIONS.md](./QUICK_FIX_PAGES_PERMISSIONS.md)
- **General token setup** → See [FIX_PAGES_TOKEN_PERMISSIONS.md](./FIX_PAGES_TOKEN_PERMISSIONS.md)

### ✅ Solution Applied

**The workflow has been updated to use Wrangler CLI instead of `cloudflare/pages-action`.**

This change resolves the authentication issue because:
- Wrangler uses the same authentication mechanism as Workers deployment (which is already working)
- It's more consistent with the rest of the deployment pipeline
- It provides better error messages

The workflow now uses `npm run deploy:pages` which runs `wrangler pages deploy dist --project-name=amei-beauty`.

### Root Causes (If Still Experiencing Issues)

If you still encounter authentication errors, it may be due to:

1. **API Token Missing Pages Permissions** (Most Common)
2. **API Token Not Set in GitHub Secrets**
3. **Incorrect Account ID**
4. **Pages Project Doesn't Exist** (Wrangler will create it automatically if it has permissions)

---

## Solution Steps

### Step 1: Verify GitHub Secrets Are Set

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Verify these secrets exist:
   - ✅ `CLOUDFLARE_API_TOKEN`
   - ✅ `CLOUDFLARE_ACCOUNT_ID`

If either is missing, add them following the [GitHub Actions Secrets Guide](./GITHUB_ACTIONS_SECRETS.md).

### Step 2: Verify API Token Has Pages Permissions

1. Go to [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Find your API token (or create a new one)
3. Click **"Edit"** on the token
4. Verify it has these permissions:
   - ✅ **Account** → **Pages** → **Edit** (REQUIRED)
   - ✅ **Account** → **Workers Scripts** → **Edit**
   - ✅ **Account** → **D1** → **Edit**
   - ✅ **Account** → **R2** → **Edit** (if using R2)

### Step 3: Create/Update API Token with Pages Permissions

If your token doesn't have Pages permissions:

1. Go to [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Use the **"Edit Cloudflare Workers"** template OR create a custom token
4. **Add Pages Permission:**
   - Scroll to **Account** section
   - Find **Pages** → Select **Edit**
   - Make sure **Account Resources** includes your account (or "All accounts")
5. Click **"Continue to summary"** → **"Create Token"**
6. **Copy the token immediately** (you won't see it again!)
7. Update the `CLOUDFLARE_API_TOKEN` secret in GitHub with the new token

### Step 4: Verify Account ID

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select any domain or go to Workers & Pages
3. Look at the **right sidebar** - your Account ID is displayed there
4. Copy it and verify it matches your GitHub secret `CLOUDFLARE_ACCOUNT_ID`
5. Make sure there are **no extra spaces** when copying

### Step 5: Create Pages Project (If Needed)

Wrangler CLI will create the project automatically if it doesn't exist (as long as the API token has Pages permissions). However, if you prefer to create it manually:

1. Go to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com)
2. Click **"Create application"** → **"Pages"**
3. Connect your GitHub repository OR create manually
4. Set project name to: `amei-beauty`
5. Set build output directory to: `dist`
6. Save the project

**Note:** The workflow uses Wrangler CLI (`npm run deploy:pages`), which will work whether the project exists or not (as long as permissions are correct).

### Step 6: Test Token Permissions Locally (Optional)

You can verify your token works by running:

```bash
# Set environment variables (or use .dev.vars)
export CLOUDFLARE_API_TOKEN="your-token-here"
export CLOUDFLARE_ACCOUNT_ID="your-account-id-here"

# Verify token and account
npx wrangler whoami

# Try deploying Pages locally (this will test Pages permissions)
npm run build
npm run deploy:pages
```

If the local deployment works, the GitHub Actions workflow should also work.

---

## Quick Checklist

Before running the workflow again, verify:

- [ ] `CLOUDFLARE_API_TOKEN` secret exists in GitHub
- [ ] `CLOUDFLARE_ACCOUNT_ID` secret exists in GitHub
- [ ] API token has **Account → Pages → Edit** permission
- [ ] Account ID is correct (no extra spaces)
- [ ] API token is not expired
- [ ] Pages project `amei-beauty` exists (or will be created by the action)

---

## Still Having Issues?

1. **Check the workflow logs** - The workflow now uses Wrangler CLI which provides detailed error messages
2. **Verify Workers deployment works** - If Workers deploy successfully, Pages should also work (same token)
3. **Try creating a new API token** - Sometimes tokens can become invalid
4. **Verify token in Cloudflare Dashboard** - Make sure it's active and has all required permissions:
   - Account → Workers Scripts → Edit
   - Account → Pages → Edit
   - Account → D1 → Edit
   - Account → R2 → Edit (if using R2)
5. **Check Cloudflare Status** - Sometimes Cloudflare APIs have outages
6. **Test locally** - Run `npm run deploy:pages` locally to see if the issue is with the token or the workflow

---

## Additional Resources

- [Cloudflare API Tokens Documentation](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [Cloudflare Pages API Documentation](https://developers.cloudflare.com/pages/platform/api/)
- [GitHub Actions Secrets Guide](./GITHUB_ACTIONS_SECRETS.md)

