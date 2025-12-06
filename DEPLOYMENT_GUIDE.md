# Deployment Guide for amei.beauty

## 🚀 Deployment Overview

This guide covers deploying both frontend (Cloudflare Pages) and backend (Cloudflare Workers + D1).

---

## Prerequisites

- [ ] Cloudflare account (free tier works)
- [ ] Domain name (optional, can use Cloudflare Pages subdomain)
- [ ] Git repository (GitHub recommended)
- [ ] All tests passing locally

---

## Part 1: Deploy Backend (Cloudflare Workers + D1)

### Step 1: Create D1 Database

```bash
npx wrangler d1 create amei-beauty-db
```

**Copy the `database_id` from output**

### Step 2: Update Configuration

Edit `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "amei-beauty-db"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Paste here
```

### Step 3: Create R2 Bucket

```bash
npx wrangler r2 bucket create amei-beauty-images
```

Bucket name is already configured in `wrangler.toml`.

### Step 4: Run Migrations

```bash
npm run d1:migrate
```

Or manually:
```bash
npx wrangler d1 migrations apply amei-beauty-db
```

**Verify**: Check database has `cards` table:
```bash
npx wrangler d1 execute amei-beauty-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### Step 5: Deploy Workers

```bash
npm run deploy:workers
```

Or:
```bash
npx wrangler deploy
```

**Expected Output**:
```
✨  Deployed amei-beauty-api
🌍  https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev
```

**Copy the Workers URL** - you'll need it for frontend configuration.

### Step 6: Verify Workers Deployment

```bash
# Test health endpoint
curl https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api/health

# Should return: {"status":"ok","timestamp":...}
```

---

## Part 2: Deploy Frontend (Cloudflare Pages)

### Option A: Deploy via Wrangler CLI

#### Step 1: Build Frontend

```bash
npm run build
```

**Verify**: `dist/` folder created with built files.

#### Step 2: Set Environment Variable

Create `.env.production`:
```bash
VITE_API_URL=https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api
```

**Or** update `src/lib/api.ts` directly for production:
```typescript
const API_BASE_URL = import.meta.env.PROD
  ? 'https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api'
  : import.meta.env.VITE_API_URL || 'http://localhost:8787/api';
