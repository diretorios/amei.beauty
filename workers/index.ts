/**
 * Cloudflare Workers API for amei.beauty
 * Handles publishing, discovery, and card management
 */

import type { Env } from './types';
import { handlePublish } from './handlers/publish';
import { handleGetCard } from './handlers/get-card';
import { handleUpdateCard } from './handlers/update-card';
import { handleDeleteCard } from './handlers/delete-card';
import { handleSearch } from './handlers/search';
import { handleDirectory } from './handlers/directory';
import { handleUploadImage } from './handlers/upload-image';
import { handleDetectLocation } from './handlers/detect-location';
import { handleEndorse } from './handlers/endorse';
import { handlePaymentCheckout, handlePaymentWebhook } from './handlers/payment';
import { handleCspReport } from './handlers/csp-report';
import {
  checkRateLimit,
  createRateLimitResponse,
  getEndpointType,
  RATE_LIMITS,
} from './middleware/rate-limit';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Default CORS headers - ensure they're always set
    const defaultCorsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    };

    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      // CORS headers - restrict origins in production
      const allowedOrigins = env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || ['*'];
      const origin = request.headers.get('Origin') || '';
      
      // Determine CORS origin
      let corsOrigin = '*';
      if (allowedOrigins.includes('*')) {
        // Allow all origins
        corsOrigin = origin || '*';
      } else if (origin && allowedOrigins.includes(origin)) {
        // Origin is in allowed list
        corsOrigin = origin;
      } else if (allowedOrigins.length > 0) {
        // Use first allowed origin as fallback
        corsOrigin = allowedOrigins[0];
      }

      const corsHeaders = {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // 24 hours
      };

    // Handle preflight requests (no rate limiting needed)
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Apply rate limiting (skip for health check, webhooks, and CSP reports)
    // Webhooks are verified by signature and shouldn't be rate limited by IP
    // CSP reports are low-volume and shouldn't be rate limited
    if (path !== '/api/health' && path !== '/api/payment/webhook' && path !== '/api/csp-report') {
      const endpointType = getEndpointType(path, method);
      const rateLimitResult = await checkRateLimit(request, env, endpointType);

      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult.resetAt, corsHeaders);
      }

      // Add rate limit headers to CORS headers for successful responses
      const config = RATE_LIMITS[endpointType];
      corsHeaders['X-RateLimit-Limit'] = config.maxRequests.toString();
      corsHeaders['X-RateLimit-Remaining'] = rateLimitResult.remaining.toString();
      corsHeaders['X-RateLimit-Reset'] = rateLimitResult.resetAt.toString();
    }

    try {
      // Route handling
      if (path === '/api/publish' && method === 'POST') {
        return handlePublish(request, env, corsHeaders);
      }

      if (path.startsWith('/api/card/') && method === 'GET') {
        const id = path.split('/api/card/')[1];
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Card ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return handleGetCard(id, env, corsHeaders);
      }

      if (path.startsWith('/api/card/') && method === 'PUT') {
        const id = path.split('/api/card/')[1];
        return handleUpdateCard(id, request, env, corsHeaders);
      }

      if (path.startsWith('/api/card/') && method === 'DELETE') {
        const id = path.split('/api/card/')[1];
        return handleDeleteCard(id, request, env, corsHeaders);
      }

      if (path === '/api/search' && method === 'GET') {
        return handleSearch(request, env, corsHeaders);
      }

      if (path === '/api/directory' && method === 'GET') {
        return handleDirectory(request, env, corsHeaders);
      }

      if (path === '/api/upload' && method === 'POST') {
        return handleUploadImage(request, env, corsHeaders);
      }

      if (path === '/api/detect-location' && method === 'GET') {
        return handleDetectLocation(request, env, corsHeaders);
      }

      if (path === '/api/endorse' && method === 'POST') {
        return handleEndorse(request, env, corsHeaders);
      }

      if (path === '/api/payment/checkout' && method === 'POST') {
        return handlePaymentCheckout(request, env, corsHeaders);
      }

      if (path === '/api/payment/webhook' && method === 'POST') {
        return handlePaymentWebhook(request, env, corsHeaders);
      }

      if (path === '/api/csp-report' && method === 'POST') {
        return handleCspReport(request, env, corsHeaders);
      }

      // API root - return API information
      if (path === '/api' && method === 'GET') {
        return new Response(
          JSON.stringify({
            name: 'amei.beauty API',
            version: '1.0.0',
            status: 'ok',
            endpoints: {
              health: '/api/health',
              publish: '/api/publish',
              card: '/api/card/:id',
              search: '/api/search',
              directory: '/api/directory',
              upload: '/api/upload',
              'detect-location': '/api/detect-location',
              endorse: '/api/endorse',
              payment: {
                checkout: '/api/payment/checkout',
                webhook: '/api/payment/webhook',
              },
              'csp-report': '/api/csp-report',
            },
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Health check
      if (path === '/api/health' && method === 'GET') {
        return new Response(
          JSON.stringify({ status: 'ok', timestamp: Date.now() }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      // Log detailed error server-side only
      console.error('Worker error:', error);
      
      // Return generic error message to client (don't expose internal details)
      // Always include CORS headers, even on errors
      const isDevelopment = env.ENVIRONMENT === 'development';
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: isDevelopment && error instanceof Error ? error.message : 'An error occurred. Please try again later.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    } catch (outerError) {
      // Catch any errors that occur before CORS headers are set (e.g., URL parsing, CORS header generation)
      console.error('Critical worker error:', outerError);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'An error occurred. Please try again later.',
        }),
        {
          status: 500,
          headers: { ...defaultCorsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

