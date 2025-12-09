# Fix Cloudflare API Token Permissions

## Problem

The GitHub Actions deployment is failing with:
```
Authentication error [code: 10000]
Missing permissions: User->User Details->Read, User->Memberships->Read
```

## Solution: Update API Token Permissions

The Cloudflare API token needs specific permissions for deploying Workers and Pages.

### Step 1: Go to Cloudflare API Tokens

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Find your API token (the one used in GitHub Actions secrets)
3. Click **"Edit"** (or create a new one if needed)

### Step 2: Set Required Permissions

Your API token needs these permissions:

#### Account Permissions

**Workers Scripts:**
- ✅ **Edit** (required for deploying Workers)

**Workers KV Storage:**
- ✅ **Edit** (if using KV namespaces)

**D1:**
- ✅ **Edit** (required for running migrations)

**R2:**
- ✅ **Edit** (if using R2 buckets for images)

**Cloudflare Pages:**
- ✅ **Edit** (required for deploying Pages)

**Account Settings:**
- ✅ **Read** (optional, but helpful for debugging)

#### Zone Permissions (if using custom domains)

If you're using custom domains (like `amei.beauty`), you may also need:

**Zone Settings:**
- ✅ **Read** (optional)

**DNS:**
- ✅ **Read** (optional, if managing DNS records)

### Step 3: Account Resources

Make sure the token has access to:
- ✅ **Include** → **All accounts** (or your specific account)
- ✅ **Include** → **All zones** (or your specific zone if using custom domains)

### Step 4: User Permissions (Optional but Recommended)

For better error messages and debugging:

**User:**
- ✅ **User Details** → **Read** (helps with error messages)
- ✅ **Memberships** → **Read** (helps verify account access)

### Step 5: Update GitHub Actions Secret

After updating the token:

1. Go to: GitHub → Your Repository → **Settings** → **Secrets and variables** → **Actions**
2. Find `CLOUDFLARE_API_TOKEN`
3. Click **"Update"**
4. Paste the **new token value** (or same token if you just updated permissions)
5. Click **"Update secret"**

### Step 6: Test Deployment

Trigger a new deployment:

```bash
git commit --allow-empty -m "Test deployment with updated API token permissions"
git push origin main
```

## Quick Reference: Minimum Required Permissions

For this project, the token needs at minimum:

```
Account:
  - Workers Scripts: Edit
  - D1: Edit
  - Cloudflare Pages: Edit
  - R2: Edit (if using R2)
  - Workers KV Storage: Edit (if using KV)

Account Resources:
  - Include: All accounts (or your specific account)

User (optional but recommended):
  - User Details: Read
  - Memberships: Read
```

## Creating a New Token (If Needed)

If you prefer to create a new token:

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Use **"Create Custom Token"**
4. Name it: `amei-beauty-deployment` (or similar)
5. Set permissions as described above
6. Set account resources to your account
7. Click **"Continue to summary"**
8. Click **"Create Token"**
9. **Copy the token immediately** (you won't be able to see it again)
10. Update `CLOUDFLARE_API_TOKEN` in GitHub Actions secrets

## Troubleshooting

### Still Getting Permission Errors?

1. **Check token permissions**:
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Click on your token
   - Verify all required permissions are set

2. **Check account access**:
   - Make sure the token has access to your account
   - Account ID should match `CLOUDFLARE_ACCOUNT_ID` secret

3. **Verify secrets are set**:
   - GitHub → Settings → Secrets and variables → Actions
   - Both `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` should be set

4. **Check token hasn't expired**:
   - API tokens don't expire, but check if it was revoked
   - Create a new token if needed

### Common Permission Issues

**"Authentication error [code: 10000]"**:
- Token doesn't have required permissions
- Token is invalid or revoked
- Account ID doesn't match

**"Unable to retrieve email"**:
- Missing `User->User Details->Read` permission (not critical, but helpful)

**"Unable to get membership roles"**:
- Missing `User->Memberships->Read` permission (not critical, but helpful)

**"Failed to deploy Pages"**:
- Missing `Cloudflare Pages->Edit` permission
- Token doesn't have access to the account

## Security Note

⚠️ **Important**: API tokens with "Edit" permissions are powerful. Keep them secure:
- Store only in GitHub Actions secrets (never commit to git)
- Use the minimum permissions needed
- Rotate tokens periodically
- Don't share tokens publicly

