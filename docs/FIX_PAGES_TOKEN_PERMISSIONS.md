# Fix API Token Pages Permissions

## Problem

You're seeing this error when deploying Pages:

```
✘ [ERROR] A request to the Cloudflare API (/accounts/***/pages/projects/amei-beauty) failed.
  Authentication error [code: 10000]
```

This means your API token doesn't have **Pages** permissions.

## Solution: Add Pages Permissions to Your API Token

### Option A: Create a Custom Token (Recommended if Pages permission is not visible)

If you don't see "Pages" or "Cloudflare Pages" in the permission list when editing an existing token, create a **Custom Token** instead:

#### Step 1: Create a Custom Token

1. Go to [Cloudflare Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. **Important:** Click **"Create Custom Token"** (don't use a template)
4. Give it a name like: `GitHub Actions - Full Deployment`

#### Step 2: Configure Account Permissions

1. Under **Permissions**, click **"Add"** or **"Edit"**
2. For each permission, click **"Add"** and configure:

   **Permission 1: Workers Scripts**
   - **Scope:** Account
   - **Permission:** Workers Scripts → Edit
   - **Account Resources:** Include → All accounts (or select your specific account)

   **Permission 2: Cloudflare Pages** (This is the key one!)
   - **Scope:** Account  
   - **Permission:** Look for **"Cloudflare Pages"** or **"Pages"** → Edit
   - If you don't see it, try searching for "Pages" in the permission dropdown
   - **Account Resources:** Include → All accounts (or select your specific account)

   **Permission 3: D1**
   - **Scope:** Account
   - **Permission:** D1 → Edit
   - **Account Resources:** Include → All accounts (or select your specific account)

   **Permission 4: R2** (if using R2)
   - **Scope:** Account
   - **Permission:** R2 → Edit
   - **Account Resources:** Include → All accounts (or select your specific account)

#### Step 3: Create and Copy Token

1. Click **"Continue to summary"**
2. Review all permissions
3. Click **"Create Token"**
4. **⚠️ CRITICAL:** Copy the token immediately - you won't see it again!
5. Update the `CLOUDFLARE_API_TOKEN` secret in GitHub with this new token

### Option B: Alternative - Use Cloudflare GitHub Integration

If you still can't find the Pages permission, you can use Cloudflare's built-in GitHub integration instead of API tokens:

1. Go to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com)
2. Click **"Create application"** → **"Pages"** → **"Connect to Git"**
3. Connect your GitHub repository
4. Configure:
   - **Project name:** `amei-beauty`
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave empty)
5. Add environment variable `VITE_API_URL` in Pages settings
6. Cloudflare will automatically deploy on every push to main

**Note:** This approach uses OAuth instead of API tokens, so you won't need Pages API token permissions.

### Step 4: Save and Copy New Token

1. Click **"Continue to summary"**
2. Review the permissions
3. Click **"Save"** or **"Update Token"**
4. **⚠️ IMPORTANT:** If Cloudflare generates a new token, copy it immediately
   - You won't be able to see it again!
   - If it's the same token, you don't need to copy anything

### Step 5: Update GitHub Secret (If Token Changed)

If Cloudflare generated a new token:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Find `CLOUDFLARE_API_TOKEN`
4. Click **"Update"**
5. Paste the new token
6. Click **"Update secret"**

**Note:** If the token didn't change (you just updated permissions), you don't need to update the GitHub secret.

### Step 6: Verify Permissions

Your token should now have these permissions:

- ✅ **Account** → **Workers Scripts** → **Edit**
- ✅ **Account** → **Pages** → **Edit** ← **This is the one you just added**
- ✅ **Account** → **D1** → **Edit**
- ✅ **Account** → **R2** → **Edit** (if using R2)

### Step 7: Test Deployment

1. Push a commit to trigger the GitHub Actions workflow
2. Or test locally:
   ```bash
   export CLOUDFLARE_API_TOKEN="your-token-here"
   export CLOUDFLARE_ACCOUNT_ID="your-account-id-here"
   npm run build
   npm run deploy:pages
   ```

---

## Troubleshooting: Can't Find Pages Permission?

If you don't see "Pages" or "Cloudflare Pages" in the permission dropdown:

1. **Try searching** - Use the search/filter box in the permissions section
2. **Check account role** - You might need account admin permissions to assign Pages permissions
3. **Use Custom Token** - Templates might not show all available permissions
4. **Contact support** - If you're on a team account, your admin might need to grant you permissions
5. **Use GitHub Integration** - See Option B above - this bypasses API token Pages permissions entirely

### What the Permission Might Be Called

The permission could be named:
- "Cloudflare Pages"
- "Pages"  
- "Pages Projects"
- "Workers Pages"

Look for any of these variations in the Account permissions section.

---

## Why This Happens

Cloudflare API tokens are permission-scoped. Your token works for Workers (which is why Workers deployment succeeds), but it needs explicit **Pages** permissions to deploy Pages projects.

The error code `10000` specifically means "Authentication error" - in this case, it's because the token doesn't have permission to access the Pages API endpoints.

---

## Still Having Issues?

1. **Double-check token permissions** - Make sure Pages → Edit is actually saved
2. **Wait a few minutes** - Sometimes permission changes take a moment to propagate
3. **Try creating a new token** - Sometimes it's easier to start fresh
4. **Check Cloudflare Status** - Make sure there are no API outages

---

## Quick Reference

- **API Tokens**: https://dash.cloudflare.com/profile/api-tokens
- **Token Permissions**: https://dash.cloudflare.com/profile/api-tokens (click on your token)
- **GitHub Secrets**: Repository → Settings → Secrets and variables → Actions

