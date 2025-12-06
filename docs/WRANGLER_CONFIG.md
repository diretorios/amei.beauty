# Wrangler Configuration Guide

## Overview

The `wrangler.toml` file is configured to work for both:
- **Cloudflare Pages** (via GitHub integration)
- **Cloudflare Workers** (via CLI deployment)

## Configuration Details

### Pages Configuration

```toml
name = "amei-beauty"
pages_build_output_dir = "dist"
```

- `name` must match your Cloudflare Pages project name (`amei-beauty`)
- `pages_build_output_dir` tells Pages where to find the built files (`dist`)

### Workers Configuration

```toml
main = "workers/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
```

- `main` points to the Workers entry point
- Workers are deployed with explicit name `amei-beauty-api` via `--name` flag

## Why Two Names?

- **Pages project name:** `amei-beauty` (matches Cloudflare Pages project)
- **Workers name:** `amei-beauty-api` (set via `--name` flag in deployment scripts)

This allows both services to coexist with appropriate naming.

## Deployment Scripts

### Workers Deployment

```bash
npm run deploy:workers
# Runs: wrangler deploy --name amei-beauty-api
```

This explicitly sets the Worker name to `amei-beauty-api` regardless of the `name` field in `wrangler.toml`.

### Pages Deployment

```bash
npm run deploy:pages
# Runs: wrangler pages deploy dist --project-name=amei-beauty
```

This uses the `name` field from `wrangler.toml` (which is `amei-beauty`).

### Development

```bash
npm run dev:workers
# Runs: wrangler dev --name amei-beauty-api
```

## Cloudflare Pages GitHub Integration

When using Cloudflare's GitHub integration:

1. Cloudflare detects `wrangler.toml` in your repo
2. It reads `name = "amei-beauty"` and expects it to match the Pages project name
3. It reads `pages_build_output_dir = "dist"` to know where build output is
4. It runs `npm run build` (as configured in Pages dashboard)
5. It deploys the `dist` directory

**Note:** The build command in Cloudflare Pages dashboard should be set to `npm run build` (not just `npm run build` with output directory - Cloudflare reads that from `wrangler.toml`).

## Troubleshooting

### Warning: "Update wrangler.toml in your repo"

If you see this warning, ensure:
- ✅ `name = "amei-beauty"` matches your Pages project name
- ✅ `pages_build_output_dir = "dist"` is set correctly

### Workers Deploying with Wrong Name

If Workers deploy as `amei-beauty` instead of `amei-beauty-api`:
- Check that `npm run deploy:workers` uses `--name amei-beauty-api` flag
- Verify the script in `package.json`

### Pages Not Finding Build Output

If Pages can't find your build:
- Verify `pages_build_output_dir = "dist"` in `wrangler.toml`
- Check that `npm run build` actually creates a `dist` directory
- Verify build command in Cloudflare Pages dashboard is `npm run build`

