# Quick Fix: Pages Permission Not Showing

## The Problem

You can't find "Pages" or "Cloudflare Pages" in the API token permissions dropdown.

## Quick Solution: Create Custom Token

### Step-by-Step (with screenshots guidance)

1. **Go to API Tokens**
   - https://dash.cloudflare.com/profile/api-tokens
   - Click **"Create Token"**
   - Click **"Create Custom Token"** (bottom option, NOT a template)

2. **Name Your Token**
   - Token name: `GitHub Actions Deployment`

3. **Add Permissions One by One**

   Click **"Add"** for each permission:

   **a) Workers Scripts**
   - Click **"Add"** under Permissions
   - **Account** → **Workers Scripts** → **Edit**
   - **Account Resources:** Include → All accounts

   **b) Cloudflare Pages** ⭐ (This is what you're looking for!)
   - Click **"Add"** again
   - **Account** → Look for **"Cloudflare Pages"** or **"Pages"**
   - If you see it: Select **Edit**
   - If you DON'T see it: See "Alternative Solutions" below
   - **Account Resources:** Include → All accounts

   **c) D1**
   - Click **"Add"**
   - **Account** → **D1** → **Edit**
   - **Account Resources:** Include → All accounts

   **d) R2** (if you use R2)
   - Click **"Add"**
   - **Account** → **R2** → **Edit**
   - **Account Resources:** Include → All accounts

4. **Create Token**
   - Click **"Continue to summary"**
   - Review permissions
   - Click **"Create Token"**
   - **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

5. **Update GitHub Secret**
   - GitHub repo → Settings → Secrets → Actions
   - Update `CLOUDFLARE_API_TOKEN` with the new token

---

## Alternative Solutions

### Option 1: Use Cloudflare GitHub Integration (No API Token Needed!)

This bypasses the API token Pages permission issue entirely:

1. Go to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com)
2. Click **"Create application"** → **"Pages"** → **"Connect to Git"**
3. Authorize Cloudflare to access your GitHub
4. Select your repository
5. Configure:
   - **Project name:** `amei-beauty`
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
6. Add environment variable:
   - Go to project → Settings → Environment Variables
   - Add `VITE_API_URL` = your Workers API URL
7. **Disable the Pages deployment step in GitHub Actions** (since Cloudflare will deploy automatically)

Then update your `.github/workflows/deploy.yml` to skip Pages deployment:

```yaml
deploy-pages:
  name: Deploy Pages
  runs-on: ubuntu-latest
  needs: [test, deploy-workers]
  if: false  # Disable - Cloudflare GitHub integration handles this
  steps:
    - name: Pages deployed via Cloudflare GitHub integration
      run: echo "Pages deployment handled by Cloudflare GitHub integration"
```

### Option 2: Check Your Account Role

If you're on a team/organization account:
- You might need **Admin** or **Owner** role to assign Pages permissions
- Ask your account admin to create the token for you
- Or ask them to grant you the necessary permissions

### Option 3: Use Global API Key (Not Recommended)

⚠️ **Security Warning:** Global API keys have full account access. Only use if absolutely necessary.

1. Go to [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Scroll to **"API Keys"** section
3. Click **"View"** next to "Global API Key"
4. Use this instead of API token (but update GitHub secret)

**Better:** Use Option 1 (GitHub Integration) instead of this.

---

## Verify It Works

After updating the token:

```bash
# Test locally
export CLOUDFLARE_API_TOKEN="your-new-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
npm run build
npm run deploy:pages
```

If this works locally, GitHub Actions will work too.

---

## Still Stuck?

1. **Check Cloudflare documentation:** https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
2. **Contact Cloudflare support** - They can help verify your account permissions
3. **Use GitHub Integration** (Option 1) - This is often easier and more reliable

