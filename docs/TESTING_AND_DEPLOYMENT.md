# Testing & Deployment Guide for amei.beauty

Complete guide for testing and deploying your MVP application.

---

## 📋 Quick Start

### Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Cloudflare account created
- [ ] Git repository set up (GitHub recommended)
- [ ] All code committed

---

## 🧪 Part 1: Testing

### Automated Testing

#### Run All Tests

```bash
# Using the test script
./scripts/test-all.sh

# Or manually
npm install
npm run lint
npm test -- --run
npm run test:coverage
npm run build
```

#### Test Coverage Goals

- **Minimum**: 70% code coverage
- **Target**: 80%+ code coverage
- **Critical paths**: 90%+ coverage

### Manual Testing Checklist

#### Frontend Testing

1. **Onboarding Flow**
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```
   - [ ] Step 1: Name input validates correctly
   - [ ] Step 2: Profession input works
   - [ ] Step 3: WhatsApp validation works
   - [ ] Step 4: Photo upload/preview works
   - [ ] Step 5: AI completion works (if enabled)
   - [ ] All steps work in pt-BR, en, es

2. **Profile Page**
   - [ ] Profile displays correctly after onboarding
   - [ ] Publish button works
   - [ ] Language switching works
   - [ ] Data persists on reload

3. **Directory Page**
   - [ ] Search functionality works
   - [ ] Filters work (category, location, featured)
   - [ ] Pagination works
   - [ ] Card previews display correctly

4. **Public Card View**
   - [ ] Card displays at `/card/:id`
   - [ ] Card displays at `/:username`
   - [ ] WhatsApp button opens correctly
   - [ ] All card data displays

#### Backend Testing

1. **Start Workers Locally**
   ```bash
   npm run dev:workers
   # Workers run on http://localhost:8787
   ```

2. **Test API Endpoints**
   ```bash
   # Health check
   curl http://localhost:8787/api/health

   # Publish card
   curl -X POST http://localhost:8787/api/publish \
     -H "Content-Type: application/json" \
     -d '{
       "profile": {
         "full_name": "Test",
         "profession": "Cabeleireira",
         "whatsapp": "+5511999999999",
         "headline": "Test",
         "bio": "Test"
       },
       "services": [],
       "social": [],
       "links": [],
       "referral_code": "TEST123"
     }'

   # Get card
   curl http://localhost:8787/api/card/{card_id}

   # Search
   curl "http://localhost:8787/api/search?q=cabeleireira"

   # Directory
   curl "http://localhost:8787/api/directory?page=1&limit=10"
   ```

3. **Database Verification**
   ```bash
   # Check database tables
   npx wrangler d1 execute amei-beauty-db \
     --command "SELECT name FROM sqlite_master WHERE type='table'"

   # Check migrations
   npx wrangler d1 migrations list amei-beauty-db
   ```

### Integration Testing

1. **Full Flow Test**
   - [ ] Complete onboarding locally
   - [ ] Use AI completion
   - [ ] Publish card
   - [ ] View published card
   - [ ] Search for card in directory
   - [ ] Test WhatsApp button

2. **Error Handling**
   - [ ] Invalid card ID shows error
   - [ ] Network errors handled gracefully
   - [ ] Validation errors display correctly
   - [ ] API errors show user-friendly messages

### Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (Chrome Mobile, Safari Mobile)

### Performance Testing

```bash
# Build for production
npm run build

# Preview build
npm run preview

# Run Lighthouse audit
# Target scores: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
```

### Security Testing

- [ ] No console errors
- [ ] No exposed API keys in frontend
- [ ] Input validation works
- [ ] XSS protection (no innerHTML with user data)
- [ ] CORS configured correctly
- [ ] HTTPS enforced (in production)

---

## 🚀 Part 2: Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Build succeeds without errors
- [ ] No console errors in browser
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] R2 bucket created
- [ ] Cloudflare account set up

### Step 1: Cloudflare Setup

#### 1.1 Login to Cloudflare

```bash
npx wrangler login
```

#### 1.2 Create D1 Database

```bash
npx wrangler d1 create amei-beauty-db
```

**Important**: Copy the `database_id` from output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "amei-beauty-db"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Paste here
```

#### 1.3 Create R2 Bucket

```bash
npx wrangler r2 bucket create amei-beauty-images
```

#### 1.4 Run Migrations

```bash
npm run d1:migrate
```

Verify:
```bash
npx wrangler d1 execute amei-beauty-db \
  --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### Step 2: Deploy Workers

#### Option A: Manual Deployment

```bash
# Deploy Workers
npm run deploy:workers

# Or
npx wrangler deploy
```

**Copy the Workers URL** (e.g., `https://amei-beauty-api.xxx.workers.dev`)

#### Option B: Automated Deployment (Recommended)

