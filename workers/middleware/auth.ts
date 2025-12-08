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
 * @returns Object with valid flag and isLegacy flag
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

