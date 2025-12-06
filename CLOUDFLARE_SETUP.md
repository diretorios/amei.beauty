# Cloudflare Workers + D1 Setup Guide

## Current Status

**⚠️ Cloudflare Workers + D1 are NOT implemented yet.**

Currently, the app is running in **local-first mode**:
- ✅ Frontend PWA (Vite dev server)
- ✅ Local storage (IndexedDB + localStorage)
- ✅ Works 100% offline
- ❌ No backend API
- ❌ No cloud database
- ❌ No publishing functionality

---

## How to Verify What's Currently Running

### 1. Check Browser DevTools

**Open DevTools → Application Tab:**

1. **IndexedDB**: 
   - Application → Storage → IndexedDB
   - You should see `amei_beauty_db` database
   - This confirms local storage is working

2. **LocalStorage**:
   - Application → Storage → Local Storage
   - You should see `app_language` key
   - This confirms preferences are saved locally

3. **Network Tab**:
   - Check Network requests
   - You should see **NO API calls** to any backend
   - All data is stored locally

### 2. Check Running Processes

```bash
# Check what's running
ps aux | grep vite

# Or check port 3000
lsof -i :3000
```

You should see:
- ✅ Vite dev server (frontend only)
- ❌ No Cloudflare Workers running locally
- ❌ No database connections

### 3. Check Source Code

**Current storage implementation:**
```typescript
// src/lib/storage.ts
// Uses IndexedDB (local browser database)
// NOT Cloudflare D1
```

**No API calls:**
- Search codebase for `fetch('/api` or `fetch('https://`
- You won't find any backend API calls yet

---

## When Cloudflare Workers + D1 Are Implemented

### How to Verify They're Working

#### 1. **Check for `wrangler.toml`**
```bash
ls -la wrangler.toml
```
This file configures Cloudflare Workers and D1.

#### 2. **Check for `workers/` directory**
```bash
ls -la workers/
```
This should contain your Worker API code.

#### 3. **Check Network Requests**
In browser DevTools → Network:
- Look for requests to `/api/*` endpoints
- These will be handled by Cloudflare Workers

#### 4. **Check Cloudflare Dashboard**
- Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
- Go to Workers & Pages
- You should see your Worker deployed
- Go to D1 → You should see your database

#### 5. **Local Development with Wrangler**
```bash
# Start local Workers dev server
npm run dev:workers

# Or with wrangler directly
npx wrangler dev
```

You should see:
```
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

#### 6. **Check Environment Variables**
```bash
# Check for .dev.vars file (local secrets)
cat .dev.vars

# Should contain:
# D1_DATABASE_ID=...
# R2_BUCKET_NAME=...
```

---

## Implementation Checklist

To add Cloudflare Workers + D1, you need:

### Phase 2A: Setup Cloudflare Infrastructure

- [ ] Install Wrangler CLI: `npm install -D wrangler`
- [ ] Create Cloudflare account
- [ ] Create D1 database: `wrangler d1 create amei-beauty-db`
- [ ] Create R2 bucket: `wrangler r2 bucket create amei-beauty-images`
- [ ] Create `wrangler.toml` configuration file
- [ ] Set up environment variables

### Phase 2B: Create Workers API

- [ ] Create `workers/` directory
- [ ] Create API endpoints:
  - [ ] `POST /api/publish` - Publish card
  - [ ] `GET /api/card/:id` - Get published card
  - [ ] `PUT /api/card/:id` - Update card
  - [ ] `DELETE /api/card/:id` - Unpublish card
  - [ ] `GET /api/search` - Search directory
- [ ] Create D1 database schema
- [ ] Implement image upload to R2

### Phase 2C: Connect Frontend to Backend

- [ ] Create API client (`src/lib/api.ts`)
- [ ] Update storage layer to call Workers API
- [ ] Add "Publish" button to UI
- [ ] Handle publish/unpublish flow
- [ ] Error handling for API calls

### Phase 2D: Testing & Deployment

- [ ] Test locally with `wrangler dev`
- [ ] Deploy Workers: `wrangler deploy`
- [ ] Deploy Pages: Connect to GitHub or `wrangler pages deploy`
- [ ] Verify in production

---

## Quick Start: Adding Cloudflare Workers + D1

### Step 1: Install Dependencies

```bash
npm install -D wrangler
npm install -D @cloudflare/workers-types
```

### Step 2: Create `wrangler.toml`

```toml
name = "amei-beauty-api"
main = "workers/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "amei-beauty-db"
database_id = "YOUR_D1_DATABASE_ID"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "amei-beauty-images"
```

### Step 3: Create Worker

```typescript
// workers/index.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/publish' && request.method === 'POST') {
      // Handle publish
      const card = await request.json();
      await env.DB.prepare('INSERT INTO cards ...').run(card);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
```

### Step 4: Create D1 Schema

```sql
-- migrations/0001_initial.sql
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  profile_json TEXT NOT NULL,
  published_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1
);

CREATE INDEX idx_username ON cards(username);
CREATE INDEX idx_published_at ON cards(published_at);
```

### Step 5: Run Migrations

```bash
wrangler d1 migrations apply amei-beauty-db
```

### Step 6: Test Locally

```bash
wrangler dev
```

Visit `http://localhost:8787/api/publish` to test.

---

## Verification Commands

Once implemented, use these to verify:

```bash
# Check Workers are running
wrangler dev --list

# Check D1 database
wrangler d1 execute amei-beauty-db --command "SELECT COUNT(*) FROM cards"

# Check R2 bucket
wrangler r2 bucket list

# View Workers logs
wrangler tail

# Check deployment status
wrangler deployments list
```

---

## Current Architecture (Phase 1)

```
┌─────────────────┐
│   Browser       │
│   (Local PWA)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   IndexedDB     │ ← Local storage only
│   localStorage  │
└─────────────────┘
```

## Future Architecture (Phase 2+)

```
┌─────────────────┐
│   Browser       │
│   (Local PWA)   │
└────────┬────────┘
         │
         │ [Publish]
         ▼
┌─────────────────┐
│ Cloudflare Pages│ ← Static hosting
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cloudflare     │ ← API endpoints
│  Workers        │
└────────┬────────┘
         │
         ├──► D1 Database ← Published cards
         └──► R2 Storage ← Images
```

---

## Summary

**Right now:**
- ✅ Local-first PWA (works offline)
- ✅ IndexedDB for storage
- ❌ No Cloudflare Workers
- ❌ No D1 database
- ❌ No publishing

**To verify Cloudflare is working:**
1. Check for `wrangler.toml` file
2. Check for `workers/` directory
3. Check Network tab for `/api/*` requests
4. Check Cloudflare Dashboard
5. Run `wrangler dev` locally

**Next step:** Implement Phase 2 (Cloudflare Workers + D1) when ready!

