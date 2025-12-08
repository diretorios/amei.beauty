# API Key Authentication Implementation Guide

**Date**: 2024-12-19  
**Status**: Implementation Guide  
**Estimated Time**: 2-3 days

---

## Overview

This guide provides step-by-step instructions for implementing API key-based authentication to secure card modification and deletion endpoints. The implementation uses Cloudflare Workers' Web Crypto API for token generation and HMAC-SHA256 for token verification.

---

## Implementation Steps

### Step 1: Database Migration

Create a new migration file to add the `owner_token_hash` field.

**File**: `migrations/0003_add_owner_token_auth.sql`

```sql
-- Migration: Add owner token for authentication
-- Run with: wrangler d1 migrations apply amei-beauty-db --config wrangler.workers.toml

-- Add owner_token_hash field to cards table
ALTER TABLE cards ADD COLUMN owner_token_hash TEXT;

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_owner_token_hash ON cards(owner_token_hash);

-- Note: Existing cards will have NULL owner_token_hash
-- They will be treated as "legacy" cards (see migration strategy below)
```

**Run the migration**:
```bash
npm run d1:migrate
```

---

### Step 2: Update Type Definitions

**File**: `workers/types.ts`

Add `owner_token_hash` to the `CardRow` interface:

```typescript
export interface CardRow {
  id: string;
  username: string | null;
  // ... existing fields ...
  owner_token_hash: string | null; // Add this field
}
```

---

### Step 3: Create Authentication Utilities

**File**: `workers/utils/auth.ts` (new file)

```typescript
/**
 * Authentication utilities for API key-based auth
 * Uses Web Crypto API (available in Cloudflare Workers)
 */

/**
 * Generate a secure random token (32 bytes = 256 bits)
 * Returns base64url-encoded string (URL-safe, no padding)
 */
export async function generateOwnerToken(): Promise<string> {
  // Generate 32 random bytes
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  
  // Convert to base64url (URL-safe, no padding)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Hash a token using HMAC-SHA256
 * Uses a secret key from environment variables
 * 
 * @param token - The plain token to hash
 * @param secret - Secret key from environment (should be set in wrangler.toml)
 * @returns Base64-encoded HMAC hash
 */
export async function hashToken(token: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const tokenData = encoder.encode(token);
  
  // Import secret as HMAC key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign (hash) the token
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, tokenData);
  
  // Convert to base64
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Verify a token against a stored hash
 * 
 * @param token - The plain token to verify
 * @param hash - The stored hash to compare against
 * @param secret - Secret key from environment
 * @returns true if token matches hash
 */
export async function verifyToken(
  token: string,
  hash: string,
  secret: string
): Promise<boolean> {
  try {
    const computedHash = await hashToken(token, secret);
    // Constant-time comparison to prevent timing attacks
    return constantTimeEqual(computedHash, hash);
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Extract token from Authorization header
 * Format: "Bearer <token>"
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7).trim();
}
```

---

### Step 4: Create Authentication Middleware

**File**: `workers/middleware/auth.ts` (new file)

```typescript
/**
 * Authentication middleware for verifying card ownership
 */

import type { Env } from '../types';
import { extractTokenFromHeader, verifyToken } from '../utils/auth';

/**
 * Verify that the requester owns the card
 * 
 * @param cardId - The card ID to verify ownership for
 * @param request - The incoming request
 * @param env - Worker environment variables
 * @returns true if token is valid and matches card's owner token
 */
export async function verifyCardOwnership(
  cardId: string,
  request: Request,
  env: Env
): Promise<{ valid: boolean; isLegacy: boolean }> {
  // Get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return { valid: false, isLegacy: false };
  }
  
  // Get card's owner token hash from database
  const card = await env.DB.prepare(
    'SELECT owner_token_hash FROM cards WHERE id = ?'
  )
    .bind(cardId)
    .first<{ owner_token_hash: string | null }>();
  
  if (!card) {
    return { valid: false, isLegacy: false };
  }
  
  // Legacy cards (published before auth) have NULL owner_token_hash
  if (!card.owner_token_hash) {
    return { valid: false, isLegacy: true };
  }
  
  // Verify token matches hash
  const secret = env.AUTH_SECRET || 'default-secret-change-in-production';
  const isValid = await verifyToken(token, card.owner_token_hash, secret);
  
  return { valid: isValid, isLegacy: false };
}
```

