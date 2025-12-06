# Cloudflare Worker vs Pages: Understanding the Difference

## The Problem

You're seeing a **Worker** configuration screen, but you want to deploy a **Pages** project. These are two different Cloudflare services:

- **Workers**: Serverless functions (requires deploy command)
- **Pages**: Static site hosting (no deploy command needed)

## Current Situation

Based on your screenshot, Cloudflare has created your project as a **Worker**, not a **Pages** project. That's why:
- The "Deploy command" field is required
- It's trying to run `npx wrangler deploy` (Workers command)
- You're getting errors about Workers-specific commands

## Solution: Create a Pages Project Instead

You need to create a **new Pages project** (not a Worker) for your static site.

### Option 1: Create New Pages Project (Recommended)

1. **Go to Cloudflare Dashboard**
   - Navigate to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com)

2. **Create Pages Project**
   - Click **"Create application"**
   - Select **"Pages"** (NOT "Workers")
   - Click **"Connect to Git"**

3. **Connect Your Repository**
   - Select your GitHub account
   - Choose repository: `diretorios/amei.beauty`
   - Click **"Begin setup"**

4. **Configure Build Settings**
   - **Project name:** `amei-beauty` (or `amei-beauty-pages` to avoid conflict)
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist` (or leave empty - reads from `wrangler.toml`)
   - **Deploy command:** ⚠️ **LEAVE EMPTY** (Pages doesn't use this)
   - **Root directory:** `/` (or leave empty)

5. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add `VITE_API_URL` with your Workers API URL

6. **Save and Deploy**
   - Click **"Save and deploy"**
   - Cloudflare will build and deploy your static site

### Option 2: Keep Worker for API, Create Separate Pages Project

If you want to keep the Worker for your API:

1. **Keep the Worker** (`amei-beauty`) for your API endpoints
2. **Create a new Pages project** (`amei-beauty-pages` or `amei-beauty-frontend`) for your frontend
3. **Configure Pages** as described in Option 1

This way:
- Worker handles: `/api/*` routes
- Pages handles: Frontend static files

## How to Tell the Difference

### Worker Project
- Has "Deploy command" field (required)
- Has "Version command" field
- Shows "Workers Logs", "Workers Traces"
- Uses `wrangler deploy` to deploy

### Pages Project
- **NO** "Deploy command" field (or it's optional/empty)
- Has "Build command" and "Build output directory"
- Shows "Deployments" with build history
- Automatically deploys static files after build

## Recommended Setup

For your project structure:

```
amei-beauty-api (Worker)
├── Handles: /api/* routes
├── Uses: wrangler.workers.toml
└── Deploy: npm run deploy:workers

amei-beauty (Pages)
├── Handles: Frontend static files
├── Uses: wrangler.toml (Pages config)
└── Deploy: Automatic after build
```

## Next Steps

1. **Create a new Pages project** (not Worker)
2. **Connect your GitHub repository**
3. **Configure build settings** (no deploy command)
4. **Delete or ignore the Worker project** if you don't need it

---

**Key Point:** Pages projects don't need (and shouldn't have) a deploy command. If the field is required, you're in a Worker project, not a Pages project.

