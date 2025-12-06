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
import { handleAIComplete } from './handlers/ai-complete';
import { handleDetectLocation } from './handlers/detect-location';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
        return handleDeleteCard(id, env, corsHeaders);
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

      if (path === '/api/ai/complete' && method === 'POST') {
        return handleAIComplete(request, env, corsHeaders);
      }

      if (path === '/api/detect-location' && method === 'GET') {
        return handleDetectLocation(request, env, corsHeaders);
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
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

