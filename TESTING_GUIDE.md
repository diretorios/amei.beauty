# Testing Guide for amei.beauty

## 🧪 Testing Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm packages installed (`npm install`)
- [ ] Cloudflare account set up (for backend testing)
- [ ] D1 database created (for backend testing)

---

## 1. Frontend Testing (Local)

### Start Development Server

```bash
npm run dev
```

**Expected**: Server starts on `http://localhost:3000`

### Test Onboarding Flow

1. **Step 1: Name**
   - [ ] Enter name → Should validate and allow next
   - [ ] Leave empty → Should disable "Next" button
   - [ ] Test in all 3 languages (pt-BR, en, es)

2. **Step 2: Profession**
   - [ ] Enter profession → Should validate
   - [ ] Test with different professions (Cabeleireira, Manicure, etc.)
   - [ ] Leave empty → Should disable "Next"

3. **Step 3: WhatsApp**
   - [ ] Enter WhatsApp number → Should validate
   - [ ] Test different formats (with/without country code)
   - [ ] Leave empty → Should disable "Next"

4. **Step 4: Photo**
   - [ ] Upload photo → Should display preview
   - [ ] Remove photo → Should clear preview
   - [ ] Skip photo → Should allow proceeding
   - [ ] Test different image formats (JPG, PNG, WebP)

5. **Step 5: AI Completion** (NEW)
   - [ ] Click "Start search" → Should show loading spinner
   - [ ] Wait for suggestions → Should show review screen
   - [ ] Review suggestions → Should show headline, bio, services
   - [ ] Approve suggestions → Should save and complete
   - [ ] Skip AI → Should complete without AI suggestions
   - [ ] Test error handling (if API fails)

### Test Profile Page

1. **After Onboarding**
   - [ ] Should show profile information
   - [ ] Should show "Publish" button
   - [ ] Should show language selector
   - [ ] Should persist data on reload

2. **Language Switching**
   - [ ] Change language → Should update all UI text
   - [ ] Reload page → Should remember language preference

### Test Directory Page

1. **Navigation**
   - [ ] Click "Directory" → Should navigate to `/directory`
   - [ ] Should show directory page
   - [ ] Should show search and filters

2. **Search**
   - [ ] Enter search query → Should show results
   - [ ] Clear search → Should show all cards
   - [ ] Test with no results → Should show empty state

3. **Filters**
   - [ ] Select category → Should filter results
   - [ ] Enter location → Should filter results
   - [ ] Check "Featured" → Should show only featured
   - [ ] Combine filters → Should work together

4. **Pagination**
   - [ ] Navigate pages → Should load different cards
   - [ ] Test first/last page → Buttons should disable correctly

### Test Public Card View

1. **Card Display**
   - [ ] Navigate to `/card/:id` → Should show card
   - [ ] Navigate to `/:username` → Should show card
   - [ ] Should display all card information
   - [ ] WhatsApp button → Should open WhatsApp

2. **Error Handling**
   - [ ] Invalid card ID → Should show error
   - [ ] Non-existent username → Should show error

---

## 2. Backend Testing (Cloudflare Workers)

### Setup

```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database (if not done)
npx wrangler d1 create amei-beauty-db

# Update wrangler.toml with database_id

# Run migrations
npm run d1:migrate

# Start Workers dev server
npm run dev:workers
```

**Expected**: Workers running on `http://localhost:8787`

### Test API Endpoints

#### Health Check
```bash
curl http://localhost:8787/api/health
```
**Expected**: `{"status":"ok","timestamp":...}`

#### Publish Card
```bash
curl -X POST http://localhost:8787/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "full_name": "Test Professional",
      "profession": "Cabeleireira",
      "whatsapp": "+5511999999999",
      "headline": "Test headline",
      "bio": "Test bio"
    },
    "services": [],
    "social": [],
    "links": [],
    "referral_code": "TEST123"
  }'
```
**Expected**: Returns published card with ID

#### Get Card
```bash
curl http://localhost:8787/api/card/{card_id}
```
**Expected**: Returns card data

#### Search Cards
```bash
curl "http://localhost:8787/api/search?q=cabeleireira"
```
**Expected**: Returns matching cards

