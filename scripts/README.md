# Deployment Scripts

Helper scripts for testing and deploying amei.beauty.

## Scripts

### `test-all.sh`

Runs comprehensive tests before deployment:
- Checks Node.js version
- Installs dependencies
- Runs linter
- Runs unit tests
- Runs coverage tests
- Builds frontend

**Usage:**
```bash
./scripts/test-all.sh
```

### `deploy.sh`

Basic deployment script for both Workers and Pages to Cloudflare:
- Checks prerequisites
- Verifies Cloudflare authentication
- Runs tests
- Builds frontend
- Deploys Workers
- Runs migrations
- Deploys Pages

**Usage:**
```bash
# Set API URL (optional, will use default if not set)
export VITE_API_URL=https://your-workers-url/api

# Deploy
./scripts/deploy.sh
```

### `deploy-production.sh` ⭐ **Recommended for Production**

Comprehensive production deployment script with enhanced features:
- ✅ Automatic prerequisite checks (Node.js, npm, wrangler)
- ✅ Cloudflare authentication verification
- ✅ Configuration validation
- ✅ Optional test execution (can be skipped)
- ✅ Automatic Workers URL detection
- ✅ Interactive API URL configuration
- ✅ Production build with VITE_API_URL validation
- ✅ Build verification (checks for localhost URLs)
- ✅ Workers deployment
- ✅ Database migrations
- ✅ Pages deployment
- ✅ Post-deployment verification (health checks)
- ✅ Detailed progress reporting with colored output

**Usage:**
```bash
# Basic usage (interactive)
npm run deploy:production
# or
./scripts/deploy-production.sh

# With options
./scripts/deploy-production.sh --skip-tests              # Skip running tests
./scripts/deploy-production.sh --skip-verify            # Skip post-deployment verification
./scripts/deploy-production.sh --api-url https://amei-beauty-api.xxx.workers.dev/api

# Combine options
./scripts/deploy-production.sh --skip-tests --api-url https://amei-beauty-api.xxx.workers.dev/api
```

**Features:**
- **Automatic Workers URL detection**: If Workers are already deployed, the script will automatically detect the URL
- **Interactive prompts**: If API URL is not provided, the script will prompt for it
- **Validation**: Validates API URL format and checks for localhost (not allowed in production)
- **Build verification**: Checks that the build doesn't contain localhost URLs
- **Error handling**: Clear error messages and graceful failure handling
- **Progress reporting**: Color-coded output showing progress through each step

**Environment Variables:**
- `VITE_API_URL`: Can be set as environment variable or passed via `--api-url` flag

### `verify-deployment.sh`

Verifies deployed application:
- Tests Workers health endpoint
- Tests API endpoints (publish, get, search, directory)
- Tests Pages frontend

**Usage:**
```bash
# Set URLs
export WORKERS_URL=https://amei-beauty-api.xxx.workers.dev
export PAGES_URL=https://amei-beauty.xxx.pages.dev

# Verify
./scripts/verify-deployment.sh
```

## Prerequisites

- Node.js 18+
- npm
- Cloudflare account
- Wrangler CLI (installed via npm)

## Notes

- All scripts require executable permissions (`chmod +x scripts/*.sh`)
- Scripts will exit on first error (set -e)
- Make sure you're logged in to Cloudflare (`npx wrangler login`)

