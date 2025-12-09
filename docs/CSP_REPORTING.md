# CSP Violation Reporting

## Overview

Content Security Policy (CSP) violation reports are automatically sent to `/api/csp-report` when browsers detect CSP violations. This allows you to monitor and debug CSP issues without cluttering the browser console.

## How It Works

1. **Browser detects CSP violation**: When a resource is blocked by CSP, the browser sends a violation report
2. **Report sent to endpoint**: The report is POSTed to `https://amei-beauty-api.adsventures.workers.dev/api/csp-report`
3. **Endpoint logs violation**: The handler logs the violation (in development mode or if `LOG_CSP_VIOLATIONS` is enabled)
4. **Silent acknowledgment**: Returns 204 No Content to acknowledge receipt

## Configuration

### CSP Header

The CSP header includes a `report-uri` directive:

```
Content-Security-Policy: ... report-uri https://amei-beauty-api.adsventures.workers.dev/api/csp-report;
```

### Environment Variables

- **`LOG_CSP_VIOLATIONS`**: Set to `'true'` to log violations in production (default: only logs in development)
- **`ENVIRONMENT`**: Set to `'development'` to enable detailed logging

## Viewing Violation Reports

### Development Mode

Violations are automatically logged to the console when `ENVIRONMENT=development`:

```bash
# View logs in real-time
npx wrangler tail --name amei-beauty-api
```

### Production Mode

To enable logging in production:

1. Set the environment variable:
   ```bash
   npx wrangler secret put LOG_CSP_VIOLATIONS --name amei-beauty-api
   # Value: true
   ```

2. View logs:
   ```bash
   npx wrangler tail --name amei-beauty-api
   ```

Or view in Cloudflare Dashboard:
- Workers & Pages → amei-beauty-api → Logs

## Report Format

Violation reports include:

- `document-uri`: The page where the violation occurred
- `violated-directive`: The CSP directive that was violated
- `blocked-uri`: The resource that was blocked
- `source-file`: The file that tried to load the blocked resource
- `line-number`: Line number where the violation occurred
- `column-number`: Column number where the violation occurred

## Example Violation Report

```json
{
  "csp-report": {
    "document-uri": "https://amei.beauty/",
    "referrer": "",
    "violated-directive": "script-src-elem",
    "effective-directive": "script-src-elem",
    "original-policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...",
    "disposition": "enforce",
    "blocked-uri": "https://static.cloudflareinsights.com/beacon.min.js/...",
    "line-number": 29,
    "column-number": 1,
    "source-file": "https://amei.beauty/",
    "status-code": 200
  }
}
```

## Common Violations

### Cloudflare Insights Script

**Expected violation** - This is normal when Web Analytics is disabled:

```
blocked-uri: https://static.cloudflareinsights.com/beacon.min.js/...
violated-directive: script-src-elem
```

This violation is expected and harmless. The CSP is correctly blocking the script.

### Third-Party Scripts

If you see violations for legitimate third-party scripts:

1. Add the domain to the CSP `script-src` directive
2. Update `public/_headers` and `index.html`
3. Redeploy

## Advanced: Storing Violations

To store violations in a database for analysis:

1. Modify `workers/handlers/csp-report.ts`
2. Add D1 database storage:
   ```typescript
   await env.DB.prepare(
     'INSERT INTO csp_violations (document_uri, violated_directive, blocked_uri, created_at) VALUES (?, ?, ?, ?)'
   ).bind(
     violation['document-uri'],
     violation['violated-directive'],
     violation['blocked-uri'],
     new Date().toISOString()
   ).run();
   ```

3. Create a migration for the `csp_violations` table

## Rate Limiting

CSP report endpoint is **excluded from rate limiting** to ensure violations are always reported.

## Testing

Test the endpoint:

```bash
curl -X POST https://amei-beauty-api.adsventures.workers.dev/api/csp-report \
  -H "Content-Type: application/csp-report" \
  -d '{
    "csp-report": {
      "document-uri": "https://amei.beauty/",
      "violated-directive": "script-src-elem",
      "blocked-uri": "https://example.com/script.js",
      "status-code": 200
    }
  }'
```

Expected response: `204 No Content`

## Troubleshooting

### Reports Not Being Sent

1. **Check CSP header**: Verify `report-uri` is in the CSP header
2. **Check endpoint**: Verify `/api/csp-report` route exists
3. **Check CORS**: Ensure CORS headers allow the report
4. **Check browser**: Some browsers may not send reports for certain violations

### Too Many Reports

If you're getting too many violation reports:

1. Review common violations
2. Update CSP to allow legitimate resources
3. Consider filtering reports in the handler (e.g., ignore known violations)

## References

- [MDN: CSP report-uri](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri)
- [W3C CSP Reporting](https://www.w3.org/TR/CSP2/#violation-reports)

