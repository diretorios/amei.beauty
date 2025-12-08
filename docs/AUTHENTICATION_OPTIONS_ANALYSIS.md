# Authentication & Authorization Options Analysis

**Date**: 2024-12-19  
**Issue**: No authentication/authorization — anyone can modify/delete cards  
**Severity**: CRITICAL  
**Status**: Analysis Only — No Implementation

---

## Executive Summary

The current system has **no authentication or authorization mechanisms**. Anyone who knows or guesses a card ID can:
- Update any card (`PUT /api/card/:id`)
- Delete/unpublish any card (`DELETE /api/card/:id`)
- Publish cards without verification (`POST /api/publish`)

This is a **critical security vulnerability** that must be addressed before production deployment.

---

## Current State Analysis

### Current Architecture

- **Frontend**: Preact PWA (client-side only)
- **Backend**: Cloudflare Workers + D1 (SQLite)
- **Storage**: 
  - Local: IndexedDB + localStorage (unpublished cards)
  - Remote: D1 database (published cards)
- **No User Accounts**: Cards are published anonymously
- **No Ownership Tracking**: Database schema has no `user_id`, `owner_id`, or similar fields

### Vulnerable Endpoints

1. **`POST /api/publish`** - No authentication required
   - Anyone can publish cards
   - No rate limiting
   - No verification of card ownership

2. **`PUT /api/card/:id`** - No ownership verification
   - Checks update permissions (free period, endorsements, payment)
   - But does NOT verify the requester owns the card
   - Anyone with the card ID can update it

3. **`DELETE /api/card/:id`** - No ownership verification
   - Soft deletes (sets `is_active = 0`)
   - No verification that requester owns the card
   - Anyone can unpublish any card

### Database Schema

```sql
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  -- ... card data fields ...
  -- ❌ NO owner_id, user_id, or auth_token fields
);
```

**Missing**: Any field to track card ownership or link cards to users.

---

## Authentication Options Evaluation

### Option 1: API Key-Based Authentication (Simplest)

#### How It Works
- Each card gets a unique, secret API key when published
- Key stored in database: `owner_token` field (hashed)
- Client stores key in localStorage (encrypted at rest)
- All state-changing requests require `Authorization: Bearer <token>` header
- Server verifies token matches card's `owner_token` hash

#### Pros
- ✅ **Simplest to implement** - No external services needed
- ✅ **No user accounts** - Aligns with current architecture
- ✅ **Stateless** - Works well with Cloudflare Workers
- ✅ **Fast** - Single database lookup
- ✅ **MEI-friendly** - No passwords, no email verification
- ✅ **Works offline-first** - Key stored locally, can be backed up

#### Cons
- ⚠️ **Key management** - Users must securely store their key
- ⚠️ **Key recovery** - If lost, card cannot be updated (but can be republished)
- ⚠️ **No multi-device sync** - Key must be manually copied between devices
- ⚠️ **Security risk if exposed** - Anyone with key can modify card

#### Implementation Complexity
- **Low** - ~2-3 days
- Requires: Database migration, token generation, middleware, frontend storage

#### Security Level
- **Medium** - Better than nothing, but keys can be stolen
- Mitigation: Use long, random keys (32+ bytes), hash in database, HTTPS only

#### User Experience
- **Good** - Key generated automatically, stored locally
- User never sees key unless they export it
- Can add "Export Key" feature for backup

---

### Option 2: WhatsApp + OTP Verification (Recommended in Original Plan)

#### How It Works
- User provides WhatsApp number during publish
- System sends OTP via WhatsApp Business API
- User enters OTP to verify ownership
- Session token issued (JWT or session ID)
- Token stored in database linked to card
- All requests require valid session token

#### Pros
- ✅ **MEI-friendly** - WhatsApp is primary communication channel
- ✅ **No passwords** - OTP-based verification
- ✅ **Phone number as identity** - Natural for Brazilian market
- ✅ **Can verify ownership** - Only person with phone can verify
- ✅ **Multi-device** - Can re-verify on new device

#### Cons
- ⚠️ **External dependency** - Requires WhatsApp Business API
- ⚠️ **Cost** - WhatsApp API has usage costs
- ⚠️ **Complexity** - More moving parts (OTP generation, verification flow)
- ⚠️ **Rate limiting** - Need to prevent OTP spam
- ⚠️ **Privacy** - Requires phone number collection

#### Implementation Complexity
- **Medium-High** - ~5-7 days
- Requires: WhatsApp API integration, OTP service, session management, database schema changes

