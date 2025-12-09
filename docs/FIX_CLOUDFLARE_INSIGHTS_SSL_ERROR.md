# Fix Cloudflare Insights SSL Error

## Problem

You're seeing this error in the browser console:
```
GET https://static.cloudflareinsights.com/beacon.min.js/... net::ERR_SSL_PROTOCOL_ERROR
```

This happens because Cloudflare Pages may automatically inject Web Analytics scripts even when Web Analytics is disabled, and there's an SSL/TLS issue loading them.

## Solution

Since Web Analytics is already disabled in your Cloudflare Pages project (under Metrics), we've configured the Content Security Policy (CSP) to **block** the Cloudflare Insights script from loading. This prevents the SSL error.

### What We Changed

1. **Removed `https://static.cloudflareinsights.com` from CSP**: 
   - Removed from `script-src` directive
   - Removed from `connect-src` directive
   
2. **Updated files**:
   - `public/_headers` - HTTP headers (takes precedence)
   - `index.html` - Meta tag CSP (fallback)

### How It Works

When Cloudflare tries to inject the Web Analytics script, the CSP will block it because `https://static.cloudflareinsights.com` is not in the allowed sources. This prevents the SSL error from occurring.

**Note**: You may see a CSP violation warning in the console instead of an SSL error, but this is harmless and indicates the script is being blocked as intended.

## Verification

After deploying:

1. Open your site in a browser
2. Open DevTools → Network tab
3. Refresh the page
4. You should NOT see any successful requests to `static.cloudflareinsights.com`
5. Check the Console tab:
   - The SSL error should be gone
   - You may see a CSP violation warning (this is expected and harmless)

## If You Want to Re-enable Web Analytics Later

If you decide to enable Web Analytics in the future:

1. Enable it in Cloudflare Dashboard → Workers & Pages → Your Project → Metrics → Web Analytics
2. Add `https://static.cloudflareinsights.com` back to the CSP:
   - Add to `script-src`: `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com`
   - Add to `connect-src`: `connect-src 'self' https://*.cloudflare.com https://*.workers.dev https://static.cloudflareinsights.com`
3. Redeploy your site

