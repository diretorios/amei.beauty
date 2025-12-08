# Integration Tests for Auth Flows

This directory contains integration tests for authentication flows in the amei.beauty Workers API.

## Test Structure

### `helpers/test-env.ts`
Test utilities for creating mock Cloudflare Worker environments:
- `MockD1Database`: In-memory mock of D1Database for testing
- `createTestEnv()`: Creates a mock Worker environment with test configuration
- `createCorsHeaders()`: Creates CORS headers for test requests
- `createTestCard()`: Creates test card data
- `createAuthenticatedRequest()`: Creates a Request with Authorization header

### `auth.integration.test.ts`
Comprehensive integration tests covering:

1. **Publish Flow**
   - New card publishing (generates token)
   - Republishing existing card (requires auth)
   - Republishing with valid token
   - Legacy card upgrade (generates new token)

2. **Update Flow**
   - Update with valid token
   - Update without token (rejected)
   - Update with invalid token (rejected)
   - Update with token from different card (rejected)

3. **Delete Flow**
   - Delete with valid token
   - Delete without token (rejected)
   - Delete with invalid token (rejected)

4. **Complete Auth Lifecycle**
   - Full flow: publish -> update -> delete
   - Token consistency across multiple operations

5. **Error Cases**
   - Missing Authorization header
   - Malformed Authorization header
   - Non-existent card ID

## Running Tests

```bash
# Run all tests
npm test

# Run only integration tests
npm test -- workers/__tests__/auth.integration.test.ts

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

## Test Coverage

These integration tests verify:
- ✅ Token generation and storage
- ✅ Token verification and validation
- ✅ Authorization header parsing
- ✅ Card ownership verification
- ✅ Complete CRUD operations with authentication
- ✅ Error handling for unauthorized access
- ✅ Legacy card handling

## Mock Database

The `MockD1Database` implements a simplified in-memory database that handles:
- SELECT queries with WHERE clauses
- INSERT queries with ON CONFLICT UPDATE
- UPDATE queries
- Column selection (SELECT * vs SELECT specific columns)

Note: This is a simplified mock for testing purposes. It does not implement all SQL features, only those needed for the auth flow tests.