#### Security Level
- **High** - Phone number verification is strong
- Mitigation: Rate limit OTP requests, expire OTPs quickly (5-10 min)

#### User Experience
- **Good** - Familiar flow for Brazilian users
- Extra step during publish (OTP verification)
- Can add "Remember this device" option

---

### Option 3: Email + Magic Link (Passwordless)

#### How It Works
- User provides email during publish
- System sends magic link via email
- User clicks link to verify ownership
- Session token issued
- Token stored in database linked to card

#### Pros
- ✅ **No passwords** - Magic link authentication
- ✅ **Familiar** - Users understand email verification
- ✅ **Multi-device** - Can verify on any device
- ✅ **Recovery** - Can resend magic link

#### Cons
- ⚠️ **Email dependency** - Requires email service (SendGrid, AWS SES, etc.)
- ⚠️ **Cost** - Email service costs
- ⚠️ **Less MEI-friendly** - Many MEIs prefer WhatsApp over email
- ⚠️ **Spam risk** - Magic links can be phished
- ⚠️ **Complexity** - Email service integration, link generation/validation

#### Implementation Complexity
- **Medium** - ~4-5 days
- Requires: Email service integration, magic link generation, session management

#### Security Level
- **Medium-High** - Email verification is standard
- Mitigation: Expire links quickly (15-30 min), use secure tokens

#### User Experience
- **Good** - Familiar email verification flow
- Extra step (check email, click link)
- May be less preferred than WhatsApp for MEIs

---

### Option 4: WebAuthn (Passwordless, Most Secure)

#### How It Works
- User registers with device biometrics (fingerprint, face ID) or security key
- Public key stored in database
- Challenge-response authentication for each request
- No passwords, no secrets to store

#### Pros
- ✅ **Most secure** - Uses public key cryptography
- ✅ **No passwords** - Biometric or hardware key
- ✅ **Phishing-resistant** - Domain-bound credentials
- ✅ **Modern standard** - W3C WebAuthn specification
- ✅ **No secrets stored** - Only public keys

#### Cons
- ⚠️ **Browser support** - Good but not universal (older browsers)
- ⚠️ **Complexity** - Most complex to implement
- ⚠️ **User education** - Users may not understand biometric auth
- ⚠️ **Device-bound** - Credentials tied to device (can be limitation)
- ⚠️ **Recovery** - If device lost, need backup method

#### Implementation Complexity
- **High** - ~7-10 days
- Requires: WebAuthn library, credential management, challenge generation, database schema

#### Security Level
- **Very High** - Industry best practice
- Mitigation: Provide backup authentication method

#### User Experience
- **Good** - Seamless biometric auth on supported devices
- May confuse users unfamiliar with WebAuthn
- Requires device with biometrics or security key

---

### Option 5: Nostr Keypair (From Original PROMPT)

#### How It Works
- Generate Nostr keypair locally (client-side)
- Public key stored in database as `owner_pubkey`
- Sign all state-changing requests with private key
- Server verifies signature using public key

#### Pros
- ✅ **Decentralized** - No central authority
- ✅ **Privacy-preserving** - No personal info required
- ✅ **Aligns with PROMPT** - Mentioned in original requirements
- ✅ **Cryptographic proof** - Digital signatures prove ownership
- ✅ **No server secrets** - Only public keys stored

#### Cons
- ⚠️ **Niche** - Most users don't know what Nostr is
- ⚠️ **Key management** - Users must securely store private key
- ⚠️ **Recovery** - If private key lost, cannot recover
- ⚠️ **Complexity** - Requires cryptographic library
- ⚠️ **Not MEI-friendly** - Too technical for target audience

#### Implementation Complexity
- **Medium-High** - ~5-6 days
- Requires: Nostr library, signature generation/verification, key management UI

#### Security Level
- **High** - Cryptographic signatures are secure
- Mitigation: Provide key export/import for backup

#### User Experience
- **Poor** - Too technical for MEI audience
- Users won't understand keypairs
- Key management is complex

---

### Option 6: Hybrid Approach (API Key + Optional Verification)

#### How It Works
- Default: API key-based auth (Option 1)
- Optional: Add phone/email verification for enhanced security
- Users can upgrade to verified accounts later
- Unverified cards have basic protection (API key)
- Verified cards have stronger protection (can recover access)

#### Pros
- ✅ **Flexible** - Works for all users
- ✅ **Progressive** - Start simple, add verification later
- ✅ **MEI-friendly** - Simple by default, optional verification
- ✅ **Best of both** - Security + usability

