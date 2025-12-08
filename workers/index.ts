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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers - restrict origins in production
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['*'];
    const origin = request.headers.get('Origin') || '';
    const isAllowedOrigin = allowedOrigins.includes('*') || allowedOrigins.includes(origin);
    const corsOrigin = isAllowedOrigin ? origin || '*' : allowedOrigins[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      if (path === '/api/publish' && method === 'POST') {
        return handlePublish(request, env, corsHeaders);
      }

      if (path.startsWith('/api/card/') && method === 'GET') {
        const id = path.split('/api/card/')[1];
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
  },
};

