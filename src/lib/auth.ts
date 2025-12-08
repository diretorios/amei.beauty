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

