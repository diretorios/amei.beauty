# How to Verify What's Running Locally

## Quick Verification

### 1. Check What's Running

```bash
# Check if Vite dev server is running
curl http://localhost:3000

# Check processes
ps aux | grep -E "(vite|node)" | grep -v grep
```

**Expected:** Only Vite dev server (frontend)

### 2. Check Browser DevTools

**Open:** `http://localhost:3000` → F12 → DevTools

#### Application Tab → Storage:

**IndexedDB:**
- ✅ Should see `amei_beauty_db` database
- ✅ Contains `cards` object store
- This confirms local storage is working

**LocalStorage:**
- ✅ Should see `app_language` key
- ✅ Value: `pt-BR`, `en`, or `es`
- This confirms preferences are saved

#### Network Tab:

**What you should see:**
- ✅ Static assets (JS, CSS, images)
- ✅ No API calls to `/api/*`
- ✅ No external API calls
- ✅ All requests are local

**What you should NOT see:**
- ❌ No requests to Cloudflare Workers
- ❌ No database queries
- ❌ No external API calls

### 3. Check Source Code

```bash
# Search for API calls
grep -r "fetch.*api" src/
grep -r "fetch.*http" src/

# Search for Cloudflare references
grep -r "cloudflare" . --exclude-dir=node_modules
grep -r "wrangler" . --exclude-dir=node_modules
grep -r "D1" . --exclude-dir=node_modules
```

**Expected:** No results (Cloudflare not implemented yet)

### 4. Check Storage Implementation

```bash
# View storage.ts
cat src/lib/storage.ts | head -20
```

**You should see:**
- Uses `indexedDB.open()` (local browser database)
- Uses `localStorage` (local browser storage)
- No `fetch()` calls to backend
- No Cloudflare Workers API calls

---

## Current Architecture Verification

### ✅ What IS Working (Local-First)

1. **Frontend PWA**
   - Vite dev server on `http://localhost:3000`
   - Preact components rendering
   - i18n translations loading
   - Styles loading

2. **Local Storage**
   - IndexedDB: `amei_beauty_db`
   - localStorage: Preferences
   - Data persists across page reloads

3. **Offline Capability**
   - Works without internet
   - Service worker caching (when built)
   - All data stored locally

### ❌ What is NOT Working (Not Implemented)

1. **Backend API**
   - No Cloudflare Workers
   - No API endpoints
   - No `/api/*` routes

2. **Cloud Database**
   - No D1 database
   - No cloud storage
   - No published cards

3. **Publishing**
   - Can't publish cards yet
   - No public URLs
   - No discovery directory

---

## Test Local Storage

### Test 1: Save a Card

1. Go through onboarding
2. Fill in Name, Profession, WhatsApp, Photo
3. Complete onboarding
4. Check DevTools → Application → IndexedDB
5. Should see card data saved

### Test 2: Reload Page

1. Complete onboarding
2. Reload page (F5)
3. Should still show profile (not onboarding again)
4. This confirms data persisted

### Test 3: Clear Storage

1. DevTools → Application → Clear storage
2. Click "Clear site data"
3. Reload page
4. Should show onboarding again
5. This confirms it's using local storage

---

## When Cloudflare is Added

You'll know Cloudflare Workers + D1 are working when:

1. **New Files Exist:**
   ```bash
   ls wrangler.toml
   ls workers/
   ```

2. **Network Tab Shows API Calls:**
   - Requests to `/api/publish`
   - Requests to `/api/card/:id`
   - Requests to `/api/search`

3. **Wrangler Dev Server:**
   ```bash
   npm run dev:workers
   # Should see: Ready on http://localhost:8787
   ```

4. **Cloudflare Dashboard:**
   - Workers deployed
   - D1 database created
   - R2 bucket created

---

## Summary

**Current State (Phase 1):**
- ✅ Frontend PWA (Vite)
- ✅ Local storage (IndexedDB)
- ✅ Works offline
- ❌ No backend
- ❌ No cloud database

**To Verify:**
1. Check DevTools → Application → IndexedDB (should see `amei_beauty_db`)
2. Check Network tab (should see NO `/api/*` requests)
3. Check for `wrangler.toml` (should NOT exist yet)

**When Cloudflare is Added:**
- `wrangler.toml` will exist
- `workers/` directory will exist
- Network tab will show `/api/*` requests
- Cloudflare Dashboard will show Workers + D1

