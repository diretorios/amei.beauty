# Pre-Deployment Checklist

Use this checklist before deploying to production.

---

## ✅ Code Quality

- [ ] All code committed to git
- [ ] No console.log statements in production code
- [ ] No commented-out code
- [ ] Code formatted with Prettier (`npm run format`)
- [ ] Linter passes (`npm run lint`)
- [ ] No TypeScript errors
- [ ] No build warnings

---

## ✅ Testing

- [ ] All unit tests pass (`npm test -- --run`)
- [ ] Test coverage ≥ 70% (`npm run test:coverage`)
- [ ] Frontend tests pass
- [ ] Backend API tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Browser compatibility tested (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness tested
- [ ] PWA features tested

---

## ✅ Functionality

- [ ] Onboarding flow works (all 5 steps)
- [ ] AI completion works
- [ ] Profile page displays correctly
- [ ] Publish functionality works
- [ ] Card viewing works (`/card/:id` and `/:username`)
- [ ] Directory page works
- [ ] Search functionality works
- [ ] Filters work (category, location, featured)
- [ ] Pagination works
- [ ] WhatsApp integration works
- [ ] Language switching works (pt-BR, en, es)
- [ ] Data persists correctly
- [ ] Error handling works

---

## ✅ Backend

- [ ] Workers code ready
- [ ] Database migrations created and tested
- [ ] All API endpoints tested
- [ ] CORS configured correctly
- [ ] Error handling implemented
- [ ] Input validation implemented
- [ ] Rate limiting considered (if needed)
- [ ] Health check endpoint works

---

## ✅ Configuration

- [ ] `wrangler.toml` configured correctly
- [ ] Database ID set in `wrangler.toml`
- [ ] R2 bucket created
- [ ] Environment variables documented
- [ ] `.dev.vars.example` updated
- [ ] `.gitignore` includes sensitive files
- [ ] No secrets committed to git

---

## ✅ Build & Deployment

- [ ] Build succeeds (`npm run build`)
- [ ] Build output verified (`dist/` folder)
- [ ] No build errors or warnings
- [ ] Bundle size reasonable (< 500KB)
- [ ] Production build tested locally (`npm run preview`)
- [ ] Environment variables set for production
- [ ] `VITE_API_URL` configured correctly

---

## ✅ Cloudflare Setup

- [ ] Cloudflare account created
- [ ] Logged in to Wrangler (`npx wrangler login`)
- [ ] D1 database created
- [ ] Database ID added to `wrangler.toml`
- [ ] Migrations applied (`npm run d1:migrate`)
- [ ] R2 bucket created
- [ ] Workers can be deployed (`npm run deploy:workers --dry-run`)
- [ ] GitHub Actions secrets configured (if using CI/CD)

---

## ✅ Security

- [ ] No API keys exposed in frontend
- [ ] Input validation on all endpoints
- [ ] XSS protection (no innerHTML with user data)
- [ ] CORS configured correctly
- [ ] HTTPS enforced (automatic with Cloudflare)
- [ ] Environment variables secured
- [ ] No sensitive data in logs

---

## ✅ Performance

- [ ] Lighthouse score ≥ 95 (Performance)
- [ ] Lighthouse score ≥ 95 (Accessibility)
- [ ] Lighthouse score ≥ 95 (Best Practices)
- [ ] Lighthouse score ≥ 95 (SEO)
- [ ] Images optimized (WebP, compressed)
- [ ] Bundle size optimized
- [ ] Lazy loading implemented (if applicable)
- [ ] Caching configured

---

## ✅ Documentation

- [ ] README.md updated
- [ ] Deployment guide reviewed
- [ ] Testing guide reviewed
- [ ] API documentation updated (if applicable)
- [ ] Environment variables documented
- [ ] Troubleshooting guide reviewed

---

## ✅ Monitoring & Alerts

- [ ] Cloudflare Analytics accessible
- [ ] Error tracking considered
- [ ] Alerts configured (optional)
- [ ] Monitoring dashboard set up (optional)

---

## ✅ Rollback Plan

- [ ] Rollback procedure documented
- [ ] Previous deployment tagged
- [ ] Database backup considered

---

## 🚀 Ready to Deploy?

If all items are checked:

1. **Run final test suite**
   ```bash
   ./scripts/test-all.sh
   ```

2. **Deploy**
   ```bash
   ./scripts/deploy.sh
   ```

3. **Verify deployment**
   ```bash
   ./scripts/verify-deployment.sh
   ```

---

## 📝 Notes

Use this space to document any issues, concerns, or special considerations:

---

**Date**: _______________  
**Deployed by**: _______________  
**Version**: _______________

