# Production Deployment Script Guide

## Overview

The `deploy-production.sh` script provides a comprehensive, user-friendly way to deploy amei.beauty to production on Cloudflare. It automates the entire deployment process with built-in checks, validations, and helpful prompts.

## Quick Start

```bash
# Run the deployment script
npm run deploy:production
```

That's it! The script will guide you through the process.

## Features

### ✅ Automatic Checks
- Verifies Node.js and npm are installed
- Checks Cloudflare authentication
- Validates configuration files
- Detects Workers URL automatically

### ✅ Smart API URL Handling
- Automatically detects Workers URL if already deployed
- Prompts for URL if not detected
- Validates URL format (must be HTTPS, workers.dev, end with /api)
- Prevents localhost URLs in production builds

### ✅ Build Validation
- Verifies build output exists
- Checks for localhost URLs in build (should not exist)
- Warns if build may be misconfigured

### ✅ Comprehensive Deployment
- Deploys Workers to Cloudflare
- Runs database migrations
- Deploys Pages to Cloudflare
- Verifies deployment health

### ✅ User-Friendly Output
- Color-coded progress indicators
- Clear success/error messages
- Helpful warnings and suggestions
- Summary at the end

## Usage Options

### Basic Usage (Interactive)

```bash
npm run deploy:production
```

The script will:
1. Check prerequisites
2. Verify authentication
3. Optionally run tests
4. Prompt for API URL if needed
5. Build and deploy everything
6. Verify deployment

### Skip Tests

If you want to skip running tests before deployment:

```bash
./scripts/deploy-production.sh --skip-tests
```

### Skip Verification

If you want to skip post-deployment verification:

```bash
./scripts/deploy-production.sh --skip-verify
```

### Specify API URL

If you want to specify the API URL directly:

```bash
./scripts/deploy-production.sh --api-url https://amei-beauty-api.xxx.workers.dev/api
```

### Combine Options

```bash
./scripts/deploy-production.sh --skip-tests --api-url https://amei-beauty-api.xxx.workers.dev/api
```

## Prerequisites

Before running the script, ensure:

1. **Node.js 18+** is installed
2. **npm** is installed
3. **Cloudflare account** is set up
4. **Wrangler CLI** is available (script will install if missing)
5. **Authenticated with Cloudflare**: Run `npx wrangler login` if not already logged in

## Step-by-Step Process

The script performs these steps in order:

1. **Prerequisites Check**
   - Verifies Node.js, npm, and wrangler
   - Checks Cloudflare authentication

2. **Configuration Verification**
   - Validates `wrangler.workers.toml`
   - Validates `wrangler.toml`
   - Checks `package.json`

3. **Tests** (optional, can skip with `--skip-tests`)
   - Runs test suite
   - Prompts to continue if tests fail

4. **API URL Configuration**
   - Tries to detect Workers URL automatically
   - Prompts for URL if not detected
   - Validates URL format
   - Prevents localhost URLs

5. **Frontend Build**
   - Cleans previous build
   - Builds with production API URL
   - Verifies build output
   - Checks for localhost URLs in build

6. **Workers Deployment**
   - Deploys Workers to Cloudflare
   - Retrieves deployment URL

7. **Database Migrations**
   - Applies D1 database migrations
   - Continues even if migrations already applied

8. **Pages Deployment**
   - Deploys Pages to Cloudflare
   - Retrieves deployment URL

9. **Verification** (optional, can skip with `--skip-verify`)
   - Checks Workers health endpoint
   - Retrieves Pages URL

10. **Summary**
    - Displays deployment URLs
    - Provides next steps

## Environment Variables

You can set `VITE_API_URL` as an environment variable:

```bash
export VITE_API_URL=https://amei-beauty-api.xxx.workers.dev/api
npm run deploy:production
```

Or pass it via the `--api-url` flag (takes precedence over environment variable).

## Troubleshooting

### "Node.js is not installed"

The script tries to load Node.js from common version managers (nvm, fnm) and common installation paths. If it still can't find Node.js:

1. Install Node.js 18+ from [nodejs.org](https://nodejs.org/)
2. Or ensure Node.js is in your PATH
3. Or use a version manager (nvm, fnm)

### "Not authenticated with Cloudflare"

Run:
```bash
npx wrangler login
```

### "API URL contains localhost"

This error means the API URL you provided contains "localhost", which is not allowed for production builds. Make sure you're using your actual Workers URL:

```
https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api
```

### "Build contains localhost URLs"

This warning means the build still references localhost, which suggests `VITE_API_URL` wasn't applied correctly. The script will prompt you to continue, but you should:

1. Verify `VITE_API_URL` is set correctly
2. Rebuild with the correct URL
3. Check that the URL doesn't have leading/trailing spaces

### "Workers deployment failed"

Check:
1. You're authenticated: `npx wrangler whoami`
2. Your `wrangler.workers.toml` is correct
3. You have permissions to deploy Workers
4. Check Cloudflare Dashboard for error details

### "Pages deployment failed"

Check:
1. Your `wrangler.toml` is correct
2. The `dist` directory exists and contains built files
3. You have permissions to deploy Pages
4. Check Cloudflare Dashboard for error details

## Comparison with Other Scripts

### `deploy.sh` vs `deploy-production.sh`

| Feature | `deploy.sh` | `deploy-production.sh` |
|---------|-------------|------------------------|
| Interactive prompts | ❌ | ✅ |
| Auto-detect Workers URL | ❌ | ✅ |
| Build validation | ❌ | ✅ |
| URL format validation | ❌ | ✅ |
| Colored output | Basic | Enhanced |
| Error handling | Basic | Comprehensive |
| Progress reporting | Basic | Detailed |

**Recommendation**: Use `deploy-production.sh` for production deployments.

## Best Practices

1. **Always test locally first**: Run `npm test` and `npm run build` before deploying
2. **Use the script in CI/CD**: The script can be used in GitHub Actions or other CI/CD pipelines
3. **Set API URL explicitly**: Use `--api-url` flag for consistency
4. **Review the summary**: Always check the deployment URLs and test them
5. **Monitor after deployment**: Check Cloudflare Dashboard for any issues

## Integration with CI/CD

The script can be used in CI/CD pipelines. Example for GitHub Actions:

```yaml
- name: Deploy to Production
  run: |
    npm run deploy:production -- --skip-tests --api-url ${{ secrets.VITE_API_URL }}
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Note: The `--skip-tests` flag is used because tests should run in a separate job.

## See Also

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Comprehensive deployment documentation
- [Production Config Verification](./PRODUCTION_CONFIG_VERIFICATION.md) - Configuration checklist
- [Scripts README](../scripts/README.md) - Overview of all scripts