1. **Set up GitHub Secrets**

   Go to GitHub repo → Settings → Secrets → Actions

   Add:
   - `CLOUDFLARE_API_TOKEN`: Get from Cloudflare Dashboard → My Profile → API Tokens
   - `CLOUDFLARE_ACCOUNT_ID`: Get from Cloudflare Dashboard → Right sidebar
   - `VITE_API_URL`: Your Workers URL (e.g., `https://amei-beauty-api.xxx.workers.dev/api`)

2. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

   GitHub Actions will automatically:
   - Run tests
   - Deploy Workers
   - Run migrations
   - Deploy Pages

### Step 3: Deploy Pages

#### Option A: CLI Deployment

```bash
# Set API URL
export VITE_API_URL=https://amei-beauty-api.xxx.workers.dev/api

# Build
npm run build

# Deploy
npm run deploy:pages
```

#### Option B: GitHub Pages Integration

1. Go to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com)
2. Click "Create application" → "Pages" → "Connect to Git"
3. Select your GitHub repository
4. Configure:
   - **Project name**: `amei-beauty`
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Add environment variable:
   - **Variable**: `VITE_API_URL`
   - **Value**: `https://amei-beauty-api.xxx.workers.dev/api`

### Step 4: Verify Deployment

#### Using Verification Script

```bash
# Set URLs
export WORKERS_URL=https://amei-beauty-api.xxx.workers.dev
export PAGES_URL=https://amei-beauty.xxx.pages.dev

# Run verification
./scripts/verify-deployment.sh
```

#### Manual Verification

1. **Test Workers**
   ```bash
   curl https://amei-beauty-api.xxx.workers.dev/api/health
   # Should return: {"status":"ok","timestamp":...}
   ```

2. **Test Pages**
   - Visit your Pages URL
   - Complete onboarding
   - Test all features
   - Check browser console for errors

3. **Test Full Flow**
   - [ ] Onboarding works
   - [ ] AI completion works
   - [ ] Card publishing works
   - [ ] Card viewing works
   - [ ] Directory search works
   - [ ] WhatsApp button works

---

## 🔧 Part 3: Post-Deployment

### Monitoring

1. **Cloudflare Dashboard**
   - Monitor Workers: Request count, errors, CPU time
   - Monitor D1: Query count, storage
   - Monitor R2: Storage, operations
   - Monitor Pages: Page views, bandwidth

2. **Set Up Alerts** (Optional)
   - Go to Workers → Settings → Alerts
   - Configure error rate alerts
   - Configure request limit alerts

### Custom Domain (Optional)

1. **Add Domain to Cloudflare**
   - Go to Cloudflare Dashboard → Add Site
   - Add your domain (e.g., `amei.beauty`)
   - Update nameservers

2. **Configure Pages Domain**
   - Go to Pages project → Custom domains
   - Add custom domain: `amei.beauty`

3. **Configure Workers Route** (Optional)
   - Go to Workers → Routes
   - Add route: `amei.beauty/api/*`
   - Select your Worker: `amei-beauty-api`
   - Update `VITE_API_URL` to: `https://amei.beauty/api`

### Performance Optimization

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

## 🐛 Troubleshooting

### Common Issues

#### Workers Deployment Fails

**Error**: "Database not found"
- **Solution**: Verify `database_id` in `wrangler.toml`
- **Check**: `npx wrangler d1 list`

**Error**: "Migration failed"
- **Solution**: Check migration file syntax
- **Check**: `npx wrangler d1 migrations list amei-beauty-db`

#### Pages Deployment Fails

**Error**: "Build failed"
- **Solution**: Check build logs in Cloudflare Dashboard
- **Check**: Build locally first: `npm run build`

**Error**: "Environment variable not found"
- **Solution**: Add `VITE_API_URL` in Pages dashboard
- **Check**: Variables are set for correct environment

#### API Not Working in Production

**Error**: CORS errors
- **Solution**: Verify CORS headers in Workers
- **Check**: Workers logs in dashboard

**Error**: 404 on API calls
- **Solution**: Verify `VITE_API_URL` is correct
- **Check**: API URL in browser network tab

---

## 📊 Cost Monitoring

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

## 🔄 Rollback Plan

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

## ✅ Final Checklist

Before going live:

- [ ] All tests passing
- [ ] Workers deployed and verified
- [ ] Pages deployed and verified
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Performance optimized
- [ ] Security checks passed
- [ ] Documentation updated

---

## 📚 Additional Resources

- [Testing Guide](./TESTING_GUIDE.md) - Detailed testing procedures
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Step-by-step deployment
- [Quick Start](./QUICK_START.md) - Quick reference
- [Cloudflare Setup](./CLOUDFLARE_SETUP.md) - Cloudflare configuration

---

**Ready to deploy? Run `./scripts/test-all.sh` first, then `./scripts/deploy.sh`!**

