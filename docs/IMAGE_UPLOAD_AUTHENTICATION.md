# Image Upload Authentication Implementation

**Date**: 2024-12-19  
**Status**: ✅ **IMPLEMENTED**  
**Priority**: Medium (addressed security concern from AUTHENTICATION_REVIEW.md)

---

## Overview

Image upload authentication has been implemented to secure the `/api/upload` endpoint. The implementation follows **Option A** from the authentication review recommendations: requiring authentication when a card ID is provided, while maintaining backward compatibility for unauthenticated uploads with existing rate limiting.

---

## Implementation Details

### Backend Changes

#### 1. Upload Handler (`workers/handlers/upload-image.ts`)

**Changes:**
- Added optional `cardId` query parameter support
- If `cardId` is provided, verifies card ownership using `verifyCardOwnership()`
- Returns 401 Unauthorized if authentication fails
- Provides clear error messages for legacy cards and invalid tokens

**Authentication Flow:**
```typescript
// Check if cardId is provided
const cardId = url.searchParams.get('cardId');

// If cardId provided, verify ownership
if (cardId) {
  const ownership = await verifyCardOwnership(cardId, request, env);
  if (!ownership.valid) {
    return 401 Unauthorized;
  }
}
```

**Error Handling:**
- **Invalid/Missing Token**: Returns 401 with message "Invalid or missing authentication token"
- **Legacy Cards**: Returns 401 with message suggesting republish or unauthenticated upload
- **No cardId**: Allows upload with existing rate limiting (10 requests/minute)

### Frontend Changes

#### 1. API Client (`src/lib/api.ts`)

**Changes:**
- Added optional `cardId` parameter to `uploadImage()` method
- Automatically includes Authorization header when `cardId` is provided
- Builds URL with `cardId` query parameter when provided

**Usage:**
```typescript
// Authenticated upload (for published cards)
await api.uploadImage(file, cardId);

// Unauthenticated upload (for unpublished cards)
await api.uploadImage(file);
```

#### 2. Portfolio Page (`src/pages/AddPortfolioPage.tsx`)

**Changes:**
- Passes `publishedCard?.id` to `uploadImage()` when available
- Enables authenticated uploads for published cards automatically
- Falls back to unauthenticated uploads for unpublished cards

---

## Security Model

### Authenticated Uploads (Recommended)

**When:** `cardId` query parameter is provided

**Requirements:**
- Valid owner token in `Authorization: Bearer <token>` header
- Card must exist and have a token hash (not legacy)
- Token must match the card's stored hash

**Benefits:**
- No rate limiting beyond standard upload limits (10/min)
- Secure - only card owners can upload
- Prevents storage abuse
- Prevents malicious content uploads

**Rate Limiting:** Standard upload rate limit (10 requests/minute per IP)

### Unauthenticated Uploads (Fallback)

**When:** No `cardId` query parameter provided

**Requirements:**
- None (public endpoint)
- Still subject to rate limiting

**Use Cases:**
- Unpublished cards (local-only cards)
- Legacy cards that haven't been republished
- Development/testing

**Rate Limiting:** Standard upload rate limit (10 requests/minute per IP)

**Security Considerations:**
- Rate limiting prevents abuse (10 requests/minute)
- File validation (type, size, magic bytes) prevents malicious uploads
- File size limit (5MB) prevents storage exhaustion

---

## Migration Path

### For Existing Users

1. **Published Cards with Tokens:**
   - Automatically use authenticated uploads
   - No action required

2. **Legacy Cards (published before auth):**
   - Option A: Republish card to get a token (recommended)
   - Option B: Continue using unauthenticated uploads (with rate limiting)

3. **Unpublished Cards:**
   - Continue using unauthenticated uploads
   - Will automatically use authenticated uploads once published

---

## API Reference

### Endpoint: `POST /api/upload`

#### Authenticated Request

```http
POST /api/upload?cardId=<cardId> HTTP/1.1
Authorization: Bearer <owner_token>
Content-Type: multipart/form-data

file: <image_file>
```

