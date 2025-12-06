# Deepseek API Setup Guide

## ✅ Implementation Complete!

The Deepseek API integration has been implemented in `workers/handlers/ai-complete.ts`. The handler will automatically use Deepseek when an API key is available, and fall back to the mock implementation if the key is missing or the API fails.

---

## Quick Setup Steps

### 1. Add API Key for Local Development

Create or edit `.dev.vars` in the project root:

```bash
# .dev.vars (this file is gitignored)
DEEPSEEK_API_KEY=your-deepseek-api-key-here
```

**Note:** If `.dev.vars` doesn't exist, copy from `.dev.vars.example`:
```bash
cp .dev.vars.example .dev.vars
# Then edit .dev.vars and add your API key
```

### 2. Set API Key for Production (Cloudflare Pages)

For Cloudflare Pages, set the secret using wrangler:

```bash
npx wrangler pages secret put DEEPSEEK_API_KEY
```

When prompted, paste your Deepseek API key.

**Alternative:** You can also set it via Cloudflare Dashboard:
1. Go to Cloudflare Dashboard → Pages → Your Project
2. Go to Settings → Environment Variables
3. Add `DEEPSEEK_API_KEY` as a secret

### 3. Test Locally

Start your local development server:

```bash
npm run dev
# or
npm run dev:workers
```

Test the endpoint:

```bash
curl -X POST http://localhost:8787/api/ai/complete \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Silva",
    "profession": "Cabeleireira",
    "whatsapp": "+5511999999999"
  }'
```

Expected response:
```json
{
  "profile": {
    "headline": "...",
    "bio": "..."
  },
  "services": [
    {
      "id": "1",
      "name": "...",
      "price": "R$ ...",
      "description": "..."
    }
  ],
  "social": [],
  "location": {...},
  "bio": "...",
  "headline": "..."
}
```

### 4. Deploy to Production

After setting the secret, deploy:

```bash
npm run deploy
# or
npx wrangler pages deploy
```

---

## How It Works

### Automatic Fallback

The implementation includes intelligent fallback:

1. **If `DEEPSEEK_API_KEY` is set:**
   - ✅ Calls Deepseek API
   - ✅ Falls back to mock if API fails
   - ✅ Logs errors for debugging

2. **If `DEEPSEEK_API_KEY` is NOT set:**
   - ✅ Uses mock implementation (current behavior)
   - ✅ No errors, works as before

### Error Handling

- ✅ API failures → Automatic fallback to mock
- ✅ Invalid responses → Automatic fallback to mock
- ✅ Network errors → Automatic fallback to mock
- ✅ All errors logged to console for debugging

---

## Cost Monitoring

**Deepseek Pricing:**
- Input: $0.27 per 1M tokens
- Output: $1.10 per 1M tokens

**Estimated Cost per Request:** ~$0.0011
- Input: ~2,000 tokens = $0.00054
- Output: ~500 tokens = $0.00055

**Monthly Costs:**
- 100 users: ~$0.11/month
- 1,000 users: ~$1.10/month
- 5,000 users: ~$5.50/month
- 10,000 users: ~$11.00/month

---

## Testing Checklist

- [ ] API key added to `.dev.vars` (local)
- [ ] API key set as Cloudflare Pages secret (production)
- [ ] Local test successful
- [ ] Production deployment successful
- [ ] Verify Portuguese output quality
- [ ] Verify services are relevant to profession
- [ ] Verify prices are realistic
- [ ] Test fallback behavior (temporarily use wrong API key)

---

## Troubleshooting

### API Key Not Working

1. **Check API key format:**
   - Should start with `sk-` or similar
   - No extra spaces or quotes

2. **Check environment:**
   - Local: Check `.dev.vars` file exists and has correct key
   - Production: Verify secret is set via `wrangler pages secret list`

3. **Check logs:**
   - Look for error messages in Cloudflare Workers logs
   - Check browser console for frontend errors

### API Returns Errors

1. **Check API key validity:**
   - Verify key is active in Deepseek dashboard
   - Check if you have credits/quota remaining

2. **Check response format:**
   - The handler tries to parse JSON
   - Falls back to mock if parsing fails
   - Check logs for parsing errors

### Fallback to Mock

If you see mock responses instead of AI-generated ones:

1. **Check if API key is set:**
   ```bash
   # For local development
   cat .dev.vars | grep DEEPSEEK_API_KEY
   
   # For production
   npx wrangler pages secret list
   ```

2. **Check API errors in logs:**
   - Look for "Deepseek API failed" messages
   - Check error details in Cloudflare Workers logs

---

## Next Steps

1. ✅ **Deepseek Integration** - Complete!
2. ⏭️ **Test with real users** - Monitor quality and costs
3. ⏭️ **Add SerpAPI** - For hybrid approach with web search
4. ⏭️ **Add caching** - Cache common profession suggestions
5. ⏭️ **Monitor costs** - Set up usage alerts

---

## Support

- **Deepseek API Docs:** https://api-docs.deepseek.com
- **Cloudflare Pages Secrets:** https://developers.cloudflare.com/pages/platform/functions/secrets/

---

**Ready to use!** 🚀

The integration is complete and will automatically use Deepseek when the API key is configured.