#### Cons
- ⚠️ **Complexity** - Two auth paths to maintain
- ⚠️ **Confusion** - Users may not understand difference

#### Implementation Complexity
- **Medium** - ~4-5 days (start with API key, add verification later)

#### Security Level
- **Medium-High** - Can be upgraded per user

#### User Experience
- **Excellent** - Simple by default, optional enhancement

---

## Recommendation Matrix

| Option | Security | UX | Complexity | MEI-Friendly | Cost | Recommendation |
|--------|----------|----|-----------|---------------|------|----------------|
| **API Key** | Medium | Good | Low | ✅ Excellent | Free | ⭐ **Best for MVP** |
| **WhatsApp OTP** | High | Good | Medium-High | ✅ Excellent | Low | ⭐ **Best long-term** |
| **Email Magic Link** | Medium-High | Good | Medium | ⚠️ Moderate | Low | Consider |
| **WebAuthn** | Very High | Good | High | ⚠️ Moderate | Free | Future enhancement |
| **Nostr** | High | Poor | Medium-High | ❌ Poor | Free | Not recommended |
| **Hybrid** | Medium-High | Excellent | Medium | ✅ Excellent | Low | ⭐ **Best overall** |

---

## Recommended Approach: Phased Implementation

### Phase 1: Immediate (MVP) - API Key Authentication
**Timeline**: 2-3 days  
**Goal**: Secure the system quickly with minimal complexity

**Implementation**:
1. Add `owner_token_hash` field to `cards` table
2. Generate random 32-byte token on publish
3. Hash token (bcrypt or similar) before storing
4. Store plain token in localStorage (encrypted)
5. Require `Authorization: Bearer <token>` header for PUT/DELETE
6. Verify token hash matches on each request

**Benefits**:
- Quick to implement
- Immediately secures the system
- No external dependencies
- Works with current architecture

**Limitations**:
- Key recovery not possible (but can republish)
- No multi-device sync (but can export/import key)

---

### Phase 2: Short-term (1-2 months) - Add WhatsApp Verification
**Timeline**: 5-7 days  
**Goal**: Add optional verification for better UX and recovery

**Implementation**:
1. Add `phone_number` and `phone_verified` fields
2. Integrate WhatsApp Business API
3. Add OTP verification flow
4. Link verified phone to card for recovery
5. Allow "upgrade" from API key to verified account

**Benefits**:
- Better user experience
- Key recovery possible
- Multi-device support
- Aligns with MEI preferences

---

### Phase 3: Long-term (3-6 months) - Enhanced Security
**Timeline**: Variable  
**Goal**: Add WebAuthn and other enhancements

**Options**:
- WebAuthn for biometric auth
- Multi-factor authentication
- Session management improvements
- Audit logging

---

## Implementation Details: API Key Approach (Phase 1)

### Database Migration

```sql
-- Migration: Add owner token for authentication
ALTER TABLE cards ADD COLUMN owner_token_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_owner_token_hash ON cards(owner_token_hash);
```

### Token Generation

```typescript
// Generate secure random token
import { randomBytes } from 'crypto';

function generateOwnerToken(): string {
  return randomBytes(32).toString('base64url'); // 43 characters, URL-safe
}

// Hash token before storing
import bcrypt from 'bcryptjs';

async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

async function verifyToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}
```

### Middleware

```typescript
// workers/middleware/auth.ts
export async function verifyCardOwnership(
  cardId: string,
  authHeader: string | null,
  env: Env
): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  const card = await env.DB.prepare(
    'SELECT owner_token_hash FROM cards WHERE id = ?'
  ).bind(cardId).first<{ owner_token_hash: string | null }>();
  
  if (!card?.owner_token_hash) {
    return false; // Card has no owner token (legacy card)
  }
  
  return verifyToken(token, card.owner_token_hash);
}
```

### Handler Updates

```typescript
// workers/handlers/update-card.ts
export async function handleUpdateCard(...) {
  const authHeader = request.headers.get('Authorization');
  
  if (!await verifyCardOwnership(id, authHeader, env)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    );
  }
  
  // ... rest of update logic
}
```

### Frontend Storage

