# Fix: Missing owner_token_hash Column

## Problem

Getting error:
```
D1_ERROR: no such column: owner_token_hash at offset 11: SQLITE_ERROR
```

This means the database migration `0003_add_owner_token_auth.sql` hasn't been applied to production.

## Solution: Apply Missing Migration

### Option 1: Apply via GitHub Actions (Recommended)

The migration should run automatically in GitHub Actions, but if it failed:

1. **Check GitHub Actions**:
   - Go to: GitHub → Actions → Latest workflow
   - Find "Run migrations" step
   - Check if it completed successfully
   - If it failed, check the error message

2. **Trigger a new deployment**:
   ```bash
   git commit --allow-empty -m "Trigger migration for owner_token_hash column"
   git push origin main
   ```

3. **Wait for deployment** and check if migrations ran successfully

### Option 2: Apply Manually (If GitHub Actions Failed)

If the GitHub Actions migration step keeps failing, apply it manually:

```bash
# Apply the migration manually
npx wrangler d1 migrations apply amei-beauty-db --config wrangler.workers.toml --env production
```

**Note**: You'll need:
- `CLOUDFLARE_API_TOKEN` environment variable set
- `CLOUDFLARE_ACCOUNT_ID` environment variable set
- Or be logged in via `npx wrangler login`

### Option 3: Apply via Cloudflare Dashboard

1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **D1** → **amei-beauty-db**
3. Click **"Migrations"** tab
4. Click **"Apply migration"** or **"Run migration"**
5. Select `0003_add_owner_token_auth.sql`
6. Click **"Apply"**

## Verify Migration Applied

After applying the migration, verify it worked:

```bash
# Check database schema
npx wrangler d1 execute amei-beauty-db --config wrangler.workers.toml --command "PRAGMA table_info(cards);" --env production
```

You should see `owner_token_hash` in the column list.

Or test via API:

```bash
# Try publishing a card
curl -X POST https://amei-beauty-api.adsventures.workers.dev/api/publish \
  -H "Content-Type: application/json" \
  -H "Origin: https://amei.beauty" \
  -d '{"profile":{"full_name":"Test"}}'
```

Should work without the "no such column" error.

## What the Migration Does

The migration `0003_add_owner_token_auth.sql` adds:

```sql
ALTER TABLE cards ADD COLUMN owner_token_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_owner_token_hash ON cards(owner_token_hash);
```

This column stores hashed authentication tokens for card owners.

## Why This Happened

The migration exists in the codebase but wasn't applied to production. This can happen if:
- Migration step failed in GitHub Actions
- Migration was added after initial deployment
- Manual database changes were made

## Prevention

To prevent this in the future:

1. **Always check GitHub Actions** after deployment:
   - Verify "Run migrations" step completed successfully
   - Check for any migration errors

2. **Test migrations locally first**:
   ```bash
   npm run d1:migrate
   ```

3. **Verify database schema** after deployment:
   - Check that all expected columns exist
   - Test critical operations (publish, update, delete)

