# Rate Limiting Implementation

## Overview

Rate limiting has been implemented to protect the API from abuse and DoS attacks. The system uses Cloudflare KV storage to track request counts per IP address with configurable limits based on endpoint type.

## Implementation Details

### Architecture

- **Storage**: Cloudflare KV namespace (`RATE_LIMIT_KV`) - can be shared across multiple Workers
- **Algorithm**: Sliding window (default) or fixed window
- **Identification**: IP address from `CF-Connecting-IP` header
- **Key Format**: `{app_prefix}:rate_limit:{endpoint}:{ip}:{windowStart}` (app prefix prevents conflicts when sharing)
- **Fallback**: If KV is not configured, requests are allowed (fail-open for development)

### Rate Limit Configurations

Different endpoint types have different rate limits:

| Endpoint Type | Max Requests | Window | Use Case |
|--------------|--------------|--------|----------|
| **read** | 100/min | 60s | GET requests (card viewing) |
| **write** | 20/min | 60s | POST/PUT/DELETE (general) |
| **auth** | 10/min | 60s | Publish/update/delete card |
| **upload** | 10/min | 60s | Image uploads |
| **search** | 50/min | 60s | Search and directory |
| **payment** | 5/min | 60s | Payment endpoints |

### Endpoint Classification

The system automatically classifies endpoints:

- **Payment**: `/api/payment/*` → `payment` (strictest)
- **Upload**: `/api/upload` → `upload` (strict)
- **Auth-sensitive**: `/api/publish`, `/api/card/*` (POST/PUT/DELETE) → `auth` (strict)
- **Search**: `/api/search`, `/api/directory` → `search` (moderate)
- **Read**: All other GET requests → `read` (lenient)

## Setup

### 1. Create or Use Existing KV Namespace

**Option A: Create New Namespace**

```bash
# Production namespace
npx wrangler kv:namespace create "RATE_LIMIT_KV"

# Preview namespace (for local dev)
npx wrangler kv:namespace create "RATE_LIMIT_KV" --preview
```

**Option B: Share Existing Namespace (Recommended)**

If you already have a KV namespace for rate limiting in another application, you can share it! The implementation uses application-specific prefixes to avoid key conflicts.

1. Find your existing KV namespace ID:
   ```bash
   npx wrangler kv:namespace list
   ```

2. Use the same namespace ID in `wrangler.workers.toml` (see below)

### 2. Update Configuration

Add the namespace IDs to `wrangler.workers.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "YOUR_PRODUCTION_ID"  # Use existing ID if sharing
preview_id = "YOUR_PREVIEW_ID"  # Use existing preview ID if sharing
```

**Important**: If sharing a KV namespace with another application, set a unique app prefix:

```toml
[vars]
RATE_LIMIT_APP_PREFIX = "amei-beauty"  # Unique prefix for this app
```

Or set it as a secret in production:
```bash
npx wrangler secret put RATE_LIMIT_APP_PREFIX --config wrangler.workers.toml
```

**Default**: If `RATE_LIMIT_APP_PREFIX` is not set, it defaults to `"amei-beauty"`.

### 3. Deploy

```bash
npm run deploy:workers
```

## Response Headers

Rate limit information is included in all API responses:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Rate Limit Exceeded Response

When rate limit is exceeded, the API returns:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45,
  "resetAt": "2024-01-01T12:00:00.000Z"
}
```

**HTTP Status**: `429 Too Many Requests`

**Headers**:
- `Retry-After`: Seconds until limit resets
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: 0
- `X-RateLimit-Reset`: Unix timestamp

## Customization

### Adjusting Rate Limits

Edit `workers/middleware/rate-limit.ts`:

```typescript
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  read: {
    maxRequests: 100,      // Adjust as needed
    windowSeconds: 60,     // Adjust window size
    slidingWindow: true,   // Use sliding window
  },
  // ... other types
};
```

### Custom Rate Limit for Specific Endpoint

You can apply custom rate limits in the handler:

```typescript
import { checkRateLimit } from '../middleware/rate-limit';

const customConfig = {
  maxRequests: 5,
  windowSeconds: 300, // 5 requests per 5 minutes
  slidingWindow: true,
};