```typescript
// src/lib/auth.ts
const TOKEN_STORAGE_KEY = 'card_owner_token_';

export function storeOwnerToken(cardId: string, token: string): void {
  // Encrypt token before storing (use Web Crypto API)
  const encrypted = encryptToken(token);
  localStorage.setItem(`${TOKEN_STORAGE_KEY}${cardId}`, encrypted);
}

export function getOwnerToken(cardId: string): string | null {
  const encrypted = localStorage.getItem(`${TOKEN_STORAGE_KEY}${cardId}`);
  if (!encrypted) return null;
  return decryptToken(encrypted);
}

export function getAuthHeader(cardId: string): string | null {
  const token = getOwnerToken(cardId);
  return token ? `Bearer ${token}` : null;
}
```

### API Client Updates

```typescript
// src/lib/api.ts
async function apiRequest(url: string, options: RequestInit = {}, cardId?: string) {
  const headers = new Headers(options.headers);
  
  if (cardId) {
    const authHeader = getAuthHeader(cardId);
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }
  }
  
  return fetch(url, { ...options, headers });
}
```

---

## Security Considerations

### Token Storage
- ✅ **Encrypt tokens in localStorage** - Use Web Crypto API
- ✅ **Hash tokens in database** - Use bcrypt or similar
- ✅ **HTTPS only** - Never transmit tokens over HTTP
- ✅ **Token length** - Use 32+ bytes (256 bits) for security

### Token Recovery
- ⚠️ **No recovery** - If token lost, user must republish card
- 💡 **Future**: Add phone/email verification for recovery
- 💡 **Future**: Add "Export Key" feature for backup

### Legacy Cards
- ⚠️ **Existing cards** - Cards published before auth will have no `owner_token_hash`
- 💡 **Solution**: Allow republishing to get new token
- 💡 **Alternative**: Generate tokens for existing cards on first access

### Rate Limiting
- ✅ **Add rate limiting** - Prevent brute force attacks
- ✅ **Limit by IP** - Use Cloudflare Rate Limiting
- ✅ **Limit by token** - Track failed attempts per token

---

## Migration Strategy

### For Existing Cards

**Option A: Grandfather existing cards**
- Existing cards remain accessible without auth
- New cards require authentication
- Gradually migrate users to republish with auth

**Option B: Generate tokens for existing cards**
- On first update/delete attempt, generate token
- Send token to user via email/WhatsApp
- Store token in database

**Option C: Require republishing**
- Existing cards become read-only
- Users must republish to get token
- Cleanest approach, but requires user action

**Recommendation**: **Option A** (grandfather) for smooth transition, then encourage republishing.

---

## Testing Requirements

### Unit Tests
- Token generation uniqueness
- Token hashing/verification
- Auth middleware logic
- Legacy card handling

### Integration Tests
- Publish with token generation
- Update with valid token
- Update with invalid token
- Update without token (legacy)
- Delete with valid token
- Delete with invalid token

### Security Tests
- Token brute force resistance
- Token length validation
- Hash comparison timing attacks
- Token storage encryption

---

## Next Steps

1. **Review this analysis** - Confirm approach and priorities
2. **Choose Phase 1 implementation** - API key vs. other option
3. **Design database migration** - Add `owner_token_hash` field
4. **Implement token generation** - Secure random token creation
5. **Add auth middleware** - Verify ownership on state-changing requests
6. **Update handlers** - Add auth checks to PUT/DELETE endpoints
7. **Update frontend** - Store and send tokens
8. **Add tests** - Comprehensive test coverage
9. **Deploy** - Roll out authentication system

---

## Questions to Answer

1. **Which option should we implement?**
   - API Key (simplest, fastest)
   - WhatsApp OTP (best UX, more complex)
   - Hybrid (flexible, progressive)

2. **How to handle existing cards?**
   - Grandfather (no auth required)
   - Generate tokens on-demand
   - Require republishing

3. **Token storage approach?**
   - localStorage (current)
   - IndexedDB (more secure)
   - Encrypted storage (most secure)

4. **Recovery mechanism?**
   - None (republish required)
   - Phone verification (future)
   - Email verification (future)

5. **Rate limiting strategy?**
   - Cloudflare Rate Limiting (easiest)
   - Custom Workers implementation
   - Both (defense in depth)

---

## References

- [SECURITY_REVIEW_2024.md](./SECURITY_REVIEW_2024.md) - Original security review
- [IMPLEMENTATION_RECOMMENDATIONS.md](./IMPLEMENTATION_RECOMMENDATIONS.md) - Original auth recommendations
- [SECURITY_TESTING_REQUIREMENTS.md](./SECURITY_TESTING_REQUIREMENTS.md) - Security testing guidelines

---

**Status**: ✅ Analysis Complete — Awaiting Decision on Implementation Approach

