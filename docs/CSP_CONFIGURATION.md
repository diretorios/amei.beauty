# Content Security Policy (CSP) Configuration

## Overview

Content Security Policy helps prevent XSS attacks and other code injection vulnerabilities. This document explains how to configure CSP for amei.beauty.

## Current Implementation

A basic CSP meta tag has been added to `index.html`. However, **HTTP headers are preferred** over meta tags for better security and flexibility.

## Recommended Configuration

### For Cloudflare Pages

Configure CSP headers in Cloudflare Pages settings or via `_headers` file:

**Option 1: Cloudflare Pages Dashboard**
1. Go to Pages → Your Project → Settings → Custom Headers
2. Add header:
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.cloudflare.com https://*.workers.dev; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
   ```

**Option 2: `public/_headers` file** (if using static file deployment)
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.cloudflare.com https://*.workers.dev; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### For Development

The CSP meta tag in `index.html` includes `'unsafe-inline'` and `'unsafe-eval'` for Vite's development mode. These should be removed or made conditional for production.

### Production CSP (Stricter)

For production, use a stricter CSP:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
font-src 'self' data:;
connect-src 'self' https://*.cloudflare.com https://*.workers.dev;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

**Note**: `'unsafe-inline'` for styles is often necessary for component libraries. Consider using nonces or hashes for stricter control.

## Additional Security Headers

Also configure these headers:

- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **Permissions-Policy**: Restrict browser features (camera, microphone, etc.)

## Testing CSP

1. Open browser DevTools → Console
2. Look for CSP violation errors
3. Adjust policy as needed
4. Use [CSP Evaluator](https://csp-evaluator.withgoogle.com/) to test your policy

## Notes

- The meta tag CSP in `index.html` is a fallback
- HTTP headers take precedence over meta tags
- CSP can break functionality if too strict - test thoroughly
- Consider using CSP reporting endpoint for production monitoring

