# Phase 2 Setup Guide - Cloudflare Workers + D1

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Already added to package.json
3. **Node.js 18+**: Required for Wrangler

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

This will open your browser to authenticate with Cloudflare.

### 3. Create D1 Database

```bash
npx wrangler d1 create amei-beauty-db
```

**Important**: Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "amei-beauty-db"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Paste here
```

### 4. Create R2 Bucket

```bash
npx wrangler r2 bucket create amei-beauty-images
```

The bucket name is already configured in `wrangler.toml`.

### 5. Create KV Namespace for Rate Limiting

```bash
# Create production namespace
npx wrangler kv:namespace create "RATE_LIMIT_KV"

# Create preview namespace (for local development)
npx wrangler kv:namespace create "RATE_LIMIT_KV" --preview
```

**Important**: Copy the `id` and `preview_id` from the output and update `wrangler.workers.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "YOUR_KV_NAMESPACE_ID_HERE"  # ← Paste production ID here
preview_id = "YOUR_KV_PREVIEW_ID_HERE"  # ← Paste preview ID here
```

**Note**: Rate limiting will gracefully degrade if KV is not configured (allows all requests with a warning). This is intentional for development environments.

### 6. Run Database Migrations

```bash
npm run d1:migrate
```

Or manually:
```bash
npx wrangler d1 migrations apply amei-beauty-db
```

This creates the `cards` table and indexes.

### 7. Configure R2 Public Access (Optional)

To serve images publicly, configure R2 custom domain:
1. Go to Cloudflare Dashboard → R2
2. Select `amei-beauty-images` bucket
3. Configure public access or custom domain

### 8. Set Environment Variables

Create `.dev.vars` file (for local development):

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:
```
ENVIRONMENT=development
```

### 9. Test Locally

#### Option A: Run Workers Only

```bash
npm run dev:workers
```

Workers will run on `http://localhost:8787`

#### Option B: Run Frontend + Workers Together

```bash
npm run dev:full
```

This requires `concurrently` package (add if needed):
```bash
npm install -D concurrently
```

### 10. Test API Endpoints

```bash
# Health check
curl http://localhost:8787/api/health

# Should return: {"status":"ok","timestamp":...}
```

### 11. Update Frontend API URL

In production, set `VITE_API_URL` environment variable:

```bash
# .env.production
VITE_API_URL=https://your-worker.your-subdomain.workers.dev/api
```

Or update `src/lib/api.ts` to use your production URL.

## Deployment

### Deploy Workers

```bash
npm run deploy:workers
```

Or:
```bash
npx wrangler deploy
```

### Deploy Frontend (Pages)

```bash
npm run build
npm run deploy:pages
```

Or connect GitHub repo to Cloudflare Pages for automatic deployments.

## Verification

### Check Workers are Running

```bash
# List deployments
npx wrangler deployments list

# View logs
npx wrangler tail
```

### Check D1 Database

```bash
# Query database
npm run d1:execute -- "SELECT COUNT(*) FROM cards"

# Or with wrangler directly
npx wrangler d1 execute amei-beauty-db --command "SELECT * FROM cards LIMIT 5"
```

### Check Cloudflare Dashboard

1. **Workers**: [dash.cloudflare.com → Workers & Pages](https://dash.cloudflare.com)
   - Should see `amei-beauty-api` worker
   - Check logs and metrics

2. **D1**: [dash.cloudflare.com → D1](https://dash.cloudflare.com)
   - Should see `amei-beauty-db` database
   - Check data and queries

3. **R2**: [dash.cloudflare.com → R2](https://dash.cloudflare.com)
   - Should see `amei-beauty-images` bucket
   - Upload test image to verify

4. **KV**: [dash.cloudflare.com → Workers & Pages → KV](https://dash.cloudflare.com)
   - Should see `RATE_LIMIT_KV` namespace
   - Used for rate limiting (prevents API abuse)

## Troubleshooting

### Workers Not Starting

```bash
# Check wrangler version
npx wrangler --version

# Check configuration
npx wrangler dev --dry-run
```

### Database Connection Issues

```bash
# Verify database exists
npx wrangler d1 list

# Check migrations
npx wrangler d1 migrations list amei-beauty-db
```

### CORS Issues

CORS is already configured in `workers/index.ts`. If you see CORS errors:
1. Check `corsHeaders` are included in all responses
2. Verify frontend is calling correct API URL
3. Check browser console for specific error

### Image Upload Issues

1. Verify R2 bucket exists: `npx wrangler r2 bucket list`
2. Check bucket permissions
3. Verify file size limits (currently 5MB max)

## Next Steps

After setup:
1. ✅ Test publishing a card from frontend
2. ✅ Verify card appears in D1 database
3. ✅ Test public card view page
4. ✅ Test search functionality
5. ✅ Test image upload

## Cost Monitoring

Monitor costs in Cloudflare Dashboard:
- **Workers**: Free tier = 100k requests/day
- **D1**: $0.001/GB storage, $0.001/GB read
- **R2**: $0.015/GB storage, no egress fees

Expected cost for 1000 users: ~$0.60/month

---

**Phase 2 Status**: ✅ Infrastructure Ready

All Workers API endpoints are implemented and ready for deployment!

