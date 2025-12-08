import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  storeOwnerToken,
  getOwnerToken,
  removeOwnerToken,
  getAuthHeader,
  exportToken,
  importToken,
} from '../auth';

describe('auth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('storeOwnerToken', () => {
    it('should store a token for a card', () => {
      const cardId = 'test-card-123';
      const token = 'test-token-abc';

      storeOwnerToken(cardId, token);

      expect(localStorage.getItem(`card_owner_token_${cardId}`)).toBe(token);
    });

    it('should overwrite existing token for the same card', () => {
      const cardId = 'test-card-123';
      const token1 = 'token-1';
      const token2 = 'token-2';

      storeOwnerToken(cardId, token1);
      storeOwnerToken(cardId, token2);

      expect(localStorage.getItem(`card_owner_token_${cardId}`)).toBe(token2);
    });

    it('should handle localStorage errors gracefully', () => {
      const cardId = 'test-card-123';
      const token = 'test-token';

      // Mock localStorage.setItem to throw an error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => storeOwnerToken(cardId, token)).not.toThrow();

      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });

    it('should store tokens for different cards independently', () => {
      const cardId1 = 'card-1';
      const cardId2 = 'card-2';
      const token1 = 'token-1';
      const token2 = 'token-2';

      storeOwnerToken(cardId1, token1);
      storeOwnerToken(cardId2, token2);

      expect(localStorage.getItem(`card_owner_token_${cardId1}`)).toBe(token1);
      expect(localStorage.getItem(`card_owner_token_${cardId2}`)).toBe(token2);
    });
  });

  describe('getOwnerToken', () => {
    it('should retrieve a stored token', () => {
      const cardId = 'test-card-123';
      const token = 'test-token-abc';

      localStorage.setItem(`card_owner_token_${cardId}`, token);

      expect(getOwnerToken(cardId)).toBe(token);
    });

    it('should return null for non-existent token', () => {
      expect(getOwnerToken('non-existent-card')).toBeNull();
    });

    it('should return null for empty cardId', () => {
      expect(getOwnerToken('')).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const cardId = 'test-card-123';

      // Mock localStorage.getItem to throw an error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage access denied');
      });

      // Should return null instead of throwing
      expect(getOwnerToken(cardId)).toBeNull();

      localStorage.getItem = originalGetItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('removeOwnerToken', () => {
    it('should remove a stored token', () => {
      const cardId = 'test-card-123';
      const token = 'test-token-abc';

      localStorage.setItem(`card_owner_token_${cardId}`, token);
      removeOwnerToken(cardId);

      expect(localStorage.getItem(`card_owner_token_${cardId}`)).toBeNull();
    });

    it('should not throw when removing non-existent token', () => {
      expect(() => removeOwnerToken('non-existent-card')).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      const cardId = 'test-card-123';

      // Mock localStorage.removeItem to throw an error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage access denied');
      });

      // Should not throw
      expect(() => removeOwnerToken(cardId)).not.toThrow();

      localStorage.removeItem = originalRemoveItem;
      consoleErrorSpy.mockRestore();
    });

    it('should only remove token for specified card', () => {
      const cardId1 = 'card-1';
      const cardId2 = 'card-2';
      const token1 = 'token-1';
      const token2 = 'token-2';

      localStorage.setItem(`card_owner_token_${cardId1}`, token1);
      localStorage.setItem(`card_owner_token_${cardId2}`, token2);

      removeOwnerToken(cardId1);

      expect(localStorage.getItem(`card_owner_token_${cardId1}`)).toBeNull();
      expect(localStorage.getItem(`card_owner_token_${cardId2}`)).toBe(token2);
    });
  });

  describe('getAuthHeader', () => {
    it('should return Bearer token format when token exists', () => {
      const cardId = 'test-card-123';
      const token = 'test-token-abc';

      localStorage.setItem(`card_owner_token_${cardId}`, token);

      expect(getAuthHeader(cardId)).toBe(`Bearer ${token}`);
    });

    it('should return null when token does not exist', () => {
      expect(getAuthHeader('non-existent-card')).toBeNull();
    });

    it('should return null when token is empty string', () => {
      const cardId = 'test-card-123';
      localStorage.setItem(`card_owner_token_${cardId}`, '');

      // Empty string is falsy, so getOwnerToken returns null
      expect(getAuthHeader(cardId)).toBeNull();
    });

    it('should properly format token with special characters', () => {
      const cardId = 'test-card-123';
      const token = 'token-with-special-chars-!@#$%^&*()';

      localStorage.setItem(`card_owner_token_${cardId}`, token);

      expect(getAuthHeader(cardId)).toBe(`Bearer ${token}`);
    });
  });

  describe('exportToken', () => {
    it('should export token and cardId when token exists', () => {
      const cardId = 'test-card-123';
      const token = 'test-token-abc';

      localStorage.setItem(`card_owner_token_${cardId}`, token);

      const exported = exportToken(cardId);

      expect(exported).toEqual({ cardId, token });
    });

    it('should return null when token does not exist', () => {
      expect(exportToken('non-existent-card')).toBeNull();
    });

    it('should return correct structure', () => {
      const cardId = 'card-456';
      const token = 'token-xyz';

      localStorage.setItem(`card_owner_token_${cardId}`, token);

      const exported = exportToken(cardId);

      expect(exported).toHaveProperty('cardId');
      expect(exported).toHaveProperty('token');
      expect(exported?.cardId).toBe(cardId);
      expect(exported?.token).toBe(token);
    });
  });

  describe('importToken', () => {
    it('should import and store a token', () => {
      const cardId = 'test-card-123';
      const token = 'imported-token-abc';

      importToken(cardId, token);

      expect(localStorage.getItem(`card_owner_token_${cardId}`)).toBe(token);
    });

    it('should overwrite existing token when importing', () => {
      const cardId = 'test-card-123';
      const existingToken = 'existing-token';
      const importedToken = 'imported-token';

      localStorage.setItem(`card_owner_token_${cardId}`, existingToken);
      importToken(cardId, importedToken);

      expect(localStorage.getItem(`card_owner_token_${cardId}`)).toBe(importedToken);
    });

    it('should work with exportToken for round-trip', () => {
      const cardId = 'test-card-123';
      const token = 'test-token-abc';

      // Store and export
      storeOwnerToken(cardId, token);
      const exported = exportToken(cardId);

      // Clear and import
      removeOwnerToken(cardId);
      if (exported) {
        importToken(exported.cardId, exported.token);
      }

      expect(getOwnerToken(cardId)).toBe(token);
    });
  });

  describe('integration tests', () => {
    it('should handle complete token lifecycle', () => {
      const cardId = 'lifecycle-card';
      const token = 'lifecycle-token';

      // Store
      storeOwnerToken(cardId, token);
      expect(getOwnerToken(cardId)).toBe(token);

      // Get auth header
      expect(getAuthHeader(cardId)).toBe(`Bearer ${token}`);

      // Export
      const exported = exportToken(cardId);
      expect(exported).toEqual({ cardId, token });

      // Remove
      removeOwnerToken(cardId);
      expect(getOwnerToken(cardId)).toBeNull();
      expect(getAuthHeader(cardId)).toBeNull();

      // Import
      if (exported) {
        importToken(exported.cardId, exported.token);
        expect(getOwnerToken(cardId)).toBe(token);
      }
    });

    it('should handle multiple cards simultaneously', () => {
      const cards = [
        { id: 'card-1', token: 'token-1' },
        { id: 'card-2', token: 'token-2' },
        { id: 'card-3', token: 'token-3' },
      ];

      // Store all tokens
      cards.forEach(({ id, token }) => {
        storeOwnerToken(id, token);
      });

      // Verify all tokens
      cards.forEach(({ id, token }) => {
        expect(getOwnerToken(id)).toBe(token);
        expect(getAuthHeader(id)).toBe(`Bearer ${token}`);
      });

      // Remove one token
      removeOwnerToken(cards[1].id);

      // Verify remaining tokens
      expect(getOwnerToken(cards[0].id)).toBe(cards[0].token);
      expect(getOwnerToken(cards[1].id)).toBeNull();
      expect(getOwnerToken(cards[2].id)).toBe(cards[2].token);
    });
  });
});