```

#### Step 3: Rebuild with Production API URL

```bash
npm run build
```

#### Step 4: Deploy to Pages

```bash
npm run deploy:pages
```

Or:
```bash
npx wrangler pages deploy dist --project-name=amei-beauty
```

**Expected Output**:
```
✨  Deployed amei-beauty
🌍  https://amei-beauty.YOUR_SUBDOMAIN.pages.dev
```

### Option B: Deploy via GitHub (Recommended)

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com)
2. Click "Create application" → "Pages" → "Connect to Git"
3. Select your GitHub repository
4. Configure:
   - **Project name**: `amei-beauty`
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (or leave empty)

#### Step 3: Add Environment Variables

In Cloudflare Pages dashboard:
1. Go to your project → Settings → Environment Variables
2. Add:
   - **Variable**: `VITE_API_URL`
   - **Value**: `https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api`
   - **Environment**: Production, Preview

#### Step 4: Deploy

Cloudflare will automatically:
- Build on push to main
- Deploy to production
- Create preview deployments for PRs

---

## Part 3: Configure Custom Domain (Optional)

### Step 1: Add Domain to Cloudflare

1. Go to Cloudflare Dashboard → Add Site
2. Add your domain (e.g., `amei.beauty`)
3. Update nameservers (if not already using Cloudflare)

### Step 2: Configure Pages Domain

1. Go to Pages project → Custom domains
2. Add custom domain: `amei.beauty`
3. Cloudflare will configure DNS automatically

### Step 3: Configure Workers Route (Optional)

If you want Workers on same domain:

1. Go to Workers → Routes
2. Add route: `amei.beauty/api/*`
3. Select your Worker: `amei-beauty-api`

Then update `VITE_API_URL` to: `https://amei.beauty/api`

---

## Part 4: Post-Deployment Verification

### 1. Test Frontend

```bash
# Visit your Pages URL
https://amei-beauty.YOUR_SUBDOMAIN.pages.dev
# or
https://amei.beauty
```

**Check**:
- [ ] Page loads
- [ ] Onboarding works
- [ ] AI completion works
- [ ] Directory loads
- [ ] No console errors

### 2. Test Backend API

```bash
# Health check
curl https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api/health

# Test publish (from browser console or Postman)
fetch('https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profile: { full_name: 'Test', profession: 'Test', whatsapp: '+5511999999999', headline: '', bio: '' },
    services: [],
    social: [],
    links: [],
    referral_code: 'TEST123'
  })
})
```

### 3. Test Full Flow

1. [ ] Complete onboarding locally
2. [ ] Publish card
3. [ ] View published card on production URL
4. [ ] Search for card in directory
5. [ ] Test WhatsApp button

### 4. Check Cloudflare Dashboard

- [ ] **Workers**: Shows deployments and logs
- [ ] **D1**: Shows database and queries
- [ ] **R2**: Shows bucket and files
- [ ] **Pages**: Shows deployments and analytics

---

## Part 5: Production Configuration

### Environment Variables

**Workers** (via `wrangler.toml` or Cloudflare Dashboard):
```toml
[env.production.vars]
ENVIRONMENT = "production"
```

**Pages** (via Cloudflare Dashboard):
```
VITE_API_URL=https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api
```

### R2 Public Access (for Images)

1. Go to Cloudflare Dashboard → R2
2. Select `amei-beauty-images` bucket
3. Configure public access:
   - Option A: Custom domain (recommended)
   - Option B: R2.dev subdomain (temporary)

### Monitoring

**Cloudflare Analytics** (Free):
- Workers: Request count, errors, CPU time
- Pages: Page views, bandwidth
- D1: Query count, storage

**Set Up Alerts** (Optional):
1. Go to Workers → Settings → Alerts
2. Configure error rate alerts
3. Configure request limit alerts

---

## Part 6: CI/CD Setup (GitHub Actions)

### Create `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-workers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run d1:migrate
      - run: npm run deploy:workers
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-pages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: amei-beauty
          directory: dist
```

### Add GitHub Secrets

1. Go to GitHub repo → Settings → Secrets → Actions
2. Add:
   - `CLOUDFLARE_API_TOKEN`: Get from Cloudflare Dashboard → My Profile → API Tokens
   - `CLOUDFLARE_ACCOUNT_ID`: Get from Cloudflare Dashboard → Right sidebar

---

## Troubleshooting

### Workers Deployment Fails

**Error**: "Database not found"
- **Solution**: Verify `database_id` in `wrangler.toml`
- **Check**: `npx wrangler d1 list`

**Error**: "Migration failed"
- **Solution**: Check migration file syntax
- **Check**: `npx wrangler d1 migrations list amei-beauty-db`

### Pages Deployment Fails

**Error**: "Build failed"
- **Solution**: Check build logs in Cloudflare Dashboard
- **Check**: Build locally first: `npm run build`

**Error**: "Environment variable not found"
- **Solution**: Add `VITE_API_URL` in Pages dashboard
- **Check**: Variables are set for correct environment

### API Not Working in Production

**Error**: CORS errors
- **Solution**: Verify CORS headers in Workers
- **Check**: Workers logs in dashboard

**Error**: 404 on API calls
- **Solution**: Verify `VITE_API_URL` is correct
- **Check**: API URL in browser network tab

---

## Cost Monitoring

### Free Tier Limits

- **Workers**: 100k requests/day
- **D1**: 5GB storage, 5M reads/month
- **R2**: 10GB storage, 1M Class A operations/month
- **Pages**: Unlimited requests

### Expected Costs (1000 users)

- Workers: $0 (within free tier)
- D1: ~$0.10/month
- R2: ~$0.50/month
- **Total: ~$0.60/month**

### Monitor Usage

1. Cloudflare Dashboard → Workers → Metrics
2. Cloudflare Dashboard → D1 → Usage
3. Cloudflare Dashboard → R2 → Usage

---

## Rollback Plan

### Rollback Workers

```bash
# List deployments
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback
```

### Rollback Pages

1. Go to Cloudflare Dashboard → Pages → Deployments
2. Find previous deployment
3. Click "..." → "Retry deployment" or "Rollback to this deployment"

---

## Security Checklist

- [ ] HTTPS enforced (automatic with Cloudflare)
- [ ] API keys not exposed in frontend
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured (optional)
- [ ] D1 database backups enabled
- [ ] Environment variables secured

---

## Performance Optimization

### After Deployment

1. **Enable Cloudflare Caching**
   - Pages: Automatic
   - Workers: Add cache headers

2. **Optimize Images**
   - Use WebP format
   - Compress images before upload
   - Use R2 CDN for images

3. **Monitor Performance**
   - Check Cloudflare Analytics
   - Use Lighthouse in production
   - Monitor Core Web Vitals

---

## Next Steps

After successful deployment:

1. [ ] Test all features in production
2. [ ] Set up monitoring/alerts
3. [ ] Configure custom domain (if needed)
4. [ ] Set up CI/CD (if using GitHub)
5. [ ] Document production URLs
6. [ ] Share with beta users
7. [ ] Monitor usage and costs

---

**Deployment Status**: Ready when all steps completed!

