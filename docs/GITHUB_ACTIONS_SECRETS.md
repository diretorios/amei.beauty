# GitHub Actions Secrets Setup Guide

This guide walks you through setting up the required secrets for GitHub Actions to deploy your application to Cloudflare.

## Required Secrets

Your GitHub Actions workflow (`.github/workflows/deploy.yml`) requires the following secrets:

1. **`CLOUDFLARE_API_TOKEN`** - Required for deploying Workers and Pages
2. **`CLOUDFLARE_ACCOUNT_ID`** - Required for deploying Workers and Pages
3. **`VITE_API_URL`** - Optional (has fallback), but recommended for production builds

---

## Step-by-Step Setup

### Step 1: Get Your Cloudflare Account ID

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select any domain or go to the Workers & Pages section
3. Look at the **right sidebar** - your Account ID is displayed there
4. **Copy the Account ID** (it's a long string of characters)

   **Alternative method:**
   - Go to any Workers or Pages project
   - The Account ID is visible in the URL or in the project settings
   - Or run: `npx wrangler whoami` (if you have wrangler installed locally)

### Step 2: Create a Cloudflare API Token

1. Go to [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Click **"Get started"** on the "Edit Cloudflare Workers" template (or create a custom token)
4. Configure the token permissions:
   - **Account** → **Workers Scripts** → **Edit**
   - **Account** → **Workers KV Storage** → **Edit** (if using KV)
   - **Account** → **D1** → **Edit** (for database migrations)
   - **Account** → **R2** → **Edit** (if using R2)
   - **Account** → **Pages** → **Edit** (for Pages deployment)
   - **Zone** → **Zone** → **Read** (if using custom domains)
5. Set **Account Resources**:
   - Select **"Include"** → **"All accounts"** (or select your specific account)
6. Set **Zone Resources** (if using custom domains):
   - Select **"Include"** → **"All zones"** (or specific zones)
7. Click **"Continue to summary"**
8. Review and click **"Create Token"**
9. **⚠️ IMPORTANT:** Copy the token immediately - you won't be able to see it again!
   - The token will look like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: Get Your Workers API URL (for VITE_API_URL)

If you've already deployed your Workers, you can get the URL:

1. Go to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com)
2. Click on your Worker (e.g., `amei-beauty-api`)
3. Copy the **Workers URL** (e.g., `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev`)
4. The full API URL will be: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`

**Note:** If you haven't deployed Workers yet, you can:
- Deploy manually first: `npx wrangler deploy`
- Or use a placeholder and update it later

### Step 4: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** (in the repository, not your account settings)
3. In the left sidebar, click **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"**

#### Add CLOUDFLARE_API_TOKEN:
- **Name:** `CLOUDFLARE_API_TOKEN`
- **Secret:** Paste the API token you created in Step 2
- Click **"Add secret"**

#### Add CLOUDFLARE_ACCOUNT_ID:
- Click **"New repository secret"** again
- **Name:** `CLOUDFLARE_ACCOUNT_ID`
- **Secret:** Paste your Account ID from Step 1
- Click **"Add secret"**

#### Add VITE_API_URL (Optional but Recommended):
- Click **"New repository secret"** again
- **Name:** `VITE_API_URL`
- **Secret:** Your Workers API URL (e.g., `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`)
- Click **"Add secret"**

---

## Verification

### Verify Secrets Are Set

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. You should see all three secrets listed:
   - ✅ `CLOUDFLARE_API_TOKEN`
   - ✅ `CLOUDFLARE_ACCOUNT_ID`
   - ✅ `VITE_API_URL` (optional)

### Test the Workflow

1. Make a small change to your code (or just push to main)
2. Go to **Actions** tab in your GitHub repository
3. Watch the workflow run
4. Check that:
   - ✅ Tests pass
   - ✅ Workers deploy successfully
   - ✅ Pages deploy successfully

If deployment fails, check the workflow logs for specific errors.

---

## Troubleshooting

### Error: "Invalid API Token"

**Problem:** The API token is incorrect or doesn't have the right permissions.

**Solution:**
1. Verify the token in Cloudflare Dashboard → API Tokens
2. Make sure the token has all required permissions (Workers, D1, Pages, R2)
3. Create a new token if needed
4. Update the secret in GitHub

### Error: "Account ID not found"

**Problem:** The Account ID is incorrect.

**Solution:**
1. Double-check your Account ID in Cloudflare Dashboard
2. Make sure there are no extra spaces when copying
3. Update the secret in GitHub

### Error: "Build failed - VITE_API_URL not set"

**Problem:** The build is trying to use VITE_API_URL but it's not set.

**Solution:**
1. This is optional - the workflow has a fallback to `http://localhost:8787/api`
2. For production, add the `VITE_API_URL` secret with your actual Workers URL
3. The format should be: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`

### Error: "Database not found" or "Migration failed"

**Problem:** The database ID in `wrangler.toml` might be incorrect, or migrations need to be run.

**Solution:**
1. Verify `database_id` in `wrangler.toml` matches your D1 database
2. Run migrations locally first: `npx wrangler d1 migrations apply amei-beauty-db`
3. Check that the API token has D1 permissions

---

## Security Best Practices

1. **Never commit secrets to git** - Always use GitHub Secrets
2. **Use least privilege** - Only grant the minimum permissions needed
3. **Rotate tokens regularly** - Update API tokens periodically
4. **Use environment-specific secrets** - Consider using different tokens for staging/production
5. **Review token permissions** - Periodically audit what permissions your tokens have

---

## Quick Reference

### Required Secrets Summary

| Secret Name | Where to Get It | Required? |
|------------|----------------|-----------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens | ✅ Yes |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → Right sidebar | ✅ Yes |
| `VITE_API_URL` | Your deployed Workers URL + `/api` | ⚠️ Recommended |

### GitHub Actions Secrets Location

```
Repository → Settings → Secrets and variables → Actions → New repository secret
```

### Cloudflare API Token Permissions Needed

- ✅ Workers Scripts: Edit
- ✅ D1: Edit
- ✅ R2: Edit (if using R2)
- ✅ Pages: Edit
- ✅ Zone: Read (if using custom domains)

---

## Next Steps

After setting up secrets:

1. ✅ Push a commit to trigger the workflow
2. ✅ Verify deployment succeeds
3. ✅ Test your deployed application
4. ✅ Monitor Cloudflare Dashboard for usage

---

## Additional Resources

- [Cloudflare API Tokens Documentation](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Cloudflare Workers Deployment Guide](https://developers.cloudflare.com/workers/get-started/guide/)

---

**Need Help?** Check the workflow logs in GitHub Actions for specific error messages.