const result = await checkRateLimit(request, env, 'read', customConfig);
if (!result.allowed) {
  return createRateLimitResponse(result.resetAt, corsHeaders);
}
```

## Monitoring

### Check Rate Limit Usage

View KV namespace in Cloudflare Dashboard:
1. Go to Workers & Pages → KV
2. Select `RATE_LIMIT_KV` namespace
3. View keys (format: `{app_prefix}:rate_limit:{endpoint}:{ip}:{windowStart}`)

**Note**: If sharing the namespace with other applications, keys will be prefixed with different app names, making it easy to identify which app created each key.

### Logs

Rate limit violations are logged server-side:
- Check Cloudflare Workers logs: `npx wrangler tail`
- Look for rate limit warnings in console

## Security Considerations

### IP Address Spoofing

- Cloudflare Workers automatically provides real client IP via `CF-Connecting-IP`
- In local development, falls back to `X-Forwarded-For`
- If neither is available, uses `'unknown'` (all requests from same IP share limit)

### Distributed Attacks

- Rate limiting is per-IP, so distributed attacks from multiple IPs can still overwhelm
- Consider Cloudflare's built-in DDoS protection for additional protection
- Monitor for coordinated attacks and adjust limits accordingly

### Bypass Attempts

- Rate limiting cannot be bypassed by changing headers (uses Cloudflare's IP)
- KV storage is fast enough to not significantly impact response times
- Fail-open behavior in development ensures local testing works without KV

## Testing

### Test Rate Limiting Locally

```bash
# Start workers
npm run dev:workers

# Make multiple rapid requests
for i in {1..25}; do
  curl http://localhost:8787/api/search
done

# Should see 429 after limit exceeded
```

### Test Different Endpoints

```bash
# Test read endpoint (100/min limit)
curl http://localhost:8787/api/card/test-id

# Test write endpoint (20/min limit)
curl -X POST http://localhost:8787/api/publish

# Test payment endpoint (5/min limit)
curl -X POST http://localhost:8787/api/payment/checkout
```

## Troubleshooting

### Rate Limiting Not Working

1. **Check KV namespace is configured**:
   ```bash
   npx wrangler kv:namespace list
   ```

2. **Verify binding in wrangler.workers.toml**:
   ```toml
   [[kv_namespaces]]
   binding = "RATE_LIMIT_KV"
   ```

3. **Check logs for warnings**:
   ```bash
   npx wrangler tail
   ```
   Look for: `Rate limit KV not configured, allowing request`

### Too Many False Positives

- Increase `maxRequests` for the affected endpoint type
- Increase `windowSeconds` to allow more requests over longer period
- Consider using fixed window instead of sliding window (less accurate but simpler)

### Rate Limits Too Lenient

- Decrease `maxRequests` for stricter limits
- Decrease `windowSeconds` for shorter windows
- Consider per-endpoint custom limits

## Cost Considerations

### KV Usage

- **Reads**: 1 read per rate limit check
- **Writes**: 1 write per request (when incrementing counter)
- **Storage**: Minimal (keys expire automatically)

**Estimated costs** (100k requests/day):
- KV Reads: 100k/day = ~3M/month (free tier: 10M reads/month) ✅
- KV Writes: 100k/day = ~3M/month (free tier: 1M writes/month) ⚠️
- **Recommendation**: Monitor usage; upgrade if needed

### Optimization

- Keys automatically expire after window duration
- No manual cleanup needed
- Consider fixed window for fewer KV operations (less accurate)

## Future Enhancements

Potential improvements:

1. **Token-based rate limiting**: Rate limit by auth token instead of IP
2. **Per-user limits**: Different limits for authenticated vs anonymous users
3. **Adaptive rate limiting**: Adjust limits based on user behavior
4. **Rate limit analytics**: Track and visualize rate limit usage
5. **Whitelist/blacklist**: Allow/block specific IPs

## References

- [Cloudflare KV Documentation](https://developers.cloudflare.com/kv/)
- [Rate Limiting Best Practices](https://cloudflare.com/learning/bots/what-is-rate-limiting/)
- [Workers KV Pricing](https://developers.cloudflare.com/kv/pricing/)