---

### Step 5: Update Publish Handler

**File**: `workers/handlers/publish.ts`

Add token generation and storage when publishing:

```typescript
// Add imports at the top
import { generateOwnerToken, hashToken } from '../utils/auth';

// Inside handlePublish function, after card validation and before database insert:

// Generate owner token for new cards
let ownerToken: string | null = null;
let ownerTokenHash: string | null = null;

// Check if this is a new card or updating existing
const existingCard = await env.DB.prepare('SELECT id, owner_token_hash FROM cards WHERE id = ?')
  .bind(card.id)
  .first<{ id: string; owner_token_hash: string | null }>();

if (!existingCard) {
  // New card - generate token
  ownerToken = await generateOwnerToken();
  const secret = env.AUTH_SECRET || 'default-secret-change-in-production';
  ownerTokenHash = await hashToken(ownerToken, secret);
} else if (existingCard.owner_token_hash) {
  // Existing card with auth - require token
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized',
        message: 'This card requires authentication. Please provide an Authorization header.'
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Verify token
  const { verifyCardOwnership } = await import('../middleware/auth');
  const { valid } = await verifyCardOwnership(card.id, request, env);
  
  if (!valid) {
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Invalid authentication token'
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Keep existing token hash
  ownerTokenHash = existingCard.owner_token_hash;
} else {
  // Legacy card being republished - generate new token
  ownerToken = await generateOwnerToken();
  const secret = env.AUTH_SECRET || 'default-secret-change-in-production';
  ownerTokenHash = await hashToken(ownerToken, secret);
}

// Update the INSERT/UPDATE query to include owner_token_hash:
await env.DB.prepare(
  `INSERT INTO cards (
    id, username, profile_json, services_json, social_json, links_json,
    ratings_json, testimonials_json, client_photos_json, badges_json,
    certifications_json, recommendations_json, location_json, referral_code,
    published_at, updated_at, is_active, is_featured, subscription_tier,
    free_period_end, updates_enabled_until, endorsement_count, can_update, 
    payment_status, owner_token_hash
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    username = excluded.username,
    profile_json = excluded.profile_json,
    services_json = excluded.services_json,
    social_json = excluded.social_json,
    links_json = excluded.links_json,
    ratings_json = excluded.ratings_json,
    testimonials_json = excluded.testimonials_json,
    client_photos_json = excluded.client_photos_json,
    badges_json = excluded.badges_json,
    certifications_json = excluded.certifications_json,
    recommendations_json = excluded.recommendations_json,
    location_json = excluded.location_json,
    updated_at = excluded.updated_at,
    is_active = excluded.is_active,
    is_featured = excluded.is_featured,
    subscription_tier = excluded.subscription_tier,
    free_period_end = excluded.free_period_end,
    updates_enabled_until = excluded.updates_enabled_until,
    endorsement_count = excluded.endorsement_count,
    can_update = excluded.can_update,
    payment_status = excluded.payment_status,
    owner_token_hash = COALESCE(excluded.owner_token_hash, cards.owner_token_hash)
  `
)
  .bind(
    card.id,
    row.username,
    row.profile_json,
    row.services_json,
    row.social_json,
    row.links_json,
    row.ratings_json,
    row.testimonials_json,
    row.client_photos_json,
    row.badges_json,
    row.certifications_json,
    row.recommendations_json,
    row.location_json,
    row.referral_code,
    row.published_at || updatedAt,
    updatedAt,
    row.is_active,
    row.is_featured,
    row.subscription_tier,
    row.free_period_end,
    row.updates_enabled_until,
    row.endorsement_count,
    row.can_update,
    row.payment_status,
    ownerTokenHash  // Add this
  )
  .run();

// Return the token in the response (only for new cards or legacy cards being upgraded)
const publishedCard = rowToCard(result);
const response: any = publishedCard;
if (ownerToken) {
  response.owner_token = ownerToken; // Include token in response
  response.token_warning = 'Save this token securely. You will need it to update or delete this card.';
}

return new Response(JSON.stringify(response), {
  status: 200,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
```

---

### Step 6: Update Update Handler

**File**: `workers/handlers/update-card.ts`

Add authentication check at the beginning:

```typescript
// Add import at the top
import { verifyCardOwnership } from '../middleware/auth';

// At the start of handleUpdateCard function, after getting existing card:

// Verify ownership
const { valid, isLegacy } = await verifyCardOwnership(id, request, env);

if (!valid) {
  if (isLegacy) {
    // Legacy card - allow update but warn user to republish for security
    // (Optional: you can require republishing for legacy cards)
    // For now, we'll allow it but log it
    console.warn(`Legacy card ${id} updated without authentication`);
  } else {
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token'
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

// Continue with existing update logic...
```

---

### Step 7: Update Delete Handler

**File**: `workers/handlers/delete-card.ts`

Add authentication check:

```typescript
// Add import at the top
import { verifyCardOwnership } from '../middleware/auth';

// Update handleDeleteCard function:

export async function handleDeleteCard(
  id: string,
  request: Request,  // Add request parameter
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Verify ownership
    const { valid, isLegacy } = await verifyCardOwnership(id, request, env);
    
    if (!valid) {
      if (isLegacy) {
        // Legacy card - allow deletion but warn
        console.warn(`Legacy card ${id} deleted without authentication`);
      } else {
        return new Response(
          JSON.stringify({ 
            error: 'Unauthorized',
            message: 'Invalid or missing authentication token'
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    // Continue with existing delete logic...
    const result = await env.DB.prepare(
      'UPDATE cards SET is_active = 0, updated_at = ? WHERE id = ?'
    )
      .bind(Date.now(), id)
      .run();
    
    // ... rest of function
  } catch (error) {
    // ... error handling
  }
}
```

**Update the router** in `workers/index.ts` to pass `request`:

```typescript
if (path.startsWith('/api/card/') && method === 'DELETE') {
  const id = path.split('/api/card/')[1];
  return handleDeleteCard(id, request, env, corsHeaders);  // Add request parameter
}
```

---

### Step 8: Update Frontend - Token Storage

**File**: `src/lib/auth.ts` (new file)

```typescript
/**
 * Client-side authentication utilities
 * Handles token storage and retrieval
 */

const TOKEN_STORAGE_KEY_PREFIX = 'card_owner_token_';

/**
 * Store owner token for a card
 * Tokens are stored in localStorage (encrypted storage can be added later)
 */
export function storeOwnerToken(cardId: string, token: string): void {
  try {
    localStorage.setItem(`${TOKEN_STORAGE_KEY_PREFIX}${cardId}`, token);
  } catch (error) {
    console.error('Failed to store owner token:', error);
    // localStorage might be full or disabled
    // Could fall back to IndexedDB or sessionStorage
  }
}

/**
 * Get owner token for a card
 */
export function getOwnerToken(cardId: string): string | null {
  try {
    return localStorage.getItem(`${TOKEN_STORAGE_KEY_PREFIX}${cardId}`);
  } catch (error) {
    console.error('Failed to get owner token:', error);
    return null;
  }
}

/**
 * Remove owner token for a card
 */
export function removeOwnerToken(cardId: string): void {
  try {
    localStorage.removeItem(`${TOKEN_STORAGE_KEY_PREFIX}${cardId}`);
  } catch (error) {
    console.error('Failed to remove owner token:', error);
  }
}

/**
 * Get Authorization header value for a card
 */
export function getAuthHeader(cardId: string): string | null {
  const token = getOwnerToken(cardId);
  return token ? `Bearer ${token}` : null;
}

/**
 * Export token for backup (e.g., copy to another device)
 */
export function exportToken(cardId: string): { cardId: string; token: string } | null {
  const token = getOwnerToken(cardId);
  if (!token) return null;
  
  return { cardId, token };
}

/**
 * Import token from backup
 */
export function importToken(cardId: string, token: string): void {
  storeOwnerToken(cardId, token);
}
```

---

### Step 9: Update API Client

**File**: `src/lib/api.ts`

Update API client to include Authorization header:

```typescript
// Add import at the top
import { getAuthHeader } from './auth';

// Update fetchApi function to accept optional cardId:

async function fetchApi(
  endpoint: string,
  options: RequestInit = {},
  cardId?: string  // Add optional cardId parameter
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Add Authorization header if cardId is provided
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (cardId) {
    const authHeader = getAuthHeader(cardId);
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Unknown error',
      message: response.statusText,
    }));
    throw new ApiError(error.message || 'API request failed', response.status, error);
  }

  return response;
}

// Update methods to pass cardId:

export const api = {
  async publish(card: CardData, username?: string): Promise<PublishedCard> {
    // ... existing code ...
    
    const response = await fetchApi('/publish', {
      method: 'POST',
      body: JSON.stringify(publishedCard),
    }, card.id);  // Pass card ID for auth

    const publishedCard = await response.json();
    
    // Store token if returned in response
    if (publishedCard.owner_token) {
      const { storeOwnerToken } = await import('./auth');
      storeOwnerToken(publishedCard.id, publishedCard.owner_token);
    }
    
    return publishedCard;
  },

  async updateCard(id: string, updates: Partial<PublishedCard>): Promise<PublishedCard> {
    const response = await fetchApi(`/card/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, id);  // Pass card ID for auth

    return response.json();
  },

  async unpublish(id: string): Promise<void> {
    await fetchApi(`/card/${id}`, {
      method: 'DELETE',
    }, id);  // Pass card ID for auth
  },
  
  // ... other methods remain the same (they don't need auth)
};
```

---

### Step 10: Update Environment Configuration

**File**: `wrangler.workers.toml`

Add `AUTH_SECRET` to environment variables:

```toml
[env.production.vars]
AUTH_SECRET = "change-this-to-a-random-secret-in-production"

