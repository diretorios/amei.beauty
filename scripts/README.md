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

Deploys both Workers and Pages to Cloudflare:
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

