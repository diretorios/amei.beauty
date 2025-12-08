/**
 * Input validation and sanitization utilities
 */

/**
 * Validate username format
 * - 3-30 characters
 * - Alphanumeric, hyphens, underscores only
 * - Must start with letter or number
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (username.length > 30) {
    return { valid: false, error: 'Username must be 30 characters or less' };
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, hyphens, and underscores',
    };
  }
  return { valid: true };
}

/**
 * Sanitize username (remove invalid characters)
 */
export function sanitizeUsername(username: string): string {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .substring(0, 30);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'URL is required' };
  }
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use http or https protocol' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize URL (ensure proper format)
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  // Remove whitespace
  url = url.trim();
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Validate WhatsApp number
 * - Must contain only digits and optional + prefix
 * - Minimum 10 digits
 * - Maximum 15 digits (with country code)
 */
export function validateWhatsAppNumber(phone: string): { valid: boolean; error?: string } {
  if (!phone) {
    return { valid: false, error: 'WhatsApp number is required' };
  }
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  const digitsOnly = cleaned.replace('+', '');
  
  if (digitsOnly.length < 10) {
    return { valid: false, error: 'WhatsApp number must be at least 10 digits' };
  }
  if (digitsOnly.length > 15) {
    return { valid: false, error: 'WhatsApp number must be 15 digits or less' };
  }
  if (!/^\+?\d{10,15}$/.test(cleaned)) {
    return { valid: false, error: 'Invalid WhatsApp number format' };
  }
  return { valid: true };
}

/**
 * Validate text length
 */
export function validateTextLength(
  text: string,
  fieldName: string,
  maxLength: number,
  minLength = 0
): { valid: boolean; error?: string } {
  if (minLength > 0 && text.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  if (text.length > maxLength) {
    return { valid: false, error: `${fieldName} must be ${maxLength} characters or less` };
  }
  return { valid: true };
}

/**
 * Sanitize HTML (basic - remove script tags and dangerous attributes)
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove event handlers
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  // Remove javascript: protocol
  html = html.replace(/javascript:/gi, '');
  return html;
}

/**
 * Validate search query (prevent injection patterns)
 */
export function validateSearchQuery(query: string): { valid: boolean; error?: string } {
  if (!query) return { valid: true };
  if (query.length > 200) {
    return { valid: false, error: 'Search query too long' };
  }
  // Check for SQL injection patterns
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|'|"|`)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
  ];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      return { valid: false, error: 'Invalid search query' };
    }
  }
  return { valid: true };
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  // Remove dangerous characters
  return query
    .replace(/[<>'"`;]/g, '')
    .substring(0, 200)
    .trim();
}

