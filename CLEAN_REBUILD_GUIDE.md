# Clean Rebuild Guide - Cloudflare Resources

This guide walks you through deleting existing Cloudflare resources and rebuilding them from scratch with the correct names.

## ⚠️ Important Warnings

- **Deleting resources is PERMANENT** - all data will be lost
- **Backup any important data** before proceeding
- **This will delete**: Workers, D1 databases, R2 buckets, and Pages projects

---

## Step 1: List Existing Resources

First, let's see what you currently have deployed:

### 1.1 List Workers

```bash
npx wrangler deployments list
```

Or check via dashboard:
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Overview
- Look for any workers with old names like:
  - `amei-cards-api`
  - `amei--api`
  - Any other variations

### 1.2 List D1 Databases

```bash
npx wrangler d1 list
```

Or via dashboard:
- Cloudflare Dashboard → Workers & Pages → D1 → Databases
- Look for databases like:
  - `amei-cards-db`
  - Any other old database names

### 1.3 List R2 Buckets

```bash
npx wrangler r2 bucket list
```

Or via dashboard:
- Cloudflare Dashboard → R2 → Manage R2 API Tokens → Buckets
- Look for buckets like:
  - `amei-cards-images`
  - Any other old bucket names

### 1.4 List Pages Projects

```bash
npx wrangler pages project list
```

Or via dashboard:
- Cloudflare Dashboard → Workers & Pages → Pages → Overview
- Look for projects like:
  - `amei-cards`
  - Any other old project names

---

## Step 2: Delete Existing Resources

### 2.1 Delete Workers

**Option A: Via CLI**

```bash
# Delete specific worker
npx wrangler delete <worker-name>

# Example:
npx wrangler delete amei-cards-api
npx wrangler delete amei--api
```

**Option B: Via Dashboard**

1. Go to Cloudflare Dashboard → Workers & Pages → Overview
2. Find the worker you want to delete
3. Click on it → Settings → Delete Worker
4. Confirm deletion

### 2.2 Delete D1 Databases

**⚠️ WARNING: This permanently deletes all data!**

**Option A: Via CLI**

```bash
# Delete D1 database
npx wrangler d1 delete <database-name>

# Example:
npx wrangler d1 delete amei-cards-db
```

**Option B: Via Dashboard**

1. Go to Cloudflare Dashboard → Workers & Pages → D1 → Databases
2. Find the database you want to delete
3. Click on it → Settings → Delete Database
4. Type the database name to confirm
5. Click Delete

### 2.3 Delete R2 Buckets

**⚠️ WARNING: This permanently deletes all files!**

**Option A: Via CLI**

```bash
# First, delete all objects in the bucket (if any)
npx wrangler r2 object list <bucket-name> | xargs -I {} npx wrangler r2 object delete <bucket-name> {}

# Then delete the bucket
npx wrangler r2 bucket delete <bucket-name>

# Example:
npx wrangler r2 bucket delete amei-cards-images
```

**Option B: Via Dashboard**

1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens → Buckets
2. Find the bucket you want to delete
3. Click on it → Settings → Delete Bucket
4. Type the bucket name to confirm
5. Click Delete

**Note**: You may need to delete all objects first before deleting the bucket.

### 2.4 Delete Pages Projects

**Option A: Via CLI**

```bash
# Delete Pages project
npx wrangler pages project delete <project-name>

# Example:
npx wrangler pages project delete amei-cards
```

**Option B: Via Dashboard**

1. Go to Cloudflare Dashboard → Workers & Pages → Pages → Overview
2. Find the project you want to delete
3. Click on it → Settings → Delete Project
4. Type the project name to confirm
5. Click Delete

---

## Step 3: Clean Up Local Configuration

### 3.1 Update wrangler.toml

Your `wrangler.toml` should already have the correct names:
- `name = "amei-beauty-api"` ✅
- `database_name = "amei-beauty-db"` ✅
- `bucket_name = "amei-beauty-images"` ✅

