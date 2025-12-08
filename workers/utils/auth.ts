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

