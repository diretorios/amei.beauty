# Production Configuration Verification

This document verifies all production configuration settings for amei.beauty.

## ✅ Configuration Files Status

### 1. Wrangler Configuration Files

#### `wrangler.toml` (Cloudflare Pages)
- ✅ **Name**: `amei-beauty`
- ✅ **Build Output**: `dist`
- ✅ **KV Namespace**: 
  - Binding: `RATE_LIMIT_KV`
  - ID: `4a757bc6c1ed4cd297a88492db23e86c`
  - Preview ID: `e7ec951de82742b1bfc91419f7c9a557`

#### `wrangler.workers.toml` (Cloudflare Workers)
- ✅ **Name**: `amei-beauty-api`
- ✅ **Main Entry**: `workers/index.ts`
- ✅ **Compatibility Date**: `2024-01-01`
- ✅ **Compatibility Flags**: `["nodejs_compat"]`
- ✅ **D1 Database**:
  - Binding: `DB`
  - Database Name: `amei-beauty-db`
  - Database ID: `def5a00b-d274-4172-927f-02066e778b97`
- ✅ **R2 Bucket**:
  - Binding: `IMAGES`
  - Bucket Name: `amei-beauty-images`
- ✅ **KV Namespace**:
  - Binding: `RATE_LIMIT_KV`
  - ID: `4a757bc6c1ed4cd297a88492db23e86c` (matches Pages)
  - Preview ID: `e7ec951de82742b1bfc91419f7c9a557` (matches Pages)
- ✅ **Environment Variables**:
  - Default: `ENVIRONMENT = "development"`
  - Production: `ENVIRONMENT = "production"` (in `[env.production]`)

---

## ⚠️ Required Production Secrets

The following secrets **MUST** be set in Cloudflare for production:

### Cloudflare Workers Secrets
Set via: `npx wrangler secret put <NAME> --config wrangler.workers.toml --env production`

- [ ] **`AUTH_SECRET`** - Required for owner token hashing
  - Generate with: `openssl rand -base64 32`
- [ ] **`ALLOWED_ORIGINS`** - Required for CORS security
  - Format: `https://amei.beauty,https://www.amei.beauty`
  - **CRITICAL**: Do not use `*` in production!
- [ ] **`STRIPE_SECRET_KEY`** - Required for payment processing (if enabled)
- [ ] **`STRIPE_WEBHOOK_SECRET`** - Required for Stripe webhooks (if enabled)

### Cloudflare Pages Secrets
Set via: `npx wrangler pages secret put <NAME>`

- [ ] **`VITE_API_URL`** - Required for frontend API calls
  - Format: `https://amei-beauty-api.<subdomain>.workers.dev/api`
  - Or: `https://amei.beauty/api` (if using custom domain route)

---

## ✅ CI/CD Configuration

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

#### Test Job
- ✅ Runs on: `ubuntu-latest`
- ✅ Node version: `20`
- ✅ Steps:
  - Checkout code
  - Setup Node.js with npm cache
  - Install dependencies (`npm ci`)
  - Run linter (`npm run lint`)
  - Run tests (`npm test -- --run`)
  - Build frontend with fallback API URL

#### Deploy Workers Job
- ✅ Runs only on: `main` branch pushes
- ✅ Depends on: `test` job
- ✅ Steps:
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Deploy Workers (`npm run deploy:workers`)
  - Run migrations (`npx wrangler d1 migrations apply amei-beauty-db`)
- ⚠️ **Required Secrets**:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`

#### Deploy Pages Job
- ✅ Runs only on: `main` branch pushes
- ✅ Depends on: `test` and `deploy-workers` jobs
- ✅ Steps:
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Build frontend with `VITE_API_URL` secret
  - Deploy to Pages (`npm run deploy:pages`)
- ⚠️ **Required Secrets**:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `VITE_API_URL` (for build)

---

## ✅ API Configuration

### Frontend API Client (`src/lib/api.ts`)
- ✅ **API Base URL**: Uses `import.meta.env.VITE_API_URL` with fallback to `http://localhost:8787/api`
- ✅ **Environment Variable**: `VITE_API_URL` must be set in production

### Workers API (`workers/index.ts`)
- ✅ **CORS Configuration**: 
  - Reads from `env.ALLOWED_ORIGINS`
  - Falls back to `*` if not set (⚠️ **NOT SECURE FOR PRODUCTION**)
  - Supports comma-separated origins
- ✅ **Rate Limiting**: 
  - Enabled for all endpoints except `/api/health` and `/api/payment/webhook`
  - Uses KV namespace for rate limit storage
- ✅ **Error Handling**: 
  - Returns generic errors in production
  - Shows detailed errors only in development (`env.ENVIRONMENT === 'development'`)

---

## ⚠️ Security Checklist

### CORS Configuration
- [ ] **`ALLOWED_ORIGINS`** secret is set in Workers production environment
- [ ] **`ALLOWED_ORIGINS`** does NOT contain `*` in production
- [ ] **`ALLOWED_ORIGINS`** includes all production domains:
  - `https://amei.beauty`
  - `https://www.amei.beauty` (if using www subdomain)
  - Any preview/staging domains (if needed)