# Or use secrets (recommended for production):
# Set via: wrangler secret put AUTH_SECRET --config wrangler.workers.toml
```

**File**: `.dev.vars.example`

Add example:

```bash
# Authentication secret for hashing owner tokens
# Generate a random 32+ byte secret for production
AUTH_SECRET=dev-secret-change-in-production
```

**Set the secret in production**:
```bash
# Generate a random secret (32+ bytes)
openssl rand -base64 32

# Set it in Cloudflare Workers
npx wrangler secret put AUTH_SECRET --config wrangler.workers.toml --name amei-beauty-api
```

---

### Step 11: Update Types

**File**: `workers/types.ts`

Add `AUTH_SECRET` to `Env` interface:

```typescript
export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  ENVIRONMENT: string;
  ALLOWED_ORIGINS?: string;
  DEEPSEEK_API_KEY?: string;
  SERPAPI_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  AUTH_SECRET?: string;  // Add this
}
```

---

## Testing

### Manual Testing

1. **Publish a new card**:
   ```bash
   curl -X POST http://localhost:8787/api/publish \
     -H "Content-Type: application/json" \
     -d '{"id":"test-123","profile":{"full_name":"Test User"}}'
   ```
   - Should return `owner_token` in response
   - Token should be stored in localStorage

2. **Update card with valid token**:
   ```bash
   curl -X PUT http://localhost:8787/api/card/test-123 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token-from-publish>" \
     -d '{"profile":{"full_name":"Updated Name"}}'
   ```
   - Should succeed

3. **Update card without token**:
   ```bash
   curl -X PUT http://localhost:8787/api/card/test-123 \
     -H "Content-Type: application/json" \
     -d '{"profile":{"full_name":"Hacked"}}'
   ```
   - Should return 401 Unauthorized

4. **Update card with invalid token**:
   ```bash
   curl -X PUT http://localhost:8787/api/card/test-123 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer invalid-token" \
     -d '{"profile":{"full_name":"Hacked"}}'
   ```
   - Should return 401 Unauthorized

### Unit Tests

Create test file: `workers/utils/__tests__/auth.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { generateOwnerToken, hashToken, verifyToken } from '../auth';

