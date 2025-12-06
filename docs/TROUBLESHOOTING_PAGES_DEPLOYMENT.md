# Troubleshooting Cloudflare Pages Deployment

## Error: "Authentication error" (403) when deploying Pages

If you're seeing this error in your GitHub Actions workflow:

```
Cloudflare API returned non-200: 403
API returned: {"success":false,"errors":[{"code":10000,"message":"Authentication error"}]}
```

### Root Causes

This error typically occurs due to one of these issues:

1. **API Token Missing Pages Permissions** (Most Common)
2. **API Token Not Set in GitHub Secrets**
3. **Incorrect Account ID**
4. **Pages Project Doesn't Exist** (though the action should create it)

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

The GitHub Action should create the project automatically, but if it doesn't:

1. Go to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com)
2. Click **"Create application"** → **"Pages"**
3. Connect your GitHub repository OR create manually
4. Set project name to: `amei-beauty`
5. Set build output directory to: `dist`
6. Save the project

**Note:** If you create it manually, you can still use the GitHub Action for future deployments.

### Step 6: Test Token Permissions Locally (Optional)

You can verify your token works by running:

```bash
# Install wrangler if not already installed
npm install -g wrangler

# Verify token and account
npx wrangler whoami

# Try to list Pages projects (requires Pages permissions)
curl -X GET "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/pages/projects" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

Replace `YOUR_ACCOUNT_ID` and `YOUR_API_TOKEN` with your actual values.

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

1. **Check the workflow logs** - The updated workflow now includes a verification step that will show more detailed error messages
2. **Try creating a new API token** - Sometimes tokens can become invalid
3. **Verify token in Cloudflare Dashboard** - Make sure it's active and has all required permissions
4. **Check Cloudflare Status** - Sometimes Cloudflare APIs have outages

---

## Additional Resources

- [Cloudflare API Tokens Documentation](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [Cloudflare Pages API Documentation](https://developers.cloudflare.com/pages/platform/api/)
- [GitHub Actions Secrets Guide](./GITHUB_ACTIONS_SECRETS.md)

