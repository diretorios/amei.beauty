# Quick Start - Testing & Deployment

## 🚀 Quick Test (5 minutes)

### 1. Test Frontend Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

**Visit**: `http://localhost:3000`

**Test**:
- ✅ Page loads
- ✅ Onboarding works (all 5 steps)
- ✅ Language switching works
- ✅ No console errors

---

## 🔧 Quick Backend Setup (10 minutes)

### 1. Login to Cloudflare

```bash
npx wrangler login
```

### 2. Create Database

```bash
npx wrangler d1 create amei-beauty-db
```

**Copy the `database_id`** from output.

### 3. Update Configuration

Edit `wrangler.toml`:
```toml
database_id = "YOUR_DATABASE_ID_HERE"  # ← Paste here
```

### 4. Run Migrations

```bash
npm run d1:migrate
```

### 5. Start Workers

```bash
npm run dev:workers
```

**Test**: `curl http://localhost:8787/api/health`

**Expected**: `{"status":"ok","timestamp":...}`

---

## 📦 Quick Deploy (15 minutes)

### Deploy Workers

```bash
npm run deploy:workers
```

**Copy the Workers URL** (e.g., `https://amei-beauty-api.xxx.workers.dev`)

### Deploy Pages

#### Option 1: CLI

```bash
# Update API URL in src/lib/api.ts (temporary)
# Or set VITE_API_URL in .env.production

npm run build
npm run deploy:pages
```

#### Option 2: GitHub (Recommended)

1. Push to GitHub
2. Connect to Cloudflare Pages
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-workers-url/api`

---

## ✅ Verification Checklist

### Local Testing
- [ ] Frontend runs: `npm run dev`
- [ ] Workers run: `npm run dev:workers`
- [ ] Onboarding completes
- [ ] AI completion works
- [ ] Directory loads

### Production
- [ ] Workers deployed
- [ ] Pages deployed
- [ ] API health check works
- [ ] Frontend loads
- [ ] Can publish a card
- [ ] Can view published card
- [ ] Directory shows published cards

---

## 🆘 Need Help?

- **Testing Issues**: See [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Deployment Issues**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Cloudflare Setup**: See [PHASE2_SETUP.md](./PHASE2_SETUP.md)

---

**Ready to test? Start with `npm run dev`!**