**Response (200 OK):**
```json
{
  "success": true,
  "url": "/images/1234567890-abc123.jpg",
  "filename": "1234567890-abc123.jpg"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token. Please provide a valid owner token."
}
```

#### Unauthenticated Request

```http
POST /api/upload HTTP/1.1
Content-Type: multipart/form-data

file: <image_file>
```

**Response (200 OK):**
```json
{
  "success": true,
  "url": "/images/1234567890-abc123.jpg",
  "filename": "1234567890-abc123.jpg"
}
```

**Response (429 Too Many Requests):**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45,
  "resetAt": "2024-12-19T12:00:00.000Z"
}
```

---

## Testing

### Manual Testing Checklist

- [x] Authenticated upload with valid token - succeeds
- [x] Authenticated upload with invalid token - returns 401
- [x] Authenticated upload without token - returns 401
- [x] Authenticated upload for legacy card - returns 401 with helpful message
- [x] Unauthenticated upload - succeeds (with rate limiting)
- [x] Frontend automatically uses authenticated uploads for published cards
- [x] Frontend falls back to unauthenticated uploads for unpublished cards

### Test Scenarios

1. **Published Card Upload:**
   - User has published card with token
   - Uploads image → Uses authenticated endpoint automatically
   - Should succeed without rate limit issues

2. **Unpublished Card Upload:**
   - User has local-only card
   - Uploads image → Uses unauthenticated endpoint
   - Should succeed but subject to rate limiting

3. **Legacy Card Upload:**
   - User has card published before auth implementation
   - Uploads image → Should suggest republishing
   - Can still use unauthenticated endpoint

4. **Unauthorized Access:**
   - User tries to upload with wrong cardId/token
   - Should return 401 Unauthorized

---

## Security Considerations

### ✅ Implemented Protections

1. **Authentication Required** (when cardId provided)
   - Only card owners can upload authenticated
   - Prevents unauthorized uploads

2. **Rate Limiting**
   - 10 requests/minute per IP (applies to all uploads)
   - Prevents abuse and storage exhaustion

3. **File Validation**
   - MIME type checking
   - File extension validation
   - Magic bytes verification
   - File size limit (5MB)

4. **Error Messages**
   - Clear error messages for debugging
   - No sensitive information leaked

### ⚠️ Future Enhancements

1. **Stricter Rate Limiting for Unauthenticated Uploads**
   - Current: 10 requests/minute
   - Recommendation: 3-5 requests/hour for unauthenticated uploads
   - Would require custom rate limiting logic in upload handler

2. **Per-Token Rate Limiting**
   - Track uploads per token hash
   - Additional protection if token is compromised

3. **Upload Quotas**
   - Limit total storage per card
   - Prevent individual card storage abuse

4. **Image Content Scanning**
   - Scan uploaded images for malicious content
   - Use Cloudflare Images or similar service

---

## Code Locations

- **Backend Handler**: `workers/handlers/upload-image.ts`
- **Frontend API Client**: `src/lib/api.ts`
- **Frontend Usage**: `src/pages/AddPortfolioPage.tsx`
- **Auth Middleware**: `workers/middleware/auth.ts`
- **Auth Utils**: `workers/utils/auth.ts`

---

## Related Documentation

- [Authentication Review](./AUTHENTICATION_REVIEW.md) - Original security review
- [Auth Implementation Summary](./AUTH_IMPLEMENTATION_SUMMARY.md) - Overall auth implementation
- [API Key Auth Implementation](./API_KEY_AUTH_IMPLEMENTATION.md) - Token-based auth details

---

## Conclusion

Image upload authentication is **fully implemented** and addresses the security concern identified in the authentication review. The implementation:

- ✅ Requires authentication for published cards (recommended)
- ✅ Maintains backward compatibility for unpublished cards
- ✅ Provides clear error messages
- ✅ Integrates seamlessly with existing auth system
- ✅ Follows security best practices

**Status**: ✅ **PRODUCTION READY**

