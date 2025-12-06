# amei.beauty

Professional digital business cards for MEI beauty professionals in Brazil.

## 🎯 Mission

Empower every MEI in Brazil to present themselves professionally, gain more clients, and grow their income — instantly, simply, and affordably.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm (or pnpm/yarn)

### Installation

```bash
npm install
```

### Development

```bash
# Frontend only
npm run dev

# Workers only (requires Cloudflare setup)
npm run dev:workers

# Both (requires concurrently)
npm run dev:full
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## 📁 Project Structure

```
src/
  /components      # UI components (Button, Input, Navigation, CardPreview, AICompletion, etc.)
  /lib             # Core libraries (storage, i18n, api, whatsapp)
  /models          # Data models (TypeScript types)
  /pages           # Page components (Onboarding, Profile, Directory, PublicCard)
  /styles          # CSS and design system
  /locales         # Translation files (en, pt-BR, es)
  /test            # Test files
workers/           # Cloudflare Workers API
  /handlers        # API endpoint handlers
migrations/        # D1 database migrations
```

## 🌍 Languages

- English (en)
- Brazilian Portuguese (pt-BR) - Default
- Spanish (es)

## 📚 Documentation

### Development
- [Implementation Recommendations](./IMPLEMENTATION_RECOMMENDATIONS.md)
- [Success Factors](./SUCCESS_FACTORS.md)
- [Viral Strategy](./VIRAL_STRATEGY.md)
- [i18n Implementation](./I18N_IMPLEMENTATION.md)

### Phases
- [Phase 1 Completion](./PHASE1_COMPLETION.md)
- [Phase 2 Setup](./PHASE2_SETUP.md)
- [Phase 2 Completion](./PHASE2_COMPLETION.md)
- [Phase 3 Completion](./PHASE3_COMPLETION.md)
- [Phase 4 Completion](./PHASE4_COMPLETION.md)

### Testing & Deployment
- [Testing & Deployment Guide](./TESTING_AND_DEPLOYMENT.md) ⭐ **Start here for testing/deployment**
- [Pre-Deployment Checklist](./PRE_DEPLOYMENT_CHECKLIST.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Quick Start](./QUICK_START.md)
- [Cloudflare Setup](./CLOUDFLARE_SETUP.md)

## 🏗️ Architecture

- **Frontend**: Preact + TypeScript + Vite
- **Routing**: Preact Router (client-side routing)
- **Backend**: Cloudflare Workers + D1 + R2
- **PWA**: Offline-first, installable
- **Storage**: IndexedDB + localStorage (local-first) + D1 (published cards)
- **i18n**: Custom lightweight solution (en, pt-BR, es)
- **Testing**: Vitest

## 🎯 Features

### Phase 1 ✅
- Ultra-simple onboarding (4 fields)
- Local-first editing
- Multi-language support
- WhatsApp integration
- PWA capabilities

### Phase 2 ✅
- Cloudflare Workers API
- D1 database for published cards
- R2 image storage
- Publish/unpublish functionality
- Public card viewing

### Phase 3 ✅
- Discovery directory
- Search functionality
- Category and location filters
- Featured listings
- Card previews
- Pagination

### Phase 4 ✅
- AI profile completion
- Intelligent service suggestions
- Headline and bio generation
- Review and approve UI
- Optional AI step in onboarding

## 🚀 Cloudflare Setup

See [PHASE2_SETUP.md](./PHASE2_SETUP.md) for detailed Cloudflare Workers + D1 setup instructions.

Quick steps:
1. `npx wrangler login`
2. `npx wrangler d1 create amei-beauty-db`
3. Update `wrangler.toml` with database_id
4. `npm run d1:migrate`
5. `npm run dev:workers`

## 📝 License

MIT
