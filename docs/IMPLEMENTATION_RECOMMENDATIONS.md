# Implementation Recommendations for amei.beauty SaaS

## Executive Summary

Based on the PROMPT file's architecture and your requirements, here are the best implementation options for `amei.beauty` - a low-cost, low-maintenance SaaS PWA for MEI beauty professionals in Brazil.

---

## 🎯 CRITICAL SUCCESS FACTORS (MUST IMPLEMENT)

These factors are **non-negotiable** for maximum success in the Brazilian MEI market:

### 1. **Insanely Simple Onboarding** ⚡
**Ask only 4 things:**
- Name
- Profession
- WhatsApp number
- One photo

**Then:** AI automatically fills the rest by scraping the internet for the user's digital footprint (social media, business listings, etc.)

**Why:** MEIs have zero patience for long forms. Get them to "wow" in under 60 seconds.

### 2. **Brazilian & MEI-Friendly Design** 🇧🇷
- **Language**: Portuguese (BR) as default, not PT-PT
- **Multi-Language Support**: Full i18n for English, Brazilian Portuguese (pt-BR), and Spanish (es)
  - User selects preferred language on first visit
  - Language preference saved locally
  - All UI, messages, and content translated
  - Default to pt-BR for Brazilian users (detected via browser/geolocation)
- **Colors**: Vibrant, warm Brazilian palette (greens, yellows, blues)
- **Examples**: Real MEI beauty professionals from Brazil
- **Categories**: Brazilian beauty services (cabelo, unhas, maquiagem, depilação, etc.)
- **Style**: Warm, approachable, professional but not corporate
- **Payment**: Brazilian payment methods (PIX, credit cards)

**Why:** Must feel like it was built FOR them, not adapted from somewhere else. Multi-language support enables expansion to LATAM (Spanish) while maintaining Brazilian-first approach.

### 3. **WhatsApp as Primary Channel** 📱
- **80% of MEI business flows through WhatsApp**
- Deep WhatsApp integration:
  - "Fale comigo" button → Opens WhatsApp chat
  - WhatsApp Business API integration (optional)
  - Share card via WhatsApp
  - QR code that opens WhatsApp
  - WhatsApp status integration

**Why:** WhatsApp IS their business platform. Ignore this = failure.

### 4. **Credibility Features** ⭐
MEIs desperately want to look serious and professional:
- **Ratings**: Client star ratings (1-5)
- **Testimonials**: Client reviews with photos
- **Client Photos**: Before/after galleries
- **Badges**: "Verificado", "5+ anos de experiência", "100+ clientes"
- **Certifications**: Display professional certifications
- **Social Proof**: "X clientes atendidos", "Y anos no mercado"

**Why:** Credibility = more clients = more income. This is THE selling point.

### 5. **Ultra-Low Pricing** 💰
- **R$29-49/ano** (approximately $6-10/year)
- High affordability = high adoption
- Consider:
  - Free tier: Local editing only (no publish)
  - Basic: R$29/ano - Publish 1 card
  - Pro: R$49/ano - Multiple cards, custom domain, priority in directory

**Why:** MEIs are price-sensitive. Even R$50/month is too much. Annual pricing reduces friction.

### 6. **Discovery Directory** 🔍
**MANDATORY** - Not optional:
- Public directory of all published MEI cards
- Search by:
  - Name
  - Service type (cabelo, unhas, etc.)
  - Location (city, neighborhood)
  - Price range
- Category filters
- Featured listings (for Pro users)
- **Key insight**: If directory sends them even 1 client, they stay forever

**Why:** MEIs love visibility. Discovery = value = retention.

### 7. **Sell Pride, Simplicity, Results — NOT Technology** 🎨
**Marketing messaging:**
- ❌ "AI-powered digital business card platform"
- ✅ "Seu cartão profissional em 1 minuto"
- ✅ "Apareça mais profissional e ganhe mais clientes"
- ✅ "Seja encontrada por quem precisa dos seus serviços"