describe('auth utilities', () => {
  it('generates unique tokens', async () => {
    const token1 = await generateOwnerToken();
    const token2 = await generateOwnerToken();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThan(40); // Base64url of 32 bytes
  });

  it('hashes and verifies tokens correctly', async () => {
    const token = await generateOwnerToken();
    const secret = 'test-secret';
    const hash = await hashToken(token, secret);
    
    expect(hash).toBeTruthy();
    expect(await verifyToken(token, hash, secret)).toBe(true);
    expect(await verifyToken('wrong-token', hash, secret)).toBe(false);
  });
});
```

---

## Migration Strategy for Existing Cards

### Option 1: Grandfather Existing Cards (Recommended)

- Existing cards (with `NULL` owner_token_hash) remain accessible without auth
- New cards require authentication
- Users can republish to get a token (upgrade to authenticated)

**Pros**: Smooth transition, no breaking changes  
**Cons**: Legacy cards remain vulnerable until republished

### Option 2: Generate Tokens On-Demand

When a legacy card is updated/deleted:
1. Generate a token
2. Store hash in database
3. Return token to user (one-time)
4. User must save token for future use

**Pros**: All cards eventually secured  
**Cons**: Complex, users might lose one-time token

### Option 3: Require Republishing

- Legacy cards become read-only
- Users must republish to get token
- Cleanest approach

**Pros**: All cards secured immediately  
**Cons**: Requires user action, might lose some users

**Recommendation**: Use **Option 1** for smooth transition, then encourage republishing.

---

## Security Considerations

1. **Token Storage**:
   - ✅ Tokens stored in localStorage (can be upgraded to encrypted storage later)
   - ✅ Tokens hashed in database (HMAC-SHA256)
   - ✅ HTTPS only (enforced by Cloudflare)

2. **Token Length**:
   - ✅ 32 bytes (256 bits) - cryptographically secure
   - ✅ Base64url encoding - URL-safe, no padding

3. **Secret Management**:
   - ✅ Secret stored in environment variables
   - ✅ Use Cloudflare Secrets for production
   - ⚠️ Change default secret in production!

4. **Timing Attacks**:
   - ✅ Constant-time comparison in `verifyToken`
   - ✅ Prevents timing-based token enumeration

5. **Legacy Cards**:
   - ⚠️ Legacy cards remain accessible without auth
   - 💡 Consider requiring republishing after grace period

---

## Next Steps

1. ✅ Create database migration
2. ✅ Implement auth utilities
3. ✅ Update handlers
4. ✅ Update frontend
5. ✅ Set AUTH_SECRET in production
6. ✅ Test thoroughly
7. ✅ Deploy
8. 💡 Add token export/import UI (future)
9. 💡 Add encrypted token storage (future)
10. 💡 Add token recovery via phone/email (future)

---

## Troubleshooting

### Token verification fails
- Check that `AUTH_SECRET` is set correctly
- Verify token is being sent in Authorization header
- Check token format (should be base64url, no padding)

### Legacy cards not working
- This is expected - legacy cards have `NULL` owner_token_hash
- Users need to republish to get a token

### Token lost
- Currently no recovery mechanism
- User must republish card (will get new token)
- Future: Add phone/email verification for recovery

---

**Status**: Ready for Implementation