**Remove the old database_id** (we'll get a new one):

```toml
[[d1_databases]]
binding = "DB"
database_name = "amei-beauty-db"
# database_id = "deee8ede-b910-46e5-955e-77a95503aa72"  # ← Remove this line
```

### 3.2 Clean Local Wrangler Cache (Optional)

```bash
# Remove local wrangler cache
rm -rf .wrangler/

# Or if you want to keep it, just clear deployments
rm -rf .wrangler/deployments/
```

---

## Step 4: Recreate Resources from Scratch

### 4.1 Create New D1 Database

```bash
npx wrangler d1 create amei-beauty-db
```

**Output will look like:**
```
✅ Successfully created DB 'amei-beauty-db' in region APAC
Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via snapshots to R2.

[[d1_databases]]
binding = "DB"
database_name = "amei-beauty-db"
database_id = "NEW_DATABASE_ID_HERE"  # ← Copy this!
```

**Update `wrangler.toml`** with the new `database_id`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "amei-beauty-db"
database_id = "NEW_DATABASE_ID_HERE"  # ← Paste here
```

### 4.2 Create New R2 Bucket

```bash
npx wrangler r2 bucket create amei-beauty-images
```

**Output:**
```
✅ Successfully created bucket "amei-beauty-images"
```

### 4.3 Run Database Migrations

```bash
npm run d1:migrate
```

Or manually:
```bash
npx wrangler d1 migrations apply amei-beauty-db
```

**Verify the database was created correctly:**
```bash
npx wrangler d1 execute amei-beauty-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

You should see:
```
┌───────┐
│ name  │
├───────┤
│ cards │
└───────┘
```

### 4.4 Deploy Workers

```bash
npm run deploy:workers
```

Or:
```bash
npx wrangler deploy
```

**Expected Output:**
```
✨  Deployed amei-beauty-api
🌍  https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev
```

**Copy the Workers URL** - you'll need it for frontend configuration.

### 4.5 Verify Workers Deployment

```bash
# Test health endpoint
curl https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api/health

# Should return: {"status":"ok","timestamp":...}
```

### 4.6 Deploy Pages (if needed)

```bash
# Build frontend first
npm run build

# Deploy Pages
npm run deploy:pages
```

Or:
```bash
npx wrangler pages deploy dist --project-name=amei-beauty
```

---

## Step 5: Update Environment Variables

### 5.1 Update Frontend Environment

Create or update `.env.production`:

```bash
VITE_API_URL=https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api
```

### 5.2 Update GitHub Secrets (if using CI/CD)

Go to GitHub repo → Settings → Secrets → Actions

Update:
- `VITE_API_URL`: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`

### 5.3 Update Local Development

Create or update `.dev.vars`:

```bash
ENVIRONMENT=development
```

---

## Step 6: Verify Everything Works

### 6.1 Verify Workers

```bash
# Check deployments
npx wrangler deployments list

# Check logs
npx wrangler tail
```

### 6.2 Verify D1 Database

```bash
# Check database exists
npx wrangler d1 list

# Check tables
npx wrangler d1 execute amei-beauty-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### 6.3 Verify R2 Bucket

```bash
# List buckets
npx wrangler r2 bucket list

# Should see: amei-beauty-images
```

### 6.4 Verify Pages

```bash
# List Pages projects
npx wrangler pages project list
```

---

## Quick Reference: Complete Clean Rebuild Script

Here's a complete script to do everything:

```bash
#!/bin/bash
set -e

echo "🧹 Cleaning up old Cloudflare resources..."

# Delete old resources (uncomment as needed)
# npx wrangler delete amei-cards-api
# npx wrangler d1 delete amei-cards-db
# npx wrangler r2 bucket delete amei-cards-images
# npx wrangler pages project delete amei-cards

echo "✨ Creating new resources..."

# Create D1 database
echo "Creating D1 database..."
npx wrangler d1 create amei-beauty-db
# Copy database_id and update wrangler.toml

# Create R2 bucket
echo "Creating R2 bucket..."
npx wrangler r2 bucket create amei-beauty-images

# Run migrations
echo "Running migrations..."
npm run d1:migrate

# Deploy Workers
echo "Deploying Workers..."
npm run deploy:workers

# Build and deploy Pages
echo "Building frontend..."
npm run build

echo "Deploying Pages..."
npm run deploy:pages

echo "✅ Done! Verify resources:"
echo "  - Workers: npx wrangler deployments list"
echo "  - D1: npx wrangler d1 list"
echo "  - R2: npx wrangler r2 bucket list"
echo "  - Pages: npx wrangler pages project list"
```

---

## Troubleshooting

### Issue: "Database already exists"

**Solution**: Delete the old database first:
```bash
npx wrangler d1 delete amei-beauty-db
npx wrangler d1 create amei-beauty-db
```

### Issue: "Bucket already exists"

**Solution**: Delete the old bucket first:
```bash
npx wrangler r2 bucket delete amei-beauty-images
npx wrangler r2 bucket create amei-beauty-images
```

### Issue: "Worker name already in use"

**Solution**: Delete the old worker first:
```bash
npx wrangler delete amei-beauty-api
npx wrangler deploy
```

### Issue: Can't delete R2 bucket (has objects)

**Solution**: Delete all objects first:
```bash
# List objects
npx wrangler r2 object list <bucket-name>

# Delete all objects (be careful!)
npx wrangler r2 object list <bucket-name> | while read obj; do
  npx wrangler r2 object delete <bucket-name> "$obj"
done

# Then delete bucket
npx wrangler r2 bucket delete <bucket-name>
```

---

## Summary Checklist

- [ ] List all existing resources
- [ ] Delete old Workers
- [ ] Delete old D1 databases
- [ ] Delete old R2 buckets
- [ ] Delete old Pages projects
- [ ] Update `wrangler.toml` (remove old database_id)
- [ ] Create new D1 database
- [ ] Update `wrangler.toml` with new database_id
- [ ] Create new R2 bucket
- [ ] Run migrations
- [ ] Deploy Workers
- [ ] Deploy Pages
- [ ] Update environment variables
- [ ] Verify all resources are working

---

## Need Help?

If you encounter issues:

1. Check Cloudflare Dashboard for resource status
2. Review `wrangler.toml` configuration
3. Check Wrangler logs: `npx wrangler tail`
4. Verify you're logged in: `npx wrangler whoami`

