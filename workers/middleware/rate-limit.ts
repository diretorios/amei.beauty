/**
 * Rate limiting middleware for API endpoints
 * Uses Cloudflare KV to track request counts per IP address
 */

import type { Env } from '../types';

export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Whether to use sliding window (true) or fixed window (false) */
  slidingWindow?: boolean;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in the current window */
  remaining: number;
  /** When the rate limit resets (Unix timestamp in seconds) */
  resetAt: number;
}

/**
 * Default rate limit configurations by endpoint type
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Read endpoints - more lenient
  read: {
    maxRequests: 100,
    windowSeconds: 60, // 100 requests per minute
    slidingWindow: true,
  },
  // Write endpoints - stricter
  write: {
    maxRequests: 20,
    windowSeconds: 60, // 20 requests per minute
    slidingWindow: true,
  },
  // Authentication-sensitive endpoints - very strict
  auth: {
    maxRequests: 10,
    windowSeconds: 60, // 10 requests per minute
    slidingWindow: true,
  },
  // Image upload - strict due to resource usage
  upload: {
    maxRequests: 10,
    windowSeconds: 60, // 10 requests per minute
    slidingWindow: true,
  },
  // Search endpoints - moderate
  search: {
    maxRequests: 50,
    windowSeconds: 60, // 50 requests per minute
    slidingWindow: true,
  },
  // Payment endpoints - strict for security
  payment: {
    maxRequests: 5,
    windowSeconds: 60, // 5 requests per minute
    slidingWindow: true,
  },
};

/**
 * Get the client IP address from the request
 * Uses Cloudflare's CF-Connecting-IP header
 */
function getClientIP(request: Request): string {
  // Cloudflare provides the real client IP in this header
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to X-Forwarded-For (for local development)
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  // Last resort: use a default identifier (not ideal, but better than nothing)
  return 'unknown';
}

/**
 * Generate a KV key for rate limiting
 * Includes app prefix to allow sharing KV namespace across applications
 */
function getRateLimitKey(
  ip: string,
  endpoint: string,
  windowStart: number,
  appPrefix: string = 'amei-beauty'
): string {
  return `${appPrefix}:rate_limit:${endpoint}:${ip}:${windowStart}`;
}

/**
 * Check and enforce rate limiting
 * 
 * @param request - The incoming request
 * @param env - Worker environment variables
 * @param endpointType - Type of endpoint (read, write, auth, upload, search, payment)
 * @param customConfig - Optional custom rate limit configuration
 * @returns Rate limit result with allowed status and remaining requests
 */
export async function checkRateLimit(
  request: Request,
  env: Env,
  endpointType: keyof typeof RATE_LIMITS,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> {
  // If KV is not configured, allow the request (fail open for development)
  if (!env.RATE_LIMIT_KV) {
    console.warn('Rate limit KV not configured, allowing request');
    return {
      allowed: true,
      remaining: 999,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    };
  }

  const config = customConfig || RATE_LIMITS[endpointType] || RATE_LIMITS.read;
  const clientIP = getClientIP(request);
  const now = Math.floor(Date.now() / 1000);
  const appPrefix = env.RATE_LIMIT_APP_PREFIX || 'amei-beauty';
  
  if (config.slidingWindow) {
    return await checkSlidingWindow(clientIP, endpointType, config, env, now, appPrefix);
  } else {
    return await checkFixedWindow(clientIP, endpointType, config, env, now, appPrefix);
  }
}

/**
 * Check rate limit using sliding window algorithm
 * More accurate but requires more KV operations
 */
async function checkSlidingWindow(
  ip: string,
  endpointType: string,
  config: RateLimitConfig,
  env: Env,
  now: number,
  appPrefix: string
): Promise<RateLimitResult> {
  const windowStart = Math.floor(now / config.windowSeconds) * config.windowSeconds;
  const key = getRateLimitKey(ip, endpointType, windowStart, appPrefix);
  
  // Get current count
  const countStr = await env.RATE_LIMIT_KV.get(key);
  const currentCount = countStr ? parseInt(countStr, 10) : 0;
  
  // Check if limit exceeded
  if (currentCount >= config.maxRequests) {
    const resetAt = windowStart + config.windowSeconds;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }
  
  // Increment count
  const newCount = currentCount + 1;
  // Store with expiration equal to window size
  await env.RATE_LIMIT_KV.put(key, newCount.toString(), {
    expirationTtl: config.windowSeconds + 1, // Add 1 second buffer
  });
  
  const resetAt = windowStart + config.windowSeconds;
  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - newCount),
    resetAt,
  };
}

/**
 * Check rate limit using fixed window algorithm
 * Simpler but can allow bursts at window boundaries
 */
async function checkFixedWindow(
  ip: string,
  endpointType: string,
  config: RateLimitConfig,
  env: Env,
  now: number,
  appPrefix: string
): Promise<RateLimitResult> {
  const windowStart = Math.floor(now / config.windowSeconds) * config.windowSeconds;
  const key = getRateLimitKey(ip, endpointType, windowStart, appPrefix);
  
  // Get current count
  const countStr = await env.RATE_LIMIT_KV.get(key);
  const currentCount = countStr ? parseInt(countStr, 10) : 0;
  
  // Check if limit exceeded
  if (currentCount >= config.maxRequests) {
    const resetAt = windowStart + config.windowSeconds;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }
  
  // Increment count
  const newCount = currentCount + 1;
  // Store with expiration equal to window size
  await env.RATE_LIMIT_KV.put(key, newCount.toString(), {
    expirationTtl: config.windowSeconds + 1, // Add 1 second buffer
  });
  
  const resetAt = windowStart + config.windowSeconds;
  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - newCount),
    resetAt,
  };
}

/**
 * Create a rate limit error response
 */
export function createRateLimitResponse(
  resetAt: number,
  corsHeaders: Record<string, string>
): Response {
  const retryAfter = Math.max(0, resetAt - Math.floor(Date.now() / 1000));
  
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
      resetAt: new Date(resetAt * 1000).toISOString(),
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': 'N/A', // Will be set by endpoint-specific middleware
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetAt.toString(),
      },
    }
  );
}

/**
 * Determine endpoint type from path and method
 */
export function getEndpointType(path: string, method: string): keyof typeof RATE_LIMITS {
  // Payment endpoints - very strict
  if (path.includes('/payment/')) {
    return 'payment';
  }
  
  // Upload endpoints - strict
  if (path.includes('/upload')) {
    return 'upload';
  }
  
  // Write operations - stricter
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    // Auth-sensitive endpoints
    if (path.includes('/publish') || path.includes('/card/')) {
      return 'auth';
    }
    return 'write';
  }
  
  // Search endpoints
  if (path.includes('/search') || path.includes('/directory')) {
    return 'search';
  }
  
  // Default to read for GET requests
  return 'read';
}