### API Keys & Secrets
- [ ] **`AUTH_SECRET`** is set and is NOT the default `dev-secret-change-in-production`
- [ ] **`AUTH_SECRET`** is a strong random string (32+ bytes)
- [ ] **`STRIPE_SECRET_KEY`** is set (if payments are enabled)
- [ ] **`STRIPE_WEBHOOK_SECRET`** is set (if payments are enabled)
- [ ] No secrets are committed to git (check `.gitignore`)

### Environment Variables
- [ ] **`ENVIRONMENT`** is set to `"production"` in production environment
- [ ] **`VITE_API_URL`** is set correctly in Pages environment
- [ ] **`VITE_API_URL`** points to production Workers URL

---

## ✅ Database & Storage Configuration

### D1 Database
- ✅ **Database Name**: `amei-beauty-db`
- ✅ **Database ID**: `def5a00b-d274-4172-927f-02066e778b97`
- ✅ **Binding**: `DB`
- [ ] **Migrations Applied**: Verify all migrations are applied in production
  - Check: `npx wrangler d1 migrations list amei-beauty-db --config wrangler.workers.toml`

### R2 Bucket
- ✅ **Bucket Name**: `amei-beauty-images`
- ✅ **Binding**: `IMAGES`
- [ ] **Public Access Configured**: Verify R2 bucket has public access or custom domain
- [ ] **CORS Configured**: If accessing from browser, verify CORS settings

### KV Namespace
- ✅ **Namespace ID**: `4a757bc6c1ed4cd297a88492db23e86c`
- ✅ **Binding**: `RATE_LIMIT_KV`
- ✅ **Shared**: Same namespace used by both Pages and Workers

---

## ✅ Build Configuration

### Vite Configuration (`vite.config.ts`)
- ✅ **Build Target**: `esnext`
- ✅ **Minification**: `esbuild`
- ✅ **Source Maps**: Disabled (good for production)
- ✅ **PWA**: Configured with auto-update
- ✅ **Output Directory**: `dist`

### Package.json Scripts
- ✅ **Build**: `npm run build` (runs `tsc && vite build`)
- ✅ **Deploy Workers**: `npm run deploy:workers`
- ✅ **Deploy Pages**: `npm run deploy:pages`
- ✅ **Migrations**: `npm run d1:migrate`

---

## 🔍 Verification Commands

### Check Workers Configuration
```bash
# Verify Workers can be deployed (dry-run)
npm run build:workers

# Check Workers secrets
npx wrangler secret list --config wrangler.workers.toml --env production

# Check Workers environment
npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api
```

### Check Pages Configuration
```bash
# Verify build works
npm run build

# Check Pages secrets (via dashboard or CLI)
npx wrangler pages secret list --project-name=amei-beauty
```

### Check Database
```bash
# List migrations
npx wrangler d1 migrations list amei-beauty-db --config wrangler.workers.toml

# Verify database connection
npx wrangler d1 execute amei-beauty-db --config wrangler.workers.toml --command "SELECT COUNT(*) FROM cards"
```

### Check R2 Bucket
```bash
# List buckets
npx wrangler r2 bucket list

# Verify bucket exists
npx wrangler r2 bucket list | grep amei-beauty-images
```

---

## 🚨 Critical Production Issues to Fix

### 1. CORS Security
**Issue**: `ALLOWED_ORIGINS` defaults to `*` if not set, allowing any origin.

**Fix**:
```bash
npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production
# Enter: https://amei.beauty,https://www.amei.beauty
```

### 2. AUTH_SECRET
**Issue**: Default dev secret should not be used in production.

**Fix**:
```bash
# Generate new secret
openssl rand -base64 32

# Set in Workers
npx wrangler secret put AUTH_SECRET --config wrangler.workers.toml --env production
```

### 3. VITE_API_URL
**Issue**: Must be set for production builds to work correctly.

**Fix**:
- Set in GitHub Actions secrets: `VITE_API_URL`
- Or set in Cloudflare Pages environment variables

### 4. Environment Variable
**Issue**: Verify `ENVIRONMENT=production` is set in production.

**Fix**: Already configured in `[env.production]` section, but verify it's applied:
```bash
npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api
```

---

## ✅ Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All secrets are set (see "Required Production Secrets" above)
- [ ] `ALLOWED_ORIGINS` does NOT contain `*`
- [ ] `AUTH_SECRET` is NOT the default dev secret
- [ ] `VITE_API_URL` is set correctly
- [ ] `ENVIRONMENT=production` is set in production environment
- [ ] All migrations are applied
- [ ] R2 bucket has public access configured
- [ ] GitHub Actions secrets are configured:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `VITE_API_URL`
- [ ] Tests pass locally
- [ ] Build succeeds locally
- [ ] No console errors in production build

---

## 📝 Production URLs

Document your production URLs here:

- **Pages URL**: `https://amei-beauty.<subdomain>.pages.dev` or `https://amei.beauty`
- **Workers URL**: `https://amei-beauty-api.<subdomain>.workers.dev` or `https://amei.beauty/api`
- **API Health Check**: `https://amei-beauty-api.<subdomain>.workers.dev/api/health`

---

## 🔄 Update Log

| Date | Changes | Verified By |
|------|---------|-------------|
| | | |

---

**Last Verified**: _______________  
**Verified By**: _______________  
**Status**: ⚠️ **REQUIRES ATTENTION** (see Critical Issues above)