**UI/UX:**
- Hide technical complexity
- Use simple, warm language
- Show results (more clients, more professional)
- Celebrate their profession

**Why:** MEIs don't care about tech. They care about looking professional and getting clients.

### 8. **Viral Recommendation Engine** 💚
**The "amei" Wordplay:**
- **"amei"** = "loved" in Portuguese (past tense of "amar")
- **"a MEI"** = "A Micro Empreendedor Individual" (the MEI professional)
- **"amei a MEI"** = "I loved the MEI professional" = Perfect marketing hook!

**Required Features:**
- **"Amei este profissional!" Button** on every published card
  - One-click recommendation
  - Shares card via WhatsApp/Social media
  - Pre-filled message: "Amei este profissional! Confira: [card link]"
- **Customer recommendation flow**
  - Happy customers can easily recommend their loved professional
  - Share to WhatsApp, Instagram, Facebook
  - Generate shareable link with referral code
- **Viral loop**
  - When someone clicks shared link → Shows card + "Você também vai amar!" (You'll love it too!)
  - Track recommendations → Show "X pessoas recomendaram" (X people recommended)
  - Reward professionals with badges for high recommendations
- **Social proof amplification**
  - "Maria amou este profissional" (Maria loved this professional)
  - "João recomendou" (João recommended)
  - Show recommendation count prominently

**Why:** Word-of-mouth is everything in Brazil. Make it dead simple for happy customers to spread the word. The "amei" wordplay creates instant brand recognition and emotional connection. This is how you "take the professional beauty industry in Brazil by storm."

---

## 1. UNDERSTAND: Core Requirements

### Primary Goals
- **PWA**: Mobile-first, responsive, installable
- **SaaS Model**: Ultra-low cost (R$29-49/ano) subscription for MEI beauty professionals
- **Privacy-First**: No personal data stored unless user opts to publish
- **Low Infrastructure Cost**: Cloudflare-based, minimal maintenance
- **Security**: Very secure, zero-trust model
- **Features**: Digital business cards with services, prices, promotions
- **WhatsApp-First**: Deep WhatsApp integration as primary channel
- **AI-Powered**: Auto-complete profiles from digital footprint
- **Credibility-Focused**: Ratings, testimonials, badges, social proof
- **Discovery Directory**: Public searchable directory (mandatory)
- **Brazilian-First**: Portuguese (BR) as default, Brazilian design, PIX payments
- **Multi-Language**: Full i18n support for English, Brazilian Portuguese (pt-BR), and Spanish (es) - user selects preferred language
- **Viral-First**: Easy customer recommendations leveraging "amei" wordplay ("amei" = loved, "a MEI" = the MEI professional)

### Key Tension to Resolve
The PROMPT file emphasizes **zero-backend** and **local-only** storage, but you need **optional publishing** functionality. Solution: Hybrid architecture with local-first editing and optional cloud publishing.

---

## 2. ANALYZE: Architecture Options

### Option A: Cloudflare Pages + D1 + Workers (RECOMMENDED) ⭐

**Stack:**
- **Frontend**: Static PWA (React/Vite or Vanilla JS + TypeScript)
- **Hosting**: Cloudflare Pages (free tier: unlimited requests, 500 builds/month)
- **Database**: Cloudflare D1 (SQLite-based, $0.001/GB-month storage, $0.001/GB read)
- **API**: Cloudflare Workers (free tier: 100k requests/day)
- **Storage**: Cloudflare R2 (S3-compatible, $0.015/GB-month, no egress fees)

**Architecture:**
```
┌─────────────────┐
│   PWA Client    │ (Local-first, works offline)
│  (LocalStorage) │
└────────┬────────┘
         │
         │ [Optional Publish]
         ▼
┌─────────────────┐
│ Cloudflare Pages│ (Static hosting)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cloudflare     │ (API endpoints)
│  Workers        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cloudflare D1  │ (Published cards only)
│  (SQLite)       │
└─────────────────┘
```

**Cost Estimate (1000 users, 50% publish):**
- Pages: $0 (free tier)
- Workers: $0 (free tier covers ~100k requests/day)
- D1: ~$0.10/month (500 published cards × 50KB avg = 25MB)
- R2: ~$0.50/month (images/assets)
- **Total: ~$0.60/month** (scales linearly)

**Pros:**
- ✅ Extremely low cost
- ✅ Zero server maintenance
- ✅ Global CDN (fast in Brazil)
- ✅ Built-in DDoS protection
- ✅ Automatic HTTPS
- ✅ Scales automatically
- ✅ Local-first editing (respects PROMPT)
- ✅ Optional publishing (meets SaaS requirement)

**Cons:**
- ⚠️ D1 is still relatively new (but stable)
- ⚠️ SQLite limitations (but sufficient for this use case)

---

### Option B: Cloudflare Pages + KV + Workers

**Stack:**
- **Frontend**: Static PWA
- **Hosting**: Cloudflare Pages
- **Database**: Cloudflare KV (key-value store)
- **API**: Cloudflare Workers

**Cost Estimate:**
- Pages: $0
- Workers: $0 (free tier)
- KV: $0.50/month (1M reads, 1M writes, 1M deletes)
- **Total: ~$0.50/month**

**Pros:**
- ✅ Simple key-value model
- ✅ Very fast reads
- ✅ Low cost

**Cons:**
- ⚠️ No SQL queries (harder to implement search/discovery)
- ⚠️ Eventual consistency (may not suit all use cases)
- ⚠️ Less structured than D1

**Verdict:** Use if you don't need search/discovery features. D1 is better for structured queries.

---

### Option C: Cloudflare Pages + Supabase (PostgreSQL)

**Stack:**
- **Frontend**: Static PWA
- **Hosting**: Cloudflare Pages
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage

**Cost Estimate:**
- Pages: $0
- Supabase Free Tier: $0 (500MB database, 1GB storage)
- Supabase Pro: $25/month (if you exceed free tier)
- **Total: $0-25/month**

**Pros:**
- ✅ Full PostgreSQL (powerful queries)
- ✅ Built-in auth (if needed later)
- ✅ Real-time subscriptions
- ✅ Mature platform

**Cons:**
- ⚠️ Higher cost if you scale
- ⚠️ External dependency (not pure Cloudflare)
- ⚠️ More complex than needed for MVP

**Verdict:** Overkill for MVP, but good if you need advanced features later.

---

## 3. REASON: Recommended Architecture

### **RECOMMENDED: Option A (Cloudflare Pages + D1 + Workers)**

**Why:**
1. **Aligns with PROMPT**: Local-first editing, optional cloud publishing
2. **Lowest cost**: ~$0.60/month for 1000 users
3. **Zero maintenance**: Fully managed by Cloudflare
4. **Brazil-optimized**: Cloudflare has edge locations in São Paulo
5. **Secure by default**: HTTPS, DDoS protection, WAF included
6. **Scalable**: Handles millions of requests without code changes

---

## 4. SYNTHESIZE: Implementation Strategy

### Phase 1: Core PWA + Ultra-Simple Onboarding (MVP)
- ✅ Build PWA following PROMPT file exactly
- ✅ **4-field onboarding**: Name, Profession, WhatsApp, Photo
- ✅ **AI profile completion**: Scrape digital footprint (social media, business listings)
- ✅ All editing happens locally (IndexedDB/localStorage)
- ✅ Works 100% offline
- ✅ WhatsApp deep linking ("Fale comigo" button)
- ✅ **Multi-language support (i18n)**: English, Brazilian Portuguese (pt-BR), Spanish (es)
  - Language selector on first visit
  - Language preference saved locally
  - Default to pt-BR for Brazilian users (auto-detect)
- ✅ Brazilian design system (colors, typography, examples)

### Phase 2: Publishing + Discovery Directory (MANDATORY)
- ✅ Add "Publicar" button (opt-in only)
- ✅ User explicitly chooses what to publish
- ✅ Cloudflare Workers API for publishing
- ✅ D1 stores only published cards (public data)
- ✅ Generate unique URL: `amei.beauty/@username` or `amei.beauty/u/[id]`
- ✅ **Public Discovery Directory** (mandatory, not optional)
- ✅ Search by name/service/location/city
- ✅ Category filters (cabelo, unhas, maquiagem, depilação, etc.)
- ✅ Featured listings (Pro tier)

### Phase 3: Credibility Features
- ✅ Ratings system (1-5 stars)
- ✅ Testimonials with client photos
- ✅ Client photo galleries (before/after)
- ✅ Badge system ("Verificado", "5+ anos", "100+ clientes")
- ✅ Certifications display
- ✅ Social proof counters

### Phase 4: SaaS Monetization
- ✅ Free tier: Local editing only (no publish)
- ✅ Basic tier (R$29/ano): Publish 1 card, basic directory listing
- ✅ Pro tier (R$49/ano): Multiple cards, custom domain, featured in directory, priority support
- ✅ PIX payment integration (Brazilian payment method)
- ✅ Annual subscription model

---

## 5. CONCLUDE: Technical Stack & Implementation Plan

### **Recommended Tech Stack**

#### Frontend
- **Framework**: Vite + TypeScript + Vanilla JS (or Preact for minimal bundle)
- **Styling**: CSS Modules or Tailwind CSS (utility-first)
- **PWA**: Workbox for service worker
- **State**: Local-first (IndexedDB + localStorage)
- **i18n**: Custom lightweight i18n solution or i18next (lightweight version)
  - Supported languages: English (en), Brazilian Portuguese (pt-BR), Spanish (es)
  - Language detection: Browser language + geolocation
  - Language preference stored in localStorage
- **Build**: Vite (fast, optimized)

#### Backend (Cloudflare)
- **API**: Cloudflare Workers (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (for images/assets)
- **Hosting**: Cloudflare Pages

#### Data Model (Published Cards Only)
```typescript
interface PublishedCard {
  id: string; // UUID or short ID
  username?: string; // Optional vanity URL
  profile: {
    photo_url?: string; // R2 URL
    full_name: string;
    profession: string; // e.g., "Cabeleireira", "Manicure"
    headline: string;
    bio: string;
    whatsapp: string; // WhatsApp number (formatted)
  };
  services: Service[];
  social: SocialLink[];
  links: CustomLink[];
  
  // Credibility features
  ratings: {
    average: number; // 1-5
    count: number;
  };
  testimonials: Testimonial[];
  client_photos: ClientPhoto[];
  badges: Badge[]; // "Verificado", "5+ anos", etc.
  certifications: Certification[];
  social_proof: {
    clients_served?: number;
    years_experience?: number;
  };
  
  // Viral recommendation features
  recommendations: {
    count: number; // Total recommendations
    recent: Recommendation[]; // Last 10 recommendations
  };
  referral_code: string; // Unique code for tracking recommendations
  
  // Location for discovery
  location: {
    city?: string;
    neighborhood?: string;
    state?: string;
  };
  
  // Metadata
  published_at: string; // ISO-8601
  updated_at: string;
  is_active: boolean;
  is_featured: boolean; // Pro tier
  subscription_tier: 'free' | 'basic' | 'pro';
}
```

#### API Endpoints (Workers)
```
# Card Management
POST   /api/publish          - Publish a card
GET    /api/card/:id         - Get published card (public)
PUT    /api/card/:id         - Update published card
DELETE /api/card/:id         - Unpublish card

# Discovery Directory (MANDATORY)
GET    /api/search           - Search published cards
GET    /api/directory        - List all published cards (paginated)
GET    /api/categories       - Get categories and counts
GET    /api/locations        - Get locations and counts

# AI Profile Completion
POST   /api/ai/complete      - AI auto-fill profile from digital footprint
POST   /api/ai/suggest       - Suggest services/prices based on profession

# Credibility Features
POST   /api/testimonials     - Add testimonial (with moderation)
POST   /api/ratings          - Add rating
GET    /api/card/:id/reviews - Get reviews/testimonials

# Viral Recommendations
POST   /api/recommend        - Recommend a professional ("Amei este profissional!")
GET    /api/card/:id/recommendations - Get recommendation count and recent
POST   /api/share            - Generate shareable link with referral code
GET    /api/referral/:code   - Track referral (when someone clicks shared link)

# WhatsApp Integration
GET    /api/whatsapp/:id     - Generate WhatsApp deep link
POST   /api/whatsapp/share   - Share card via WhatsApp
POST   /api/whatsapp/recommend - Share recommendation via WhatsApp ("Amei este profissional!")

# Payments (Brazilian)
POST   /api/payment/pix      - Generate PIX payment
GET    /api/payment/status   - Check payment status
POST   /api/subscription     - Create/update subscription
```

---

## Security Considerations

### Authentication
- **Option 1**: WhatsApp + OTP (SMS/WhatsApp verification code)
- **Option 2**: Email + magic link (no passwords)
- **Option 3**: WebAuthn (passwordless, most secure)
- **Option 4**: Nostr keypair (aligns with PROMPT file)

**Recommendation**: **WhatsApp + OTP** (most MEI-friendly, aligns with primary channel). Fallback to email if WhatsApp fails.

### Data Privacy
- ✅ Published cards are public (by design)
- ✅ Unpublished cards never leave device
- ✅ No analytics/tracking (per PROMPT)
- ✅ CSP headers (strict)
- ✅ Input sanitization
- ✅ Rate limiting on Workers

### Compliance
- ✅ LGPD compliance (Brazil's GDPR)
- ✅ User can delete published data anytime
- ✅ Clear privacy policy
- ✅ Opt-in only for publishing

---

## Deployment & Maintenance

### Deployment
1. **Frontend**: `wrangler pages deploy` (Cloudflare CLI)
2. **Workers**: `wrangler deploy` (automated via GitHub Actions)
3. **Database**: D1 migrations via `wrangler d1 migrations apply`

### CI/CD
```yaml
# .github/workflows/deploy.yml
- Cloudflare Pages: Auto-deploy on push to main
- Workers: Deploy via wrangler
- D1: Migrations run automatically
```

### Monitoring
- **Cloudflare Analytics**: Built-in (free)
- **Workers Logs**: Real-time in dashboard
- **Error Tracking**: Sentry (optional, free tier)

### Maintenance
- **Zero server maintenance**: Cloudflare handles everything
- **Database backups**: D1 automatic backups (or manual via wrangler)
- **Updates**: Deploy new Workers/Pages code only

---

## Cost Breakdown (1000 Active Users)

| Service | Usage | Cost |
|---------|-------|------|
| Cloudflare Pages | Static hosting | $0 |
| Cloudflare Workers | API requests | $0 (free tier) |
| Cloudflare D1 | 25MB storage, 1M reads | ~$0.10 |
| Cloudflare R2 | 50GB images | ~$0.75 |
| **Total** | | **~$0.85/month** |

**At 10,000 users (50% publish):**
- D1: ~$1/month
- R2: ~$5/month
- **Total: ~$6/month**

**At 100,000 users:**
- D1: ~$10/month
- R2: ~$50/month
- Workers: ~$5/month (if exceeding free tier)
- **Total: ~$65/month**

---

## Implementation Roadmap

### Week 1-2: Core PWA + Ultra-Simple Onboarding
- [ ] Scaffold project (Vite + TypeScript)
- [ ] Implement data models (per PROMPT + credibility features)
- [ ] **Set up i18n infrastructure** (custom lightweight or i18next)
- [ ] **Create translation files** (en, pt-BR, es)
- [ ] **Language detection & selector** (auto-detect + manual selection)
- [ ] Build 4-field onboarding flow (Name, Profession, WhatsApp, Photo)
- [ ] **Translate onboarding flow** (all 3 languages)
- [ ] Brazilian design system (colors, typography)
- [ ] Build UI components (mobile-first, Brazilian style)
- [ ] Add local storage (IndexedDB)
- [ ] WhatsApp deep linking ("Fale comigo" button - translated)
- [ ] PWA manifest + service worker
- [ ] Lighthouse optimization

### Week 3: AI Profile Completion + Publishing
- [ ] AI profile completion API (scrape digital footprint)
- [ ] Cloudflare Workers API
- [ ] D1 database schema (with credibility fields)
- [ ] Publish/unpublish endpoints
- [ ] Image upload to R2
- [ ] Public card view page (Brazilian design)
- [ ] WhatsApp integration (share, deep links)

### Week 4: Discovery Directory (MANDATORY)
- [ ] Public discovery directory page
- [ ] Search functionality (name, service, location)
- [ ] Category filters (cabelo, unhas, maquiagem, etc.)
- [ ] Location-based search
- [ ] Featured listings (Pro tier)
- [ ] Directory API endpoints

### Week 5: Credibility Features + Viral Recommendations
- [ ] Ratings system (1-5 stars)
- [ ] Testimonials system (with moderation)
- [ ] Client photo galleries
- [ ] Badge system
- [ ] Certifications display
- [ ] Social proof counters
- [ ] **"Amei este profissional!" button** (prominent on every card)
- [ ] Recommendation tracking system
- [ ] Share functionality (WhatsApp, Instagram, Facebook)
- [ ] Referral code generation and tracking
- [ ] Recommendation count display ("X pessoas recomendaram")
- [ ] Viral loop: "Você também vai amar!" messaging

### Week 6: Payments & Polish
- [ ] PIX payment integration (Brazilian payment)
- [ ] Subscription management (R$29-49/ano)
- [ ] Error handling
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Deploy to Cloudflare
- [ ] Testing (mobile devices, Brazilian users)

---

## Alternative: Pure Static (No Backend)

If you want to start even simpler:

**Option**: GitHub Pages + GitHub Actions + GitHub API
- **Cost**: $0
- **Publishing**: User commits to their own GitHub repo
- **Hosting**: GitHub Pages
- **Limitation**: Requires GitHub account (may be barrier)

**Verdict**: Not recommended for MEI users (too technical).

---

## Final Recommendation

**Go with Option A (Cloudflare Pages + D1 + Workers)** because:

1. ✅ **Lowest cost**: ~$0.60/month for 1000 users
2. ✅ **Zero maintenance**: Fully managed
3. ✅ **Respects PROMPT**: Local-first, optional publishing
4. ✅ **Secure**: Built-in security features
5. ✅ **Scalable**: Handles growth automatically
6. ✅ **Brazil-optimized**: Edge locations in São Paulo
7. ✅ **Fast**: Global CDN, instant loads
8. ✅ **AI-ready**: Workers can integrate with AI APIs
9. ✅ **WhatsApp-friendly**: Easy deep linking, no backend complexity
10. ✅ **Directory-ready**: D1 SQLite perfect for search/discovery

**Next Steps:**
1. ✅ Review this document (includes all critical success factors)
2. ✅ Confirm architecture choice (Cloudflare Pages + D1 + Workers)
3. ✅ Begin Phase 1 implementation (core PWA + ultra-simple onboarding)
4. ✅ Add AI profile completion (Week 3)
5. ✅ Build discovery directory (Week 4 - MANDATORY)
6. ✅ Add credibility features (Week 5)
7. ✅ Integrate PIX payments (Week 6)
8. ✅ Launch with Brazilian marketing (pride, simplicity, results)

---

## 🎯 Success Metrics to Track

1. **Onboarding completion rate**: Target > 80% (4 fields = easy)
2. **Time to first publish**: Target < 2 minutes
3. **AI profile completion accuracy**: Target > 70% useful data
4. **WhatsApp click-through rate**: Target > 30% of card views
5. **Directory discovery**: % of users found via directory
6. **Retention**: % of users who stay after 1 year
7. **Revenue per user**: Target R$29-49/ano average
8. **Viral coefficient**: Recommendations per card (target > 2.0)
9. **Recommendation click-through**: % of shared links that convert (target > 15%)
10. **"Amei" button usage**: % of card views that result in recommendation (target > 5%)

**Key insights**: 
- If directory sends them even 1 client, retention will be high.
- If happy customers easily recommend professionals, viral growth is inevitable.
- The "amei" wordplay creates instant brand recognition and emotional connection.

---

## Additional Technical Considerations

### AI Profile Completion
**How it works:**
1. User provides: Name, Profession, WhatsApp, Photo
2. AI searches:
   - Instagram (if linked)
   - Facebook Business
   - Google Business Profile
   - Other Brazilian business directories
3. AI extracts:
   - Services offered
   - Prices (if available)
   - Bio/description
   - Social media links
   - Location
   - Years of experience (if mentioned)
4. User reviews and approves before publishing

**Implementation options:**
- **Option 1**: Cloudflare Workers + AI API (OpenAI, Anthropic, or local model)
- **Option 2**: Cloudflare Workers + SerpAPI (Google search scraping)
- **Option 3**: Cloudflare Workers + Custom scraping (Instagram/Facebook APIs)

**Cost**: ~$0.01-0.05 per profile completion (one-time)

### WhatsApp Integration
**Features needed:**
- Deep link: `https://wa.me/5511999999999?text=Olá!`
- WhatsApp Business API (optional, for automated responses)
- Share card via WhatsApp
- QR code that opens WhatsApp chat
- WhatsApp status integration (share card to status)

**Implementation:**
- Simple deep linking (no API needed)
- WhatsApp Business API: Requires Meta Business verification (optional)

### Brazilian Payment (PIX)
**Integration:**
- Use payment gateway: Mercado Pago, Stripe (Brazil), or Asaas
- PIX is instant, no credit card needed
- Annual subscription: R$29-49/ano

**Cost**: ~3-5% transaction fee (standard in Brazil)

### Discovery Directory Performance
**Optimization needed:**
- Full-text search in D1 (SQLite FTS5)
- Location-based search (city, neighborhood)
- Category filtering
- Pagination (20-50 cards per page)
- Caching via Cloudflare Cache API

**Expected performance**: < 200ms search response time

### Internationalization (i18n) - Multi-Language Support

**Required Languages:**
- **English (en)**: For development and international users
- **Brazilian Portuguese (pt-BR)**: Default for Brazilian market
- **Spanish (es)**: For LATAM expansion

**Implementation Approach:**

#### 1. Language Detection & Selection
- **Auto-detect** on first visit:
  - Browser language preference (`navigator.language`)
  - Geolocation (Brazil → pt-BR, Spanish-speaking countries → es)
  - Default fallback: pt-BR (Brazilian-first)
- **Language selector**:
  - Prominent language switcher in header/settings
  - Flag icons or language names
  - Instant language change (no page reload)
- **Persist preference**:
  - Store in `localStorage` (`app_language`)
  - Remember across sessions
  - Sync across devices (if user logs in later)

#### 2. Translation Structure
```typescript
// Translation files structure
/locales
  /en
    - common.json      // Common UI strings
    - onboarding.json  // Onboarding flow
    - profile.json     // Profile editing
    - directory.json   // Discovery directory
    - viral.json       // Recommendation messages
    - errors.json      // Error messages
  /pt-BR
    - common.json
    - onboarding.json
    - ...
  /es
    - common.json
    - onboarding.json
    - ...
```

#### 3. Translation Keys Example
```json
// locales/pt-BR/common.json
{
  "app_name": "amei.beauty",
  "tagline": "Seu cartão profissional em 1 minuto",
  "buttons": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "publish": "Publicar",
    "share": "Compartilhar"
  },
  "viral": {
    "recommend_button": "Amei este profissional!",
    "you_will_love": "Você também vai amar!",
    "share_love": "Compartilhe o amor!"
  }
}

// locales/en/common.json
{
  "app_name": "amei.beauty",
  "tagline": "Your professional card in 1 minute",
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "publish": "Publish",
    "share": "Share"
  },
  "viral": {
    "recommend_button": "I loved this professional!",
    "you_will_love": "You'll love it too!",
    "share_love": "Share the love!"
  }
}

// locales/es/common.json
{
  "app_name": "amei.beauty",
  "tagline": "Tu tarjeta profesional en 1 minuto",
  "buttons": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "publish": "Publicar",
    "share": "Compartir"
  },
  "viral": {
    "recommend_button": "¡Me encantó este profesional!",
    "you_will_love": "¡También te encantará!",
    "share_love": "¡Comparte el amor!"
  }
}
```

#### 4. Implementation Options

**Option A: Custom Lightweight i18n (Recommended)**
```typescript
// Simple, lightweight, no dependencies
class I18n {
  private locale: string = 'pt-BR';
  private translations: Record<string, any> = {};
  
  async load(locale: string) {
    this.locale = locale;
    this.translations = await import(`/locales/${locale}/common.json`);
  }
  
  t(key: string, params?: Record<string, string>): string {
    const value = this.getNestedValue(this.translations, key);
    return this.interpolate(value, params);
  }
  
  private getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((o, p) => o?.[p], obj) || key;
  }
  
  private interpolate(str: string, params?: Record<string, string>): string {
    if (!params) return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] || '');
  }
}
```

**Option B: i18next (Lightweight)**
- Use `i18next` with `i18next-browser-languagedetector`
- Bundle size: ~15KB gzipped
- More features (pluralization, formatting)
- Overkill for 3 languages, but more maintainable

**Recommendation**: Start with custom lightweight solution (Option A) for minimal bundle size. Migrate to i18next if complexity grows.

#### 5. User-Generated Content Translation
**Challenge**: User-generated content (profiles, services, testimonials) is in user's language.

**Solution**:
- **Don't translate user content** (preserves authenticity)
- **Translate UI only** (buttons, labels, messages)
- **Language tags**: Allow users to tag their content language
- **Search filters**: Filter directory by content language (optional)

#### 6. "amei" Wordplay in Different Languages
- **pt-BR**: "Amei este profissional!" (I loved this professional!)
- **en**: "I loved this professional!" (Direct translation)
- **es**: "¡Me encantó este profesional!" (I loved this professional!)
- **Note**: The wordplay works best in Portuguese, but the concept translates

#### 7. Currency & Formatting
- **Currency**: Display in user's locale (R$ for Brazil, $ for others)
- **Date formatting**: Use locale-specific formats
- **Phone numbers**: Format according to country
- **Numbers**: Use locale-specific separators

#### 8. Testing i18n
- Test all 3 languages in development
- Verify all UI strings are translated
- Test language switching
- Test with different browser languages
- Test geolocation-based detection
- Verify no hardcoded strings remain

**Implementation Priority**: 
- Week 1-2: Set up i18n infrastructure + pt-BR translations
- Week 3: Add English translations
- Week 4: Add Spanish translations
- Ongoing: Maintain translations as features are added

---

## Questions to Consider

1. **AI Profile Completion**: Which AI service? Cost vs. accuracy tradeoff?
2. **WhatsApp Business API**: Worth the Meta Business verification hassle?
3. **Payment Gateway**: Mercado Pago vs. Stripe Brazil vs. Asaas?
4. **Custom domains**: Allow Pro users to use their own domain? (e.g., `joana.amei.beauty` → `joana.com.br`)
5. **Analytics**: Provide basic stats to users? (page views, WhatsApp clicks) - conflicts with PROMPT but valuable for users
6. **Moderation**: How to moderate testimonials/reviews? Manual or AI?
7. **SEO**: How to optimize published cards for Google search in Brazil?

---

*This document serves as the implementation guide for amei.beauty SaaS platform.*

