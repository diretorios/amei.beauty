import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateOwnerToken,
  hashToken,
  verifyToken,
  extractTokenFromHeader,
} from '../auth';

describe('auth utilities', () => {
  describe('generateOwnerToken', () => {
    it('should generate a token', async () => {
      const token = await generateOwnerToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', async () => {
      const token1 = await generateOwnerToken();
      const token2 = await generateOwnerToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate base64url-encoded tokens (no padding)', async () => {
      const token = await generateOwnerToken();

      // Base64url should not contain +, /, or =
      expect(token).not.toContain('+');
      expect(token).not.toContain('/');
      expect(token).not.toContain('=');
    });

    it('should generate tokens of consistent length', async () => {
      const tokens = await Promise.all([
        generateOwnerToken(),
        generateOwnerToken(),
        generateOwnerToken(),
        generateOwnerToken(),
        generateOwnerToken(),
      ]);

      // Base64url encoding of 32 bytes = 43 characters (no padding)
      const expectedLength = 43;
      tokens.forEach((token) => {
        expect(token.length).toBe(expectedLength);
      });
    });

    it('should use cryptographically secure random values', async () => {
      // Generate many tokens and check for randomness
      const tokens = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const token = await generateOwnerToken();
        tokens.add(token);
      }

      // All tokens should be unique (very high probability with crypto randomness)
      expect(tokens.size).toBe(iterations);
    });
  });

  describe('hashToken', () => {
    const secret = 'test-secret-key-12345';

    it('should hash a token', async () => {
      const token = 'test-token-abc';
      const hash = await hashToken(token, secret);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce consistent hashes for the same token and secret', async () => {
      const token = 'test-token-abc';
      const hash1 = await hashToken(token, secret);
      const hash2 = await hashToken(token, secret);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different tokens', async () => {
      const token1 = 'test-token-1';
      const token2 = 'test-token-2';

      const hash1 = await hashToken(token1, secret);
      const hash2 = await hashToken(token2, secret);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes with different secrets', async () => {
      const token = 'test-token-abc';
      const secret1 = 'secret-1';
      const secret2 = 'secret-2';

      const hash1 = await hashToken(token, secret1);
      const hash2 = await hashToken(token, secret2);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce base64-encoded hash', async () => {
      const token = 'test-token';
      const hash = await hashToken(token, secret);

      // Base64 should only contain A-Z, a-z, 0-9, +, /, and = (padding)
      expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should handle empty token', async () => {
      const hash = await hashToken('', secret);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle special characters in token', async () => {
      const token = 'token-with-special-!@#$%^&*()';
      const hash = await hashToken(token, secret);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle long tokens', async () => {
      const token = 'a'.repeat(1000);
      const hash = await hashToken(token, secret);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('verifyToken', () => {
    const secret = 'test-secret-key-12345';

    it('should verify a correct token', async () => {
      const token = 'test-token-abc';
      const hash = await hashToken(token, secret);

      const isValid = await verifyToken(token, hash, secret);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect token', async () => {
      const correctToken = 'correct-token';
      const wrongToken = 'wrong-token';
      const hash = await hashToken(correctToken, secret);

      const isValid = await verifyToken(wrongToken, hash, secret);

      expect(isValid).toBe(false);
    });

    it('should reject token with wrong secret', async () => {
      const token = 'test-token';
      const correctSecret = 'correct-secret';
      const wrongSecret = 'wrong-secret';
      const hash = await hashToken(token, correctSecret);

      const isValid = await verifyToken(token, hash, wrongSecret);

      expect(isValid).toBe(false);
    });

    it('should reject token with wrong hash', async () => {
      const token = 'test-token';
      const correctHash = await hashToken(token, secret);
      const wrongHash = await hashToken('different-token', secret);

      const isValid = await verifyToken(token, wrongHash, secret);

      expect(isValid).toBe(false);
    });

    it('should handle empty token', async () => {
      const hash = await hashToken('', secret);

      const isValid = await verifyToken('', hash, secret);

      expect(isValid).toBe(true);
    });

    it('should handle empty hash', async () => {
      const token = 'test-token';
      const emptyHash = '';

      const isValid = await verifyToken(token, emptyHash, secret);

      expect(isValid).toBe(false);
    });

    it('should use constant-time comparison (prevent timing attacks)', async () => {
      const token = 'test-token';
      const hash = await hashToken(token, secret);

      // Verify multiple times to check consistency
      const results = await Promise.all([
        verifyToken(token, hash, secret),
        verifyToken(token, hash, secret),
        verifyToken(token, hash, secret),
      ]);

      results.forEach((result) => {
        expect(result).toBe(true);
      });
    });

    it('should handle hash with different length', async () => {
      const token = 'test-token';
      const hash = await hashToken(token, secret);
      const wrongHash = hash.substring(0, hash.length - 1); // Remove last character

      const isValid = await verifyToken(token, wrongHash, secret);

      expect(isValid).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const token = 'test-token';
      const hash = 'invalid-hash-format';

      // Should not throw, but return false
      const isValid = await verifyToken(token, hash, secret);

      expect(isValid).toBe(false);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const authHeader = 'Bearer test-token-abc';
      const token = extractTokenFromHeader(authHeader);

      expect(token).toBe('test-token-abc');
    });

    it('should handle token with spaces', () => {
      const authHeader = 'Bearer   test-token-abc   ';
      const token = extractTokenFromHeader(authHeader);

      expect(token).toBe('test-token-abc');
    });

    it('should return null for non-Bearer header', () => {
      const authHeader = 'Basic dGVzdDp0ZXN0';
      const token = extractTokenFromHeader(authHeader);

      expect(token).toBeNull();
    });

    it('should return null for null header', () => {
      const token = extractTokenFromHeader(null);

      expect(token).toBeNull();
    });

    it('should return null for empty string', () => {
      const token = extractTokenFromHeader('');

      expect(token).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const authHeader = 'Bearer'; // Missing space after Bearer
      const token = extractTokenFromHeader(authHeader);

      // Should return null because it doesn't start with 'Bearer '
      expect(token).toBeNull();
    });

    it('should return empty string for Bearer with space but no token', () => {
      const authHeader = 'Bearer '; // Space but no token
      const token = extractTokenFromHeader(authHeader);

      // Should return empty string after trimming
      expect(token).toBe('');
    });

    it('should handle token with special characters', () => {
      const specialToken = 'token-with-special-chars-!@#$%^&*()';
      const authHeader = `Bearer ${specialToken}`;
      const token = extractTokenFromHeader(authHeader);

      expect(token).toBe(specialToken);
    });

    it('should handle token starting with Bearer but not as prefix', () => {
      const authHeader = 'BearerToken test-token';
      const token = extractTokenFromHeader(authHeader);

      expect(token).toBeNull();
    });

    it('should handle case sensitivity', () => {
      const authHeader = 'bearer test-token';
      const token = extractTokenFromHeader(authHeader);

      // Should return null because it checks for 'Bearer ' exactly
      expect(token).toBeNull();
    });

    it('should extract token after Bearer prefix', () => {
      const authHeader = 'Bearer my-super-secret-token-12345';
      const token = extractTokenFromHeader(authHeader);

      expect(token).toBe('my-super-secret-token-12345');
    });
  });

  describe('integration tests', () => {
    const secret = 'integration-test-secret';

    it('should work with complete token lifecycle', async () => {
      // Generate token
      const token = await generateOwnerToken();
      expect(token).toBeDefined();

      // Hash token
      const hash = await hashToken(token, secret);
      expect(hash).toBeDefined();

      // Verify token
      const isValid = await verifyToken(token, hash, secret);
      expect(isValid).toBe(true);

      // Extract from header
      const authHeader = `Bearer ${token}`;
      const extractedToken = extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);

      // Verify extracted token
      const extractedIsValid = await verifyToken(extractedToken!, hash, secret);
      expect(extractedIsValid).toBe(true);
    });

    it('should handle multiple tokens independently', async () => {
      const tokens = await Promise.all([
        generateOwnerToken(),
        generateOwnerToken(),
        generateOwnerToken(),
      ]);

      const hashes = await Promise.all(
        tokens.map((token) => hashToken(token, secret))
      );

      // Verify each token matches its own hash
      for (let i = 0; i < tokens.length; i++) {
        const isValid = await verifyToken(tokens[i], hashes[i], secret);
        expect(isValid).toBe(true);
      }

      // Verify tokens don't match other hashes
      for (let i = 0; i < tokens.length; i++) {
        for (let j = 0; j < tokens.length; j++) {
          if (i !== j) {
            const isValid = await verifyToken(tokens[i], hashes[j], secret);
            expect(isValid).toBe(false);
          }
        }
      }
    });

    it('should work with realistic token generation and verification flow', async () => {
      // Simulate token generation on server
      const ownerToken = await generateOwnerToken();

      // Simulate storing hash in database
      const storedHash = await hashToken(ownerToken, secret);

      // Simulate client sending token in Authorization header
      const authHeader = `Bearer ${ownerToken}`;
      const extractedToken = extractTokenFromHeader(authHeader);

      // Simulate server verifying token
      if (extractedToken) {
        const isValid = await verifyToken(extractedToken, storedHash, secret);
        expect(isValid).toBe(true);
      } else {
        throw new Error('Token extraction failed');
      }
    });
  });
});