#### Directory
```bash
curl "http://localhost:8787/api/directory?page=1&limit=10"
```
**Expected**: Returns paginated card list

#### AI Completion
```bash
curl -X POST http://localhost:8787/api/ai/complete \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Professional",
    "profession": "Cabeleireira",
    "whatsapp": "+5511999999999"
  }'
```
**Expected**: Returns AI suggestions (headline, bio, services)

---

## 3. Integration Testing

### Full Flow Test

1. **Create Card Locally**
   - [ ] Complete onboarding
   - [ ] Use AI completion
   - [ ] Verify card saved in IndexedDB

2. **Publish Card**
   - [ ] Click "Publish" button
   - [ ] Verify card published to D1
   - [ ] Get card ID/username

3. **View Published Card**
   - [ ] Navigate to `/card/{id}` or `/{username}`
   - [ ] Verify card displays correctly
   - [ ] Test WhatsApp button

4. **Search Published Card**
   - [ ] Go to directory
   - [ ] Search for published card
   - [ ] Verify it appears in results

---

## 4. Unit Tests

### Run Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Test Coverage

- [ ] i18n tests pass
- [ ] Storage tests pass
- [ ] WhatsApp tests pass
- [ ] API client tests pass
- [ ] Component tests pass
- [ ] AI completion tests pass

---

## 5. Browser Testing

### Test in Different Browsers

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (Chrome Mobile, Safari Mobile)

### Test PWA Features

- [ ] Install as PWA → Should show install prompt
- [ ] Test offline mode → Should work without internet
- [ ] Test service worker → Should cache assets
- [ ] Test IndexedDB → Should persist data

### Test Mobile Responsiveness

- [ ] Test on mobile viewport (360px+)
- [ ] Test touch interactions
- [ ] Test keyboard navigation
- [ ] Test form inputs (numeric keyboard for WhatsApp)

---

## 6. Performance Testing

### Lighthouse Audit

```bash
# Build for production
npm run build

# Preview build
npm run preview

# Run Lighthouse in Chrome DevTools
# Target: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
```

### Check Bundle Size

```bash
npm run build
# Check dist/ folder size
# Should be < 500KB total
```

---

## 7. Security Testing

### Check for Issues

- [ ] No console errors
- [ ] No exposed API keys
- [ ] Input validation works
- [ ] XSS protection (no innerHTML with user data)
- [ ] CORS configured correctly
- [ ] HTTPS enforced (in production)

---

## 8. Accessibility Testing

### WCAG 2.1 Compliance

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

### Test with Screen Reader

- [ ] Navigate with keyboard only
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Verify all content is accessible

---

## 🐛 Common Issues & Solutions

### Issue: Workers not starting
**Solution**: 
- Check `wrangler.toml` has correct database_id
- Verify `npx wrangler login` completed
- Check `.dev.vars` exists (optional for local)

### Issue: Database errors
**Solution**:
- Run migrations: `npm run d1:migrate`
- Verify database exists: `npx wrangler d1 list`
- Check database_id in wrangler.toml

### Issue: CORS errors
**Solution**:
- Verify Workers API includes CORS headers
- Check API URL in frontend (`VITE_API_URL`)
- Ensure Workers are running

### Issue: Translations not loading
**Solution**:
- Check locale files exist in `src/locales/`
- Verify import paths in `i18n.ts`
- Check browser console for errors

### Issue: PWA not installing
**Solution**:
- Build for production: `npm run build`
- Serve over HTTPS (required for PWA)
- Check manifest.json exists

---

## ✅ Testing Checklist Summary

- [ ] Frontend runs locally
- [ ] Onboarding flow works (all 5 steps)
- [ ] AI completion works
- [ ] Profile page displays correctly
- [ ] Directory page works
- [ ] Search and filters work
- [ ] Public card view works
- [ ] Workers API runs locally
- [ ] All API endpoints respond
- [ ] Database migrations applied
- [ ] Unit tests pass
- [ ] Browser compatibility verified
- [ ] PWA features work
- [ ] Mobile responsive
- [ ] Lighthouse scores ≥ 95
- [ ] Accessibility verified
- [ ] No console errors
- [ ] Security checks passed

---

**Ready for deployment when all checks pass!**

